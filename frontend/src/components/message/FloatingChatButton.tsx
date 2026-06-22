"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X } from "lucide-react";
import { useUnreadDM } from "@/lib/hooks/useUnreadDM";
import { authStorage } from "@/lib/auth-storage";
import ChatWidget from "./ChatWidget";
import { useToast } from "@/context/ToastContext";

export default function FloatingChatButton() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [preloadedConversation, setPreloadedConversation] = useState<any | null>(null);
  const { unreadCount } = useUnreadDM();

  // Listen to auth changes to show/hide button
  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(!!authStorage.getToken());
    };
    checkAuth();

    window.addEventListener("auth-change", checkAuth);
    return () => {
      window.removeEventListener("auth-change", checkAuth);
    };
  }, []);

  // Listen for custom event to open specific chat
  useEffect(() => {
    const handleOpenDM = async (e: Event) => {
      const customEvent = e as CustomEvent<{ targetUserId: string }>;
      const targetUserId = customEvent.detail?.targetUserId;
      if (!targetUserId) return;

      try {
        const token = authStorage.getToken();
        if (!token) {
          toast.warning("Vui lòng đăng nhập để gửi tin nhắn!");
          return;
        }

        setIsLoggedIn(true);

        const { messageApi } = await import("@/lib/api");
        const conversation = await messageApi.getOrCreateConversation(targetUserId);

        if (conversation && conversation.id) {
          const currentUser = authStorage.getUser() as any;
          const otherParticipant = conversation.participants.find((p: any) => p.userId === targetUserId) || 
                                   conversation.participants.find((p: any) => p.userId !== currentUser?.id);
          
          const formattedConversation = {
            id: conversation.id,
            participant: otherParticipant ? {
              id: otherParticipant.user.id,
              fullName: otherParticipant.user.fullName || "Người dùng CocoFly",
              avatarUrl: otherParticipant.user.avatarUrl
            } : {
              id: targetUserId,
              fullName: "Người dùng",
              avatarUrl: null
            },
            lastMessage: null,
            unreadCount: 0,
            isMuted: false
          };

          setPreloadedConversation(formattedConversation);
          setActiveConversationId(conversation.id);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Failed to open DM from event:", err);
      }
    };

    window.addEventListener("open-dm", handleOpenDM);
    return () => {
      window.removeEventListener("open-dm", handleOpenDM);
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close the chat widget
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Prevent closing when clicking a message trigger (such as "Nhắn tin" buttons on webpage)
        const target = event.target as HTMLElement;
        if (
          target.closest("[data-open-dm]") || 
          target.closest(".open-dm-btn") || 
          target.textContent?.includes("Nhắn tin") || 
          target.innerText === "Nhắn tin"
        ) {
          return;
        }
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!isLoggedIn) return null;

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-[9999] origin-bottom-right">
      {isOpen ? (
        <ChatWidget
          activeConversationId={activeConversationId}
          setActiveConversationId={setActiveConversationId}
          preloadedConversation={preloadedConversation}
          onClose={() => {
            setIsOpen(false);
          }}
        />
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-white border-2 border-slate-200 dark:border-slate-800 shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer relative"
          aria-label="Tin nhắn"
        >
          <img
            src="/messages.png"
            alt="Tin nhắn"
            className="w-8 h-8 object-contain"
          />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 border-2 border-white text-white font-bold text-[10px] rounded-full min-w-5 h-5 flex items-center justify-center px-1 animate-bounce">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
