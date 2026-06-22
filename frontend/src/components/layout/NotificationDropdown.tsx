"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Bell, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notificationApi, paymentApi } from "@/lib/api";
import { connectSocket } from "@/lib/socket";

// Must match Prisma NotificationType
type NotificationType =
  | "outbid"
  | "auction_starting"
  | "auction_ending"
  | "auction_won"
  | "auction_failed"
  | "payment_due"
  | "payment_confirmed"
  | "new_bid"
  | "shipping_update"
  | "shipping_reminder"
  | "dispute_opened"
  | "dispute_resolved"
  | "review_received"
  | "welcome"
  | "account_warning"
  | "system";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  auctionId: string | null;
  metadata: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
  auction?: {
    item: {
      title: string;
      media: { cdnUrl: string }[];
    };
  } | null;
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Vừa xong";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [activePushToast, setActivePushToast] = useState<NotificationItem | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isClient, setIsClient] = useState(false);

  // Initial fetch for count
  useEffect(() => {
    setIsClient(true);
    notificationApi.getUnreadCount().then(setUnreadCount).catch(console.error);
  }, []);

  // Handle Socket events
  useEffect(() => {
    try {
      const socket = connectSocket();

      const handleNewNotification = (data: any) => {
        setNotifications(prev => {
          // Prevent duplicates if API fetch and socket event arrive at the same time
          if (prev.some(n => n.id === data.id)) return prev;
          return [data, ...prev];
        });
        setUnreadCount(prev => prev + 1);

        // Intercept auction_won type for victory push toast
        if (data.type === "auction_won") {
          if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
          }
          setActivePushToast(data);
          toastTimeoutRef.current = setTimeout(() => {
            setActivePushToast(null);
          }, 8000);
        }
      };

      const handleUnreadCount = (data: { count: number }) => {
        setUnreadCount(data.count);
      };

      socket.on("notification:new", handleNewNotification);
      socket.on("notification:unread_count", handleUnreadCount);

      return () => {
        socket.off("notification:new", handleNewNotification);
        socket.off("notification:unread_count", handleUnreadCount);
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
      };
    } catch (err) {
      console.error("Socket not initialized for notifications:", err);
    }
  }, []);

  const fetchNotifications = useCallback(async (cursor?: string, unreadOnly: boolean = false) => {
    try {
      setIsLoading(true);
      const res = await notificationApi.getNotifications(cursor, 10, unreadOnly);
      if (cursor) {
        setNotifications(prev => [...prev, ...res.data]);
      } else {
        setNotifications(res.data);
      }
      setHasMore(!!res.nextCursor);
      setNextCursor(res.nextCursor || null);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when opening or changing tabs
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(undefined, activeTab === "unread");
    }
  }, [isOpen, activeTab, fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    if (activeTab === "unread") {
      setNotifications(prev => prev.filter(n => n.id !== id));
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await notificationApi.markAsRead(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (activeTab === "unread") {
      setNotifications([]);
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
    setUnreadCount(0);
    try {
      await notificationApi.markAllAsRead();
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      handleMarkAsRead(n.id);
    }
    setIsOpen(false);

    const isDisputeNotification =
      n.type === "dispute_opened" ||
      n.type === "dispute_resolved" ||
      n.title === "Người bán đã phản hồi khiếu nại" ||
      (n.metadata && typeof n.metadata.disputeId === "string");

    // Route based on type
    if (n.type === "outbid" || n.type === "auction_starting" || n.type === "auction_ending") {
      if (n.auctionId) router.push(`/auction/${n.auctionId}`);
    } else if (n.type === "auction_won" || n.type === "payment_due") {
      if (n.auctionId) router.push(`/checkout/${n.auctionId}`);
    } else if (n.type === "payment_confirmed") {
      router.push(`/won-auctions?tab=won`);
    } else if (isDisputeNotification) {
      if (n.title === "Gửi khiếu nại thành công") {
        router.push(`/won-auctions?tab=received`);
      } else {
        const disputeId = n.metadata?.disputeId;
        if (disputeId) {
          router.push(`/disputes/${disputeId}`);
        } else if (n.auctionId) {
          try {
            const res = await paymentApi.getDisputeByAuction(n.auctionId);
            if (res && res.success && res.data) {
              router.push(`/disputes/${res.data.id}`);
            } else {
              router.push(`/won-auctions?tab=won`);
            }
          } catch (err) {
            console.error(err);
            router.push(`/won-auctions?tab=won`);
          }
        } else {
          router.push(`/won-auctions?tab=won`);
        }
      }
    } else {
      router.push(`/notifications`);
    }
  };

  const handlePushToastClick = async () => {
    if (!activePushToast) return;
    if (!activePushToast.isRead) {
      handleMarkAsRead(activePushToast.id);
    }
    setActivePushToast(null);
    if (activePushToast.auctionId) {
      router.push(`/auction/${activePushToast.auctionId}`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Thông báo"
      >
        <Bell className="w-[18px] h-[18px] text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 ring-2 ring-white dark:ring-background-dark">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[85vh] flex flex-col bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl shadow-[3px_3px_0px_#E2B9A1] z-[100] overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Thông báo</h3>
          </div>

          {/* Tabs */}
          <div className="flex px-4 pt-2 border-b border-slate-100 dark:border-slate-700 gap-4">
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-2 text-sm font-bold border-b-2 transition-colors ${
                activeTab === "all"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "unread"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Chưa đọc
              {unreadCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'unread' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto max-h-[400px] scrollbar-thin">
            {isLoading && !notifications.length ? (
              <div className="flex justify-center items-center py-8 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Không có thông báo nào</p>
                <p className="text-xs text-slate-400 mt-1">Khi bạn có thông báo mới, chúng sẽ hiển thị ở đây.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left pl-4 pr-8 py-3 h-[72px] hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex gap-3 relative items-center ${
                      !n.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    {!n.isRead && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                    )}
                    
                    {/* Thumbnail */}
                    {n.auction && (
                      <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                        {n.auction.item?.media?.[0]?.cdnUrl ? (
                          <img 
                            src={n.auction.item.media[0].cdnUrl} 
                            alt={n.auction.item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[10px] text-slate-400 font-medium text-center leading-tight">No<br/>Image</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-center gap-2 mb-1">
                        <p className={`text-[13px] truncate ${!n.isRead ? 'font-bold text-slate-800 dark:text-slate-100' : 'font-semibold text-slate-700 dark:text-slate-200'}`}>
                          {n.auction?.item?.title || n.title}
                        </p>
                        <span className="text-[11px] font-medium text-slate-400 shrink-0">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className={`text-[13px] truncate ${!n.isRead ? 'font-medium text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        {n.auction?.item?.title ? `${n.title} ${n.message}` : n.message}
                      </p>
                    </div>
                  </button>
                ))}

                {hasMore && (
                  <button
                    onClick={() => fetchNotifications(nextCursor || undefined, activeTab === "unread")}
                    disabled={isLoading}
                    className="w-full py-3 text-xs font-bold text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800"
                  >
                    {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    Tải thêm
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-slate-100 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800/50">
            <Link 
              href="/notifications" 
              onClick={() => setIsOpen(false)}
              className="block w-full py-2 text-center text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Xem tất cả thông báo
            </Link>
          </div>

        </div>
      )}

      {isClient && activePushToast && createPortal(
        <div 
          onClick={handlePushToastClick}
          className="fixed bottom-24 right-6 z-[10000] animate-slide-in-right cursor-pointer"
        >
          <div className="flex items-center gap-4 bg-white border-2 border-orange-400 p-4 rounded-xl shadow-[4px_4px_0px_#fed7aa] min-w-[360px] max-w-[420px] dark:bg-slate-800 dark:border-orange-500 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group">
            {/* Close Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation(); // prevent triggering redirect
                setActivePushToast(null);
              }} 
              className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined text-lg block">close</span>
            </button>

            {/* Thumbnail */}
            <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              {activePushToast.auction?.item?.media?.[0]?.cdnUrl ? (
                <img 
                  src={activePushToast.auction.item.media[0].cdnUrl} 
                  alt={activePushToast.auction.item.title || "Vật phẩm"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-slate-400 text-2xl">image</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-8">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="material-symbols-outlined text-orange-500 text-[18px]">workspace_premium</span>
                <p className="text-xs font-extrabold uppercase tracking-wider text-orange-500">
                  {activePushToast.title || "Chiến thắng!"}
                </p>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                {activePushToast.auction?.item?.title || "Phiên đấu giá"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {activePushToast.message}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
