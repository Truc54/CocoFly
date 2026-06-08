"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X, Send, Image as ImageIcon, Loader2, Play } from "lucide-react";
import type { Conversation, DirectMessage } from "@/lib/types/message";
import { mediaApi } from "@/lib/api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import MessageBubble from "./MessageBubble";

interface ChatWindowProps {
  conversation: Conversation;
  messages: DirectMessage[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  loadMoreMessages: () => void;
  typingUsers: string[];
  onBack: () => void;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSendMessage: (text?: string, parentId?: string, media?: any[]) => void;
  onRecallMessage: (id: string) => void;
  onToggleReaction: (id: string, emoji: string) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  showDialogButton?: boolean;
  onShowDialog?: () => void;
}

export default function ChatWindow({
  conversation,
  messages,
  isLoadingMessages,
  hasMoreMessages,
  loadMoreMessages,
  typingUsers,
  onBack,
  onClose,
  onSendMessage,
  onRecallMessage,
  onToggleReaction,
  onStartTyping,
  onStopTyping,
  showDialogButton,
  onShowDialog,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState("");
  const [replyingMessage, setReplyingMessage] = useState<DirectMessage | null>(null);
  
  // Media upload state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  
  // Image lightbox state
  const [zoomedMediaIndex, setZoomedMediaIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // Typing state emission handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onStartTyping();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 2000);
  };

  // Extract all media items in chronological order (oldest first)
  const allMediaItems = React.useMemo(() => {
    return [...messages]
      .reverse()
      .filter((m) => m.status !== "recalled" && m.media && m.media.length > 0)
      .flatMap((m) => m.media || []);
  }, [messages]);

  // Scroll lock effect when zoomed media index changes
  useEffect(() => {
    if (zoomedMediaIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [zoomedMediaIndex]);

  // Keyboard navigation for image lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (zoomedMediaIndex === null) return;
      if (e.key === "ArrowLeft") {
        setZoomedMediaIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : allMediaItems.length - 1
        );
      } else if (e.key === "ArrowRight") {
        setZoomedMediaIndex((prev) =>
          prev !== null && prev < allMediaItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "Escape") {
        setZoomedMediaIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [zoomedMediaIndex, allMediaItems]);

  const handleZoomMedia = (cdnUrl: string) => {
    const index = allMediaItems.findIndex((m) => m.cdnUrl === cdnUrl);
    if (index !== -1) {
      setZoomedMediaIndex(index);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFiles(files);
    }
  };

  // Shared file upload helper
  const uploadFiles = async (files: FileList) => {
    if (attachedFiles.length + files.length > 5) {
      alert("Tối đa chỉ được chọn 5 tệp đính kèm!");
      return;
    }

    setIsUploading(true);
    try {
      const newAttached = [...attachedFiles];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        
        if (!isImage && !isVideo) {
          alert(`Tệp ${file.name} không được hỗ trợ. Chỉ hỗ trợ ảnh/video.`);
          continue;
        }

        const sigRes = await mediaApi.getUploadSignature();
        const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data;

        const formData = new window.FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder);

        const resourceType = isVideo ? "video" : "image";
        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
          { method: "POST", body: formData }
        );
        const uploadData = await uploadRes.json();

        if (uploadData.secure_url) {
          newAttached.push({
            type: isVideo ? "video" : "image",
            cdnUrl: uploadData.secure_url,
            storageKey: uploadData.public_id,
            originalName: file.name,
            mimeType: file.type,
            fileSize: file.size
          });
        }
      }
      setAttachedFiles(newAttached);
    } catch (err) {
      console.error("Failed to upload file to Cloudinary", err);
      alert("Tải tệp lên thất bại. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
    }
  };

  // Upload to Cloudinary handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = () => {
    if (inputText.trim() === "" && attachedFiles.length === 0) return;

    onSendMessage(
      inputText.trim() !== "" ? inputText : undefined,
      replyingMessage?.id,
      attachedFiles.length > 0 ? attachedFiles : undefined
    );

    // Reset input states
    setInputText("");
    setReplyingMessage(null);
    setAttachedFiles([]);
    onStopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop === 0 && hasMoreMessages && !isLoadingMessages) {
      loadMoreMessages();
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative"
    >
      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary-main/20 dark:bg-primary-main/30 backdrop-blur-sm border-2 border-dashed border-primary-main z-50 flex flex-col items-center justify-center pointer-events-none animate-fade-in">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 scale-100 transform transition-transform duration-200">
            <ImageIcon className="w-12 h-12 text-primary-main animate-bounce" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Thả ảnh hoặc video vào đây để gửi
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-805 transition-colors cursor-pointer md:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {showDialogButton && onShowDialog && (
            <button
              onClick={onShowDialog}
              className="hidden md:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer"
              title="Hiện danh sách"
            >
              <span className="material-symbols-outlined text-xs">right_panel_open</span>
            </button>
          )}

          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
            <img
              src={conversation.participant.avatarUrl || "/default-avatar.svg"}
              alt={conversation.participant.fullName}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
              {conversation.participant.fullName}
            </h4>
            {typingUsers.length > 0 && (
              <span className="text-[10px] text-primary font-bold animate-pulse">
                Đang gõ...
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Stream */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-1 min-h-0 flex flex-col-reverse"
      >
        <div ref={messagesEndRef} />

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 self-start animate-fade-in py-1">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
              <img
                src={conversation.participant.avatarUrl || "/default-avatar.svg"}
                alt="Typing..."
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-slate-200 dark:bg-slate-800 py-1.5 px-3 rounded-2xl rounded-tl-sm flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce duration-300" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce duration-300" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce duration-300" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {(() => {
          const elements: React.ReactNode[] = [];
          
          const formatMessageDate = (dateStr: string) => {
            try {
              const date = new Date(dateStr);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - date.getTime());
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              const timeStr = format(date, "HH:mm");
              
              if (date.toDateString() === now.toDateString()) {
                return timeStr;
              }
              
              const yesterday = new Date(now);
              yesterday.setDate(now.getDate() - 1);
              if (date.toDateString() === yesterday.toDateString()) {
                return `${timeStr} Hôm qua`;
              }
              
              if (diffDays < 7) {
                const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
                return `${timeStr} ${dayNames[date.getDay()]}`;
              }
              
              return `${timeStr}, ${format(date, "dd/MM/yyyy")}`;
            } catch {
              return "";
            }
          };

          // Split messages containing both text and media into virtual messages
          const processedMessages: DirectMessage[] = [];
          for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (msg.content && msg.media && msg.media.length > 0 && msg.status !== "recalled") {
              // Create a media-only virtual message (rendered lower/newer)
              const mediaMsg: DirectMessage = {
                ...msg,
                content: "", // no text
              };
              // Create a text-only virtual message (rendered higher/older)
              const textMsg: DirectMessage = {
                ...msg,
                id: `${msg.id}-text`,
                media: [], // no media
              };
              processedMessages.push(mediaMsg);
              processedMessages.push(textMsg);
            } else {
              processedMessages.push(msg);
            }
          }

          for (let i = 0; i < processedMessages.length; i++) {
            const msg = processedMessages[i];
            const prevMsg = i < processedMessages.length - 1 ? processedMessages[i + 1] : null; // older message
            const isTimeGap = !prevMsg || (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60 * 1000);
            const isSameSender = prevMsg ? prevMsg.senderId === msg.senderId : false;
            const showSenderName = !isSameSender || isTimeGap;
            const isCompact = isSameSender && !isTimeGap;

            elements.push(
              <MessageBubble
                key={msg.id}
                message={msg}
                showSenderName={showSenderName}
                isCompact={isCompact}
                onReply={setReplyingMessage}
                onRecall={onRecallMessage}
                onReact={onToggleReaction}
                onZoomMedia={handleZoomMedia}
              />
            );

            if (isTimeGap) {
              elements.push(
                <div key={`time-${msg.id}`} className="w-full text-center py-2 shrink-0 select-none">
                  <span className="px-2.5 py-0.5 text-[10px] text-slate-400 dark:text-slate-500 font-extrabold bg-slate-100 dark:bg-slate-900 rounded-md">
                    {formatMessageDate(msg.createdAt)}
                  </span>
                </div>
              );
            }
          }
          return elements;
        })()}

        {isLoadingMessages && (
          <div className="py-2 text-center shrink-0">
            <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
          </div>
        )}
      </div>

      {/* Reply Bar */}
      {replyingMessage && (
        <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs shrink-0 animate-in slide-in-from-bottom-2">
          <div className="min-w-0 border-l-2 border-primary pl-2">
            <p className="font-bold text-slate-700 dark:text-slate-350">
              Đang trả lời {replyingMessage.senderName}
            </p>
            <p className="text-slate-500 dark:text-slate-400 truncate">
              {replyingMessage.content || "[Hình ảnh/Video]"}
            </p>
          </div>
          <button
            onClick={() => setReplyingMessage(null)}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Files Preview Bar */}
      {attachedFiles.length > 0 && (
        <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto shrink-0">
          {attachedFiles.map((file, idx) => (
            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 dark:bg-slate-850 flex items-center justify-center">
              {file.type === "image" ? (
                <img src={file.cdnUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <Play className="w-5 h-5 text-white bg-black/40 rounded-full p-1" />
                </div>
              )}
              <button
                onClick={() => removeAttachedFile(idx)}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          title="Gửi ảnh hoặc video"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <ImageIcon className="w-5 h-5" />
          )}
        </button>

        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-slate-300 dark:focus:border-slate-600 transition-all"
        />

        <button
          onClick={handleSend}
          disabled={inputText.trim() === "" && attachedFiles.length === 0}
          className="p-2 rounded-xl bg-primary text-white hover:scale-105 active:scale-95 shadow-md shadow-primary/15 transition-all disabled:opacity-40 disabled:scale-100 disabled:shadow-none cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Lightbox / Media Viewer Modal */}
      {zoomedMediaIndex !== null && allMediaItems[zoomedMediaIndex] && (() => {
        const currentMedia = allMediaItems[zoomedMediaIndex];
        const isVideo = currentMedia.cdnUrl.includes("/video/upload") || currentMedia.cdnUrl.endsWith(".mp4");
        
        return (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[99999] flex flex-col items-center justify-between p-4 overflow-hidden select-none">
            {/* Close Button */}
            <button
              onClick={() => setZoomedMediaIndex(null)}
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white hover:scale-105 transition-all cursor-pointer z-[100000]"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Navigation Left Arrow */}
            <button
              onClick={() => setZoomedMediaIndex((prev) => prev !== null && prev > 0 ? prev - 1 : allMediaItems.length - 1)}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white hover:scale-105 transition-all cursor-pointer z-[100000]"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Navigation Right Arrow */}
            <button
              onClick={() => setZoomedMediaIndex((prev) => prev !== null && prev < allMediaItems.length - 1 ? prev + 1 : 0)}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white hover:scale-105 transition-all cursor-pointer z-[100000]"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center max-w-4xl max-h-[70vh] w-full mt-12 mb-4">
              <div className="max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
                {isVideo ? (
                  <video src={currentMedia.cdnUrl} controls autoPlay className="max-w-full max-h-[70vh] object-contain" />
                ) : (
                  <img src={currentMedia.cdnUrl} alt="Zoomed Media" className="max-w-full max-h-[70vh] object-contain" />
                )}
              </div>
            </div>

            {/* Bottom History/Thumbnails Gallery */}
            <div className="w-full max-w-3xl p-3 flex gap-2 overflow-x-auto py-1 px-2 scrollbar-none justify-center z-[100000] mb-4">
              {allMediaItems.map((media, idx) => {
                const isActive = idx === zoomedMediaIndex;
                const isThumbVideo = media.cdnUrl.includes("/video/upload") || media.cdnUrl.endsWith(".mp4");
                return (
                  <div
                    key={idx}
                    onClick={() => setZoomedMediaIndex(idx)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all duration-150 ${
                      isActive
                        ? "border-primary-main scale-110 shadow-md"
                        : "border-white/10 hover:border-white/30 opacity-70 hover:opacity-100"
                    }`}
                  >
                    {isThumbVideo ? (
                      <div className="w-full h-full bg-black flex items-center justify-center">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <img src={media.cdnUrl} alt="thumbnail" className="w-full h-full object-cover animate-fade-in" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
