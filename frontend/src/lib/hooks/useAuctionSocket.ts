"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../socket";
import { authStorage } from "../auth-storage";
import { auctionApi } from "../api";
import type { BidEntry } from "../types/auction";

interface AuctionSocketState {
  currentPrice: number;
  totalBids: number;
  endTime: string;
  isExtended: boolean;
  extendCount: number;
  auctionStatus: "active" | "ended" | "buyout";
  winnerId: string | null;
  finalPrice: number | null;
  bids: BidEntry[];
  isLeading: boolean | null;
  hasBid: boolean;
  proxyMessage: string | null;
  proxyMaxBid: number | null;
  error: string | null;
  connected: boolean;
  bidSuccess: boolean;
  viewerCount: number;
}

interface UseAuctionSocketReturn extends AuctionSocketState {
  placeBid: (amount: number, maxAutoBid?: number) => void;
  buyout: () => void;
  clearError: () => void;
  clearBidSuccess: () => void;
}

// Simple UUID v4 generator (no crypto dependency needed)
function generateRequestId(): string {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

export function useAuctionSocket(
  auctionId: string,
  initialData: {
    currentPrice: number;
    totalBids: number;
    endTime: string;
    recentBids: BidEntry[];
    status: string;
  },
): UseAuctionSocketReturn {
  const [state, setState] = useState<AuctionSocketState>(() => {
    // Derive initial isLeading from recentBids (SSR-safe)
    let initialIsLeading: boolean | null = null;
    let initialHasBid: boolean = false;
    
    if (typeof window !== "undefined") {
      const user = authStorage.getUser() as { id?: string } | null;
      if (user?.id && initialData.recentBids.length > 0) {
        initialIsLeading = initialData.recentBids[0].bidder.id === user.id;
        initialHasBid = initialData.recentBids.some((b) => b.bidder.id === user.id);
      }
    }

    return {
      currentPrice: initialData.currentPrice,
      totalBids: initialData.totalBids,
      endTime: initialData.endTime,
      isExtended: false,
      extendCount: 0,
      auctionStatus: initialData.status as "active" | "ended",
      winnerId: null,
      finalPrice: null,
      bids: initialData.recentBids,
      isLeading: initialIsLeading,
      hasBid: initialHasBid,
      proxyMessage: null,
      proxyMaxBid: null,
      error: null,
      connected: false,
      bidSuccess: false,
      viewerCount: 0,
    };
  });

  const mountedRef = useRef(true);
  const pendingProxyMaxRef = useRef<number | null>(null);
  const statusFetchedRef = useRef(false);

  // Fetch user's bid status on mount (leading + proxy max) — authoritative source
  useEffect(() => {
    if (statusFetchedRef.current) return;
    const token = authStorage.getToken();
    if (!token) return;

    statusFetchedRef.current = true;
    auctionApi.getMyBidStatus(auctionId)
      .then((res) => {
        if (!mountedRef.current) return;
        const { isLeading, proxyMaxBid, hasBid } = res.data;
        setState((prev) => ({
          ...prev,
          isLeading: isLeading ?? prev.isLeading,
          hasBid: hasBid ?? prev.hasBid,
          proxyMaxBid: proxyMaxBid ?? prev.proxyMaxBid,
        }));
      })
      .catch(() => {
        // Non-critical — silent fail
      });
  }, [auctionId]);

  useEffect(() => {
    mountedRef.current = true;

    const token = authStorage.getToken();
    if (!token) return;

    let socket: ReturnType<typeof connectSocket>;
    try {
      socket = connectSocket();
    } catch {
      return;
    }

    // Join auction room
    if (socket.connected) {
      setState((prev) => ({ ...prev, connected: true }));
      socket.emit("auction:join", { auctionId });
    }

    const onConnect = () => {
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, connected: true }));
        socket.emit("auction:join", { auctionId });
      }
    };

    const onDisconnect = () => {
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, connected: false }));
      }
    };

    // ── Bid placed (broadcast to room) ────────────────────────────────────
    const onBidPlaced = (data: { bid: BidEntry; currentPrice: number; totalBids: number }) => {
      if (!mountedRef.current) return;
      setState((prev) => {
        // Deduplicate by bid ID
        if (prev.bids.some(b => b.id === data.bid.id)) return prev;

        return {
          ...prev,
          currentPrice: data.currentPrice,
          totalBids: data.totalBids,
          bids: [data.bid, ...prev.bids].slice(0, 50),
        };
      });
    };

    // ── Outbid notification (private) ─────────────────────────────────────
    const onOutbid = (data: { auctionId: string; currentPrice: number }) => {
      if (!mountedRef.current || data.auctionId !== auctionId) return;
      setState((prev) => ({
        ...prev,
        currentPrice: data.currentPrice,
        isLeading: false,
        proxyMessage: null,
        proxyMaxBid: null,
      }));
    };

    // ── Proxy auto-bid triggered (private) ────────────────────────────────
    const onProxyActive = (data: { auctionId: string; message: string }) => {
      if (!mountedRef.current || data.auctionId !== auctionId) return;
      setState((prev) => ({
        ...prev,
        proxyMessage: data.message,
        isLeading: true,
      }));
    };

    // ── Anti-sniping extension ────────────────────────────────────────────
    const onExtended = (data: { auctionId: string; newEndTime: string; extendCount: number }) => {
      if (!mountedRef.current || data.auctionId !== auctionId) return;
      setState((prev) => ({
        ...prev,
        endTime: data.newEndTime,
        isExtended: true,
        extendCount: data.extendCount,
      }));
    };

    // ── Auction ended ─────────────────────────────────────────────────────
    const onEnded = (data: { auctionId: string; winnerId: string | null; finalPrice: number | null }) => {
      if (!mountedRef.current || data.auctionId !== auctionId) return;
      setState((prev) => ({
        ...prev,
        auctionStatus: "ended",
        winnerId: data.winnerId,
        finalPrice: data.finalPrice,
      }));
    };

    // ── Buyout ────────────────────────────────────────────────────────────
    const onBuyout = (data: { auctionId: string; buyerId: string; price: number }) => {
      if (!mountedRef.current || data.auctionId !== auctionId) return;
      setState((prev) => ({
        ...prev,
        auctionStatus: "buyout",
        currentPrice: data.price,
        winnerId: data.buyerId,
        finalPrice: data.price,
      }));
    };

    // ── Bid success (private confirmation) ────────────────────────────────
    const onBidSuccess = () => {
      if (!mountedRef.current) return;
      setState((prev) => ({
        ...prev,
        isLeading: true,
        hasBid: true,
        error: null,
        bidSuccess: true,
        proxyMaxBid: pendingProxyMaxRef.current ?? prev.proxyMaxBid,
      }));
      pendingProxyMaxRef.current = null;
    };

    // ── Bid error ─────────────────────────────────────────────────────────
    const onBidError = (data: { message: string }) => {
      if (!mountedRef.current) return;
      setState((prev) => ({ ...prev, error: data.message }));
      pendingProxyMaxRef.current = null;
    };

    // ── Viewer count ──────────────────────────────────────────────────────
    const onViewerCount = (data: { auctionId: string; count: number }) => {
      if (!mountedRef.current || data.auctionId !== auctionId) return;
      setState((prev) => ({ ...prev, viewerCount: data.count }));
    };

    // Register all listeners using named references (safer cleanup)
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("auction:bid_placed", onBidPlaced);
    socket.on("auction:outbid", onOutbid);
    socket.on("auction:proxy_active", onProxyActive);
    socket.on("auction:extended", onExtended);
    socket.on("auction:ended", onEnded);
    socket.on("auction:buyout", onBuyout);
    socket.on("bid:success", onBidSuccess);
    socket.on("bid:error", onBidError);
    socket.on("auction:viewer_count", onViewerCount);

    return () => {
      mountedRef.current = false;
      socket.emit("auction:leave", { auctionId });
      // Remove only OUR specific listeners (not all listeners for these events)
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("auction:bid_placed", onBidPlaced);
      socket.off("auction:outbid", onOutbid);
      socket.off("auction:proxy_active", onProxyActive);
      socket.off("auction:extended", onExtended);
      socket.off("auction:ended", onEnded);
      socket.off("auction:buyout", onBuyout);
      socket.off("bid:success", onBidSuccess);
      socket.off("bid:error", onBidError);
      socket.off("auction:viewer_count", onViewerCount);
    };
  }, [auctionId]);

  const placeBid = useCallback(
    (amount: number, maxAutoBid?: number) => {
      const socket = getSocket();
      if (!socket?.connected) {
        setState((prev) => ({ ...prev, error: "Mất kết nối, vui lòng thử lại" }));
        return;
      }
      // Store proxy max to set on success
      pendingProxyMaxRef.current = maxAutoBid ?? null;
      // Generate unique requestId for idempotency
      const requestId = generateRequestId();
      socket.emit("bid:place", { auctionId, amount, maxAutoBid, requestId });
    },
    [auctionId],
  );

  const buyout = useCallback(() => {
    const socket = getSocket();
    if (!socket?.connected) {
      setState((prev) => ({ ...prev, error: "Mất kết nối, vui lòng thử lại" }));
      return;
    }
    socket.emit("bid:buyout", { auctionId });
  }, [auctionId]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearBidSuccess = useCallback(() => {
    setState((prev) => ({ ...prev, bidSuccess: false }));
  }, []);

  return {
    ...state,
    placeBid,
    buyout,
    clearError,
    clearBidSuccess,
  };
}
