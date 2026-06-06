"use client";

import { useEffect, useState, useCallback } from "react";
import { notificationApi } from "@/lib/api";
import { Bell, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
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

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationApi.getUnreadCount().then(setUnreadCount).catch(console.error);
  }, []);

  const fetchNotifications = useCallback(async (cursor?: string, unreadOnly: boolean = false) => {
    try {
      setIsLoading(true);
      const res = await notificationApi.getNotifications(cursor, 20, unreadOnly);
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

  useEffect(() => {
    fetchNotifications(undefined, activeTab === "unread");
  }, [activeTab, fetchNotifications]);

  // Handle real-time updates
  useEffect(() => {
    try {
      const socket = connectSocket();

      const handleNewNotification = (data: any) => {
        setNotifications(prev => {
          if (prev.some(n => n.id === data.id)) return prev;
          // If viewing "unread" tab, new notifications should appear (they are unread by default)
          return [data, ...prev];
        });
        setUnreadCount(prev => prev + 1);
      };

      const handleUnreadCount = (data: { count: number }) => {
        setUnreadCount(data.count);
      };

      socket.on("notification:new", handleNewNotification);
      socket.on("notification:unread_count", handleUnreadCount);

      return () => {
        socket.off("notification:new", handleNewNotification);
        socket.off("notification:unread_count", handleUnreadCount);
      };
    } catch (err) {
      console.error("Socket not initialized for notifications page:", err);
    }
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

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.isRead) {
      handleMarkAsRead(n.id);
    }

    if (n.type === "outbid" || n.type === "auction_starting" || n.type === "auction_ending") {
      if (n.auctionId) router.push(`/auction/${n.auctionId}`);
    } else if (n.type === "auction_won" || n.type === "payment_due") {
      if (n.auctionId) router.push(`/checkout/${n.auctionId}`);
    } else if (n.type === "payment_confirmed") {
      router.push(`/won-auctions?tab=won`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Thông báo</h1>
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm font-semibold text-primary hover:text-primary-dark flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Check className="w-4 h-4" />
            Đánh dấu tất cả đã đọc
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-slate-200 dark:border-slate-700 gap-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "all"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "unread"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Chưa đọc
            {unreadCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'unread' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {isLoading && notifications.length === 0 ? (
            <div className="flex justify-center items-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <Bell className="w-8 h-8" />
              </div>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">Không có thông báo nào</p>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">Khi bạn có hoạt động mới như đặt giá, chiến thắng, hay thanh toán, chúng sẽ hiển thị ở đây.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left pl-6 pr-10 py-4 h-[96px] hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex gap-4 relative cursor-pointer items-center ${
                  !n.isRead ? "bg-primary/5" : ""
                }`}
              >
                {!n.isRead && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                )}
                
                {/* Thumbnail */}
                {n.auction && (
                  <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    {n.auction.item?.media?.[0]?.cdnUrl ? (
                      <img 
                        src={n.auction.item.media[0].cdnUrl} 
                        alt={n.auction.item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[11px] text-slate-400 font-medium text-center leading-tight">No<br/>Image</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-center gap-4 mb-1">
                    <p className={`text-[15px] truncate ${!n.isRead ? 'font-bold text-slate-800 dark:text-slate-100' : 'font-semibold text-slate-700 dark:text-slate-200'}`}>
                      {n.auction?.item?.title || n.title}
                    </p>
                    <span className="text-xs font-medium text-slate-400 shrink-0">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${!n.isRead ? 'font-medium text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    {n.auction?.item?.title ? `${n.title} ${n.message}` : n.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => fetchNotifications(nextCursor || undefined, activeTab === "unread")}
              disabled={isLoading}
              className="w-full py-3 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-primary transition-colors rounded-xl flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Tải thêm thông báo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
