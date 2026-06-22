"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket } from "../socket";
import type { ChatMessageData } from "../types/auction";

interface UseLiveChatReturn {
  messages: ChatMessageData[];
  sendMessage: (text: string, parentId?: string) => void;
  toggleLike: (messageId: string) => void;
  loadMore: () => void;
  hasMore: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  clearError: () => void;
}

export function useLiveChat(auctionId: string): UseLiveChatReturn {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const socket = getSocket();
    if (!socket) return;

    const onChatMessage = (msg: ChatMessageData) => {
      if (!mountedRef.current) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [msg, ...prev]; // Newest first
      });
    };

    const onChatHistory = (data: { messages: ChatMessageData[]; nextCursor: string | null }) => {
      if (!mountedRef.current) return;
      
      setMessages((prev) => {
        const newMessages = data.messages.filter((newMsg) => !prev.some((m) => m.id === newMsg.id));
        return [...prev, ...newMessages]; // Append older messages
      });
      cursorRef.current = data.nextCursor;
      setHasMore(!!data.nextCursor);
      setIsLoadingHistory(false);
    };

    const onChatError = (data: { message: string }) => {
      if (!mountedRef.current) return;
      setError(data.message);
    };

    const onLikeUpdated = (data: { messageId: string; likeCount: number; likedByUser?: boolean }) => {
      if (!mountedRef.current) return;
      setMessages((prev) => 
        prev.map((msg) => {
          if (msg.id === data.messageId) {
            return {
              ...msg,
              likeCount: data.likeCount,
              isLikedByMe: data.likedByUser !== undefined ? data.likedByUser : msg.isLikedByMe,
            };
          }
          return msg;
        })
      );
    };

    socket.on("chat:message", onChatMessage);
    socket.on("chat:history", onChatHistory);
    socket.on("chat:error", onChatError);
    socket.on("chat:like_updated", onLikeUpdated);

    // Initial load
    setIsLoadingHistory(true);
    socket.emit("chat:load_history", { auctionId, limit: 50 });

    return () => {
      mountedRef.current = false;
      socket.off("chat:message", onChatMessage);
      socket.off("chat:history", onChatHistory);
      socket.off("chat:error", onChatError);
      socket.off("chat:like_updated", onLikeUpdated);
    };
  }, [auctionId]);

  const sendMessage = useCallback((text: string, parentId?: string) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("chat:send", { auctionId, message: text, parentId });
    }
  }, [auctionId]);

  const toggleLike = useCallback((messageId: string) => {
    const socket = getSocket();
    if (socket?.connected) {
      // Optimistic update
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              isLikedByMe: !msg.isLikedByMe,
              likeCount: msg.isLikedByMe ? msg.likeCount - 1 : msg.likeCount + 1,
            };
          }
          return msg;
        })
      );
      socket.emit("chat:like", { auctionId, messageId });
    }
  }, [auctionId]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingHistory) return;
    const socket = getSocket();
    if (socket?.connected) {
      setIsLoadingHistory(true);
      socket.emit("chat:load_history", { auctionId, cursor: cursorRef.current, limit: 50 });
    }
  }, [auctionId, hasMore, isLoadingHistory]);

  return {
    messages,
    sendMessage,
    toggleLike,
    loadMore,
    hasMore,
    isLoadingHistory,
    error,
    clearError: () => setError(null),
  };
}
