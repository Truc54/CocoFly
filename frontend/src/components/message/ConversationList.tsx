"use client";

import React, { useState } from "react";
import { Search, X, MessageSquareOff, Loader2 } from "lucide-react";
import type { Conversation } from "@/lib/types/message";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string | null;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSelectConversation: (id: string) => void;
  onClose: () => void;
  showCloseButton?: boolean;
  onHideDialog?: () => void;
}

export default function ConversationList({
  conversations,
  activeConversationId,
  isLoading,
  hasMore,
  onLoadMore,
  onSelectConversation,
  onClose,
  showCloseButton = true,
  onHideDialog,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter conversations locally based on participant name
  const filteredConversations = conversations.filter((c) =>
    c.participant.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRelativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: false,
        locale: vi,
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>Tin nhắn</span>
        </h3>
        <div className="flex items-center gap-1">
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-4 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-slate-300 dark:focus:border-slate-600 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-50 dark:divide-slate-800/50">
        {filteredConversations.length > 0 ? (
          <>
            {filteredConversations.map((c) => {
              const hasUnread = c.unreadCount > 0;
              const isActive = c.id === activeConversationId;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectConversation(c.id)}
                  className={`w-full px-4 py-3.5 flex items-start gap-3 text-left transition-colors cursor-pointer ${
                    isActive 
                      ? "bg-slate-100 dark:bg-slate-800" 
                      : "hover:bg-slate-50 dark:hover:bg-slate-850/45"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0 mt-0.5">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={c.participant.avatarUrl || "/default-avatar.svg"}
                        alt={c.participant.fullName}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4
                        className={`text-sm font-bold text-slate-800 dark:text-slate-200 truncate ${
                          hasUnread ? "font-extrabold text-slate-900 dark:text-white" : ""
                        }`}
                      >
                        {c.participant.fullName}
                      </h4>
                      {c.lastMessage && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {getRelativeTime(c.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-xs text-slate-400 dark:text-slate-500 truncate ${
                        hasUnread ? "font-semibold text-slate-800 dark:text-slate-300" : ""
                      }`}
                    >
                      {c.lastMessage ? (
                        <>
                          {c.lastMessage.status === "recalled" ? (
                            <span className="italic text-slate-300 dark:text-slate-600">
                              {c.lastMessage.content}
                            </span>
                          ) : (
                            <>
                              {c.lastMessage.senderName}: {c.lastMessage.content}
                            </>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 italic">
                          Chưa có tin nhắn
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Badge */}
                  {hasUnread && (
                    <div className="shrink-0 self-center">
                      <span className="w-5 h-5 rounded-full bg-red-500 text-white font-bold text-[10px] flex items-center justify-center">
                        {c.unreadCount}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}

            {hasMore && (
              <div className="p-3 text-center">
                <button
                  onClick={onLoadMore}
                  disabled={isLoading}
                  className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                  ) : (
                    "Xem thêm cuộc trò chuyện"
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            {isLoading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <MessageSquareOff className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chưa có tin nhắn nào
                </h4>
                <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
                  Nhắn tin với người bán trên trang đấu giá để bắt đầu trò chuyện.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
