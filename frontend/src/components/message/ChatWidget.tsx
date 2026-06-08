"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { useDirectMessage } from "@/lib/hooks/useDirectMessage";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";

interface ChatWidgetProps {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  preloadedConversation?: any | null;
  onClose: () => void;
}

export default function ChatWidget({
  activeConversationId,
  setActiveConversationId,
  preloadedConversation,
  onClose,
}: ChatWidgetProps) {
  const [isListCollapsed, setIsListCollapsed] = useState(false);

  const {
    conversations,
    messages,
    hasMoreConversations,
    hasMoreMessages,
    isLoadingConversations,
    isLoadingMessages,
    typingUsers,
    sendMessage,
    recallMessage,
    toggleReaction,
    startTyping,
    stopTyping,
    loadMoreConversations,
    loadMoreMessages,
    refreshConversations
  } = useDirectMessage(activeConversationId);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || preloadedConversation;

  return (
    <div className="md:w-[840px] md:h-[560px] w-[360px] h-[520px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-xl shadow-[3px_3px_0px_#E2B9A1] dark:shadow-[3px_3px_0px_#4c2d1b] flex flex-row overflow-hidden animate-in zoom-in-95 duration-200 origin-bottom-right">
      
      {/* Left Column: Conversations List */}
      <div
        className={`${
          isListCollapsed || activeConversationId ? "hidden md:flex" : "flex"
        } flex-col w-full md:w-[260px] border-r border-slate-100 dark:border-slate-800 shrink-0 h-full`}
      >
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          isLoading={isLoadingConversations}
          hasMore={hasMoreConversations}
          onLoadMore={loadMoreConversations}
          onSelectConversation={(id) => setActiveConversationId(id)}
          onClose={onClose}
          showCloseButton={!activeConversationId} // Only show close button in list on mobile list view
          onHideDialog={() => setIsListCollapsed(true)}
        />
      </div>

      {/* Right Column: Chat Window / Empty State */}
      <div
        className={`${
          !activeConversationId ? "hidden md:flex" : "flex"
        } flex-1 flex-col h-full bg-slate-50 dark:bg-slate-950 min-w-0`}
      >
        {activeConversationId && activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            hasMoreMessages={hasMoreMessages}
            loadMoreMessages={loadMoreMessages}
            typingUsers={typingUsers}
            showDialogButton={isListCollapsed}
            onShowDialog={() => setIsListCollapsed(false)}
            onBack={() => {
              setActiveConversationId(null);
              refreshConversations();
            }}
            onClose={onClose}
            onSendMessage={sendMessage}
            onRecallMessage={recallMessage}
            onToggleReaction={toggleReaction}
            onStartTyping={startTyping}
            onStopTyping={stopTyping}
          />
        ) : (
          /* Empty State when no conversation selected (Desktop only) */
          <div className="flex-1 flex flex-col h-full">
            {/* Empty State Header */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
              <div className="flex items-center gap-2">
                {isListCollapsed && (
                  <button
                    onClick={() => setIsListCollapsed(false)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer text-[10px] font-bold"
                    title="Hiện danh sách"
                  >
                    <span className="material-symbols-outlined text-xs">right_panel_open</span>
                    <span>Show Dialog</span>
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Empty State Body */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-md flex items-center justify-center mb-4">
                <img
                  src="/messages.png"
                  alt="CocoFly Messenger"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                CocoFly Messenger
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[220px] leading-relaxed">
                Hãy chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu nhắn tin.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
