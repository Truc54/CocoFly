"use client";

import { useState, useRef, useEffect } from "react";
import { useLiveChat } from "@/lib/hooks/useLiveChat";
import type { BidEntry } from "@/lib/types/auction";
import BidHistoryList from "./BidHistoryList";

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `Vài giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

interface LiveChatPanelProps {
  auctionId: string;
  chatRoomId: string | null;
  bids: BidEntry[];
  totalBids: number;
  viewerCount: number;
  isLoggedIn: boolean;
  isEnded: boolean;
}

export default function LiveChatPanel({
  auctionId,
  chatRoomId, // Keeping it for potential future use or REST API fallbacks
  bids,
  totalBids,
  viewerCount,
  isLoggedIn,
  isEnded,
}: LiveChatPanelProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "bids">("chat");
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string; text: string } | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { messages, sendMessage, toggleLike, loadMore, hasMore, isLoadingHistory, error, clearError } = useLiveChat(auctionId);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!inputText.trim() || !isLoggedIn) return;
    if (error) clearError();
    sendMessage(inputText, replyingTo?.id);
    setInputText("");
    setReplyingTo(null);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // In flex-col-reverse, scrolling "up" the history means moving away from 0.
    const isScrolled = Math.abs(e.currentTarget.scrollTop) > 100;
    setShowScrollButton(isScrolled);
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      setShowScrollButton(false);
    }
  };

  const chatMessages = messages.filter(msg => msg.type !== "bid_alert");

  return (
    <div className="bg-white dark:bg-slate-800 rounded-none border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] flex flex-col h-[550px]">
      {/* Header */}
      <div className="p-4 border-b-2 border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("chat")}
            className={`font-bold flex items-center gap-2 uppercase tracking-wide text-sm transition-colors ${
              activeTab === "chat" ? "text-primary" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className="material-symbols-outlined">forum</span>
            Live Chat
          </button>
          <button
            onClick={() => setActiveTab("bids")}
            className={`font-bold flex items-center gap-2 uppercase tracking-wide text-sm transition-colors ${
              activeTab === "bids" ? "text-primary" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className="material-symbols-outlined">history</span>
            Lịch sử ({totalBids})
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {!isEnded && (
            <>
              <div className="flex items-center gap-1 text-slate-500 text-xs font-bold">
                <span className="material-symbols-outlined text-base">visibility</span>
                {viewerCount}
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 text-green-600 text-[10px] font-bold px-2.5 py-1 border border-green-200 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                LIVE
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {activeTab === "bids" ? (
          <BidHistoryList auctionId={auctionId} bids={bids} totalBids={totalBids} />
        ) : (
          <div 
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 gap-4 hide-scrollbar flex flex-col-reverse bg-slate-50/50 dark:bg-slate-800"
          >
            {chatMessages.map((msg) => (
              <div key={msg.id} id={`chat-msg-${msg.id}`} className="animate-fade-in flex flex-col gap-1">
                {msg.type === "system" ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-2 text-xs text-blue-700 dark:text-blue-300 italic flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">
                      info
                    </span>
                    {msg.message}
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {msg.senderAvatar ? (
                        <img src={msg.senderAvatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-white">
                          {msg.senderName}
                        </span>
                      </div>
                      
                      {msg.parentId && (
                        <div 
                          onClick={() => {
                            const el = document.getElementById(`chat-msg-${msg.parentId}`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              const bubble = el.querySelector('[data-chat-bubble]');
                              if (bubble) {
                                bubble.classList.add('chat-highlight-flash');
                                bubble.addEventListener('animationend', () => {
                                  bubble.classList.remove('chat-highlight-flash');
                                }, { once: true });
                              }
                            }
                          }}
                          className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 bg-slate-200/50 dark:bg-slate-700/50 px-2 py-1 rounded-md border-l-2 border-slate-300 w-fit max-w-full truncate cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <span className="font-semibold">{msg.parentSenderName}:</span>
                          <span className="truncate">{msg.parentMessage}</span>
                        </div>
                      )}
                      
                      <div data-chat-bubble className="bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 mt-1 inline-block rounded-r-xl rounded-bl-xl shadow-[2px_2px_0px_#e2e8f0] dark:shadow-[2px_2px_0px_#475569] break-words whitespace-pre-wrap max-w-full">
                        {msg.message}
                      </div>
                      
                      {/* Timestamp + Actions */}
                      <div className="flex items-center gap-3 mt-1.5 pl-1">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {timeAgo(msg.createdAt)}
                        </span>
                        
                        <button
                          onClick={() => {
                            if (!isLoggedIn) return;
                            setReplyingTo({ id: msg.id, name: msg.senderName, text: msg.message.substring(0, 50) });
                          }}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                          Phản hồi
                        </button>

                        <button
                          onClick={() => {
                            if (!isLoggedIn) return;
                            toggleLike(msg.id);
                          }}
                          className={`flex items-center gap-1 text-[11px] font-bold transition-all ${
                            msg.isLikedByMe 
                              ? "text-red-500" 
                              : "text-slate-400 hover:text-red-500"
                          }`}
                        >
                          {msg.likeCount > 0 && <span>{msg.likeCount}</span>}
                          <span 
                            className={`material-symbols-outlined !text-[14px] !leading-none ${msg.isLikedByMe ? "animate-pop" : ""}`}
                            style={msg.isLikedByMe ? { fontVariationSettings: "'FILL' 1" } : undefined}
                          >
                            favorite
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={isLoadingHistory}
                className="text-xs text-primary font-bold text-center w-full py-2 hover:underline disabled:opacity-50"
              >
                {isLoadingHistory ? "Đang tải..." : "Tải thêm tin nhắn cũ"}
              </button>
            )}
            
            {chatMessages.length === 0 && !isLoadingHistory && (
              <div className="text-center text-sm text-slate-500 my-auto pb-10">
                Chưa có tin nhắn nào. Hãy là người đầu tiên!
              </div>
            )}
          </div>
        )}

        {activeTab === "chat" && showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-9 h-9 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-all animate-fade-in z-10 p-0 m-0"
          >
            <span className="material-symbols-outlined text-[20px] leading-none m-0 p-0 flex items-center justify-center">arrow_downward</span>
          </button>
        )}
      </div>

      {/* Chat Input */}
      {activeTab === "chat" && (
        <div className="p-3 border-t-2 border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800 flex flex-col gap-2">
          {error && (
            <div className="text-red-500 text-xs font-bold animate-fade-in flex items-center gap-1 px-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              {error}
            </div>
          )}
          {!isLoggedIn ? (
            <div className="text-center text-sm text-slate-500 py-2 font-medium">
              Vui lòng đăng nhập để nhắn tin
            </div>
          ) : isEnded ? (
            <div className="text-center text-sm text-slate-500 py-2 font-medium">
              Phiên đấu giá đã kết thúc, không thể gửi tin nhắn mới
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Reply Preview */}
              {replyingTo && (
                <div className="flex items-center justify-between bg-white dark:bg-slate-700 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg -mb-2 z-10 relative shadow-[0_-2px_10px_-5px_rgba(0,0,0,0.1)]">
                  <div className="flex flex-col min-w-0 border-l-[3px] border-primary pl-2">
                    <span className="text-[11px] font-bold text-primary">
                      Đang trả lời {replyingTo.name}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">
                      {replyingTo.text}
                    </span>
                  </div>
                  <button 
                    onClick={() => setReplyingTo(null)}
                    className="flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors shrink-0 ml-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}
              
              <div className="flex items-end gap-2">
                <textarea
                  rows={1}
                placeholder="Nhắn tin vào Live Chat..."
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (inputText.trim()) {
                      handleSend();
                      e.currentTarget.style.height = "auto";
                    }
                  }
                }}
                maxLength={500}
                className="flex-1 max-h-[120px] py-2 px-3 bg-white border-none rounded-none text-sm outline-none placeholder:text-slate-400 focus:ring-0 shadow-sm resize-none hide-scrollbar overflow-y-auto leading-normal"
              />
              <button 
                onClick={(e) => {
                  handleSend();
                  const textarea = e.currentTarget.previousElementSibling as HTMLTextAreaElement;
                  if (textarea) textarea.style.height = "auto";
                }}
                disabled={!inputText.trim()}
                className="w-10 h-10 flex items-center justify-center bg-transparent text-primary hover:bg-slate-200/50 rounded-full transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-default"
              >
                <span className="material-symbols-outlined text-[20px] leading-none">send</span>
              </button>
            </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
