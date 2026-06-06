"use client";

import React, { useState, useEffect, useRef } from "react";
import { Reply, Undo, Smile, Maximize2, X, Play } from "lucide-react";
import type { DirectMessage } from "@/lib/types/message";
import { authStorage } from "@/lib/auth-storage";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface MessageBubbleProps {
  message: DirectMessage;
  showSenderName?: boolean;
  isCompact?: boolean;
  onReply: (msg: DirectMessage) => void;
  onRecall: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
}

export default function MessageBubble({
  message,
  showSenderName = true,
  isCompact = false,
  onReply,
  onRecall,
  onReact,
}: MessageBubbleProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [zoomedMedia, setZoomedMedia] = useState<string | null>(null);
  const [showRecallConfirm, setShowRecallConfirm] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = authStorage.getUser() as { id: string } | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentUserId(user?.id || null);
  }, []);

  const isMe = message.senderId === currentUserId;
  const isRecalled = message.status === "recalled";

  const getFormattedTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "HH:mm", { locale: vi });
    } catch {
      return "";
    }
  };

  const handleEmojiClick = (emoji: string) => {
    onReact(message.id, emoji);
    setShowEmojiPicker(false);
    setShowActions(false);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
        setShowActions(false);
      }
    };
    if (showActions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showActions]);

  const quickEmojis = ["😀", "❤️", "👍", "😢", "😡", "🔥"];

  return (
    <div
      className={`flex flex-col ${isMe ? "items-end" : "items-start"} relative group w-full ${isCompact ? "mt-0.5" : "mt-3"}`}
      onMouseEnter={() => !isRecalled && setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Sender name for received messages */}
      {!isMe && !isRecalled && showSenderName && (
        <span className="text-[10px] text-slate-400 font-semibold mb-1 ml-2">
          {message.senderName}
        </span>
      )}

      {/* Main Message Row */}
      <div className={`flex items-center gap-2 max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
        {/* Chat Bubble */}
        <div className="flex flex-col relative">
          {/* Reply Context Header */}
          {message.parentId && !isRecalled && (
            <div className={`text-[10px] px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-t-xl border-b border-slate-100 dark:border-slate-700/50 mb-[-4px] select-none ${isMe ? "rounded-l-xl" : "rounded-r-xl"}`}>
              <span className="font-bold">→ Trả lời {message.parentSenderName}: </span>
              <span className="truncate max-w-[150px] inline-block align-bottom">
                {message.parentContent}
              </span>
            </div>
          )}

          {/* Core Content */}
          <div
            className={`py-2 px-3.5 shadow-sm text-xs ${
              isRecalled
                ? "bg-slate-100 dark:bg-slate-850 text-slate-400 italic border border-slate-200/50 dark:border-slate-800 rounded-2xl"
                : isMe
                ? "bg-primary text-white rounded-2xl rounded-tr-sm"
                : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-800"
            }`}
          >
            {isRecalled ? (
              <span>Tin nhắn đã bị thu hồi</span>
            ) : (
              <>
                {/* Media Files */}
                {message.media && message.media.length > 0 && (
                  <div className={`grid gap-1 mb-1.5 ${message.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                    {message.media.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setZoomedMedia(m.cdnUrl)}
                        className="relative rounded-lg overflow-hidden border border-slate-100/55 dark:border-slate-800 bg-slate-100 shrink-0 cursor-pointer max-w-[180px] max-h-[140px] flex items-center justify-center group/media"
                      >
                        {m.type === "image" ? (
                          <img
                            src={m.cdnUrl}
                            alt="Attached Image"
                            className="w-full h-full object-cover max-h-[120px]"
                          />
                        ) : (
                          <div className="relative w-full h-full min-w-[100px] min-h-[80px] flex items-center justify-center bg-black">
                            <Play className="w-8 h-8 text-white bg-black/40 rounded-full p-2" />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 bg-black/50 text-white p-1 rounded-md opacity-0 group-hover/media:opacity-100 transition-opacity">
                          <Maximize2 className="w-3 h-3" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Text Content */}
                {message.content && (
                  <p className="whitespace-pre-wrap break-all leading-relaxed font-medium">
                    {message.content}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Button Bar (visible on hover) */}
        {showActions && !isRecalled && (
          <div
            ref={actionsRef}
            className={`flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-full px-2 py-1 z-10 animate-in fade-in duration-200`}
          >
            {/* Emoji Quick Picker Trigger */}
            <div className="relative group/tooltip">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Smile className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-150 bg-slate-850 dark:bg-slate-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-md z-[110]">
                Bày tỏ cảm xúc
              </div>

              {showEmojiPicker && (
                <div className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-full px-2 py-1 flex gap-1 z-[100] animate-in zoom-in-95 duration-100">
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className="hover:scale-125 transition-transform p-0.5 text-sm cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Button */}
            <div className="relative group/tooltip">
              <button
                onClick={() => {
                  onReply(message);
                  setShowActions(false);
                }}
                className="p-1.5 text-slate-400 hover:text-primary rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-150 bg-slate-850 dark:bg-slate-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-md z-[110]">
                Phản hồi
              </div>
            </div>

            {/* Recall Button (sender only) */}
            {isMe && (
              <div className="relative group/tooltip">
                <button
                  onClick={() => {
                    setShowRecallConfirm(true);
                    setShowActions(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <Undo className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-150 bg-slate-850 dark:bg-slate-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-md z-[110]">
                  Thu hồi
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Emoji Reactions Bar */}
      {message.reactions && message.reactions.length > 0 && !isRecalled && (
        <div className={`flex flex-wrap gap-1 mt-0.5 ${isMe ? "justify-end mr-2" : "justify-start ml-2"}`}>
          {message.reactions.map((r, idx) => (
            <button
              key={idx}
              onClick={() => onReact(message.id, r.emoji)}
              className={`inline-flex items-center justify-center transition-all cursor-pointer bg-transparent border-0 p-0 text-[14px] hover:scale-125 select-none`}
              title={r.reacted ? "Bỏ bày tỏ cảm xúc" : "Bày tỏ cảm xúc"}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}

      {/* Message Timestamp */}
      {!isRecalled && (
        <span className={`text-[10px] text-slate-400/80 mt-0.5 select-none ${isMe ? "mr-2" : "ml-2"}`}>
          {getFormattedTime(message.createdAt)}
        </span>
      )}

      {/* Lightbox / Media Viewer Modal */}
      {zoomedMedia && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <button
            onClick={() => setZoomedMedia(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="max-w-4xl max-h-[85vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            {zoomedMedia.includes("/video/upload") || zoomedMedia.endsWith(".mp4") ? (
              <video src={zoomedMedia} controls autoPlay className="max-w-full max-h-[85vh]" />
            ) : (
              <img src={zoomedMedia} alt="Zoomed Media" className="max-w-full max-h-[85vh] object-contain" />
            )}
          </div>
        </div>
      )}

      {/* Recall Confirmation Popup Modal */}
      {showRecallConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowRecallConfirm(false)}>
          <div className="bg-white dark:bg-slate-800 w-full max-w-md border-2 border-slate-200 dark:border-slate-700 shadow-[8px_8px_0px_#E2B9A1] rounded-2xl overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 mt-2">Thu hồi tin nhắn</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Bạn có chắc chắn muốn thu hồi tin nhắn này? <br/>
                <span className="text-xs text-slate-400 dark:text-slate-500 mt-2 block">Hành động này không thể hoàn tác và tin nhắn sẽ bị xóa đối với mọi người.</span>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowRecallConfirm(false)} className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 transition-all cursor-pointer rounded-xl">
                  Hủy bỏ
                </button>
                <button
                  onClick={() => {
                    onRecall(message.id);
                    setShowRecallConfirm(false);
                  }}
                  className="flex-1 py-3 font-bold text-white bg-red-500 border-2 border-red-500 hover:bg-red-655 shadow-[4px_4px_0px_#fca5a5] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#fca5a5] active:translate-y-0 active:shadow-[2px_2px_0px_#fca5a5] transition-all cursor-pointer rounded-xl"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
