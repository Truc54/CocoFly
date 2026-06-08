"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket, connectSocket } from "../socket";
import { messageApi } from "../api";
import { authStorage } from "../auth-storage";
import { playChatSound } from "../sounds";
import type { Conversation, DirectMessage, ReactionGroup } from "../types/message";

export function useDirectMessage(activeConversationId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({}); // conversationId -> userNames[]
  
  const conversationCursorRef = useRef<string | undefined>(undefined);
  const messageCursorRef = useRef<string | undefined>(undefined);
  
  const activeConversationIdRef = useRef<string | null>(activeConversationId);
  
  // Create refs to prevent stale closure dependencies in load callbacks
  const isLoadingConversationsRef = useRef(false);
  const hasMoreConversationsRef = useRef(true);
  const isLoadingMessagesRef = useRef(false);
  const hasMoreMessagesRef = useRef(true);
  const conversationsRef = useRef<Conversation[]>([]);

  // Keep conversationsRef updated
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // 1. Load Conversations List (Initial & Paginated)
  const loadConversations = useCallback(async (isLoadMore = false) => {
    if (isLoadingConversationsRef.current) return;
    if (isLoadMore && !hasMoreConversationsRef.current) return;
    
    isLoadingConversationsRef.current = true;
    setIsLoadingConversations(true);
    try {
      const cursor = isLoadMore ? conversationCursorRef.current : undefined;
      const data = await messageApi.getConversations(cursor, 20);
      
      setConversations((prev) => {
        if (isLoadMore) {
          const filtered = data.conversations.filter((c: any) => !prev.some((p) => p.id === c.id));
          return [...prev, ...filtered];
        }
        return data.conversations;
      });
      
      conversationCursorRef.current = data.nextCursor || undefined;
      const hasMore = !!data.nextCursor;
      hasMoreConversationsRef.current = hasMore;
      setHasMoreConversations(hasMore);
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      isLoadingConversationsRef.current = false;
      setIsLoadingConversations(false);
    }
  }, []);

  // 2. Load Messages List (Initial & Paginated)
  const loadMessages = useCallback(async (convId: string, isLoadMore = false) => {
    if (isLoadingMessagesRef.current) return;
    if (isLoadMore && !hasMoreMessagesRef.current) return;
    
    isLoadingMessagesRef.current = true;
    setIsLoadingMessages(true);
    try {
      const cursor = isLoadMore ? messageCursorRef.current : undefined;
      const data = await messageApi.getMessages(convId, cursor, 30);
      
      setMessages((prev) => {
        if (isLoadMore) {
          const filtered = data.messages.filter((m: any) => !prev.some((p) => p.id === m.id));
          return [...prev, ...filtered]; // older at the bottom
        }
        return data.messages; // newest is at index 0 (top of array)
      });
      
      messageCursorRef.current = data.nextCursor || undefined;
      const hasMore = !!data.nextCursor;
      hasMoreMessagesRef.current = hasMore;
      setHasMoreMessages(hasMore);
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      isLoadingMessagesRef.current = false;
      setIsLoadingMessages(false);
    }
  }, []);

  // Initial load of conversations
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Socket action: Mark as read
  const markAsRead = useCallback((convId: string) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("dm:read", { conversationId: convId });
    }
    // Update local list unread count optimistically
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      setMessages([]);
      messageCursorRef.current = undefined;
      hasMoreMessagesRef.current = true;
      setHasMoreMessages(true);
      loadMessages(activeConversationId);
      
      // Auto mark as read when opening conversation
      markAsRead(activeConversationId);
    }
  }, [activeConversationId, markAsRead, loadMessages]);

  // Socket action: Send Message
  const sendMessage = useCallback((text?: string, parentId?: string, media?: any[]) => {
    if (!activeConversationId) return;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("dm:send", {
        conversationId: activeConversationId,
        content: text,
        parentId,
        media
      });
    }
  }, [activeConversationId]);

  // Socket action: Recall Message
  const recallMessage = useCallback((messageId: string) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("dm:recall", { messageId });
    }
  }, []);

  // Socket action: Toggle Reaction
  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("dm:react", { messageId, emoji });
    }
  }, []);

  // Socket action: Typing indicators
  const startTyping = useCallback(() => {
    if (!activeConversationId) return;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("dm:typing", { conversationId: activeConversationId });
    }
  }, [activeConversationId]);

  const stopTyping = useCallback(() => {
    if (!activeConversationId) return;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("dm:stop_typing", { conversationId: activeConversationId });
    }
  }, [activeConversationId]);

  // Handle Real-time socket events
  useEffect(() => {
    // Ensure socket is connected
    let socket;
    try {
      socket = connectSocket();
    } catch (err) {
      console.warn("Socket not connected:", err);
      return;
    }

    const onMessage = (msg: DirectMessage) => {
      const currentUser = authStorage.getUser() as any;
      const isMyMsg = currentUser && msg.senderId === currentUser.id;

      if (isMyMsg) {
        playChatSound("send");
      }

      // 1. If message is for the currently open conversation, append it
      if (activeConversationIdRef.current === msg.conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [msg, ...prev]; // insert at top (newest first)
        });
        // Auto mark as read if active
        markAsRead(msg.conversationId);
      }

      // 2. Update conversation list preview & unread count
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === msg.conversationId);
        const isActive = activeConversationIdRef.current === msg.conversationId;

        if (index === -1) {
          // If conversation not in list, reload list
          loadConversations();
          return prev;
        }

        const list = [...prev];
        const conv = list[index];

        const updatedConv: Conversation = {
          ...conv,
          lastMessage: {
            content: msg.status === "recalled" 
              ? "Tin nhắn đã bị thu hồi" 
              : (msg.content || getMediaPreviewText(msg.media)),
            senderName: isMyMsg ? "Bạn" : msg.senderName,
            createdAt: msg.createdAt,
            status: msg.status
          },
          unreadCount: isActive ? 0 : conv.unreadCount + 1
        };

        // Move to top
        list.splice(index, 1);
        return [updatedConv, ...list];
      });
    };

    const onMessageRecalled = (data: { messageId: string; conversationId: string }) => {
      // Update message status in current list
      if (activeConversationIdRef.current === data.conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? { ...m, status: "recalled", content: null, media: [] }
              : m
          )
        );
      }

      // Update conversation last message preview
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === data.conversationId) {
            return {
              ...c,
              lastMessage: c.lastMessage
                ? { ...c.lastMessage, content: "Tin nhắn đã bị thu hồi", status: "recalled" }
                : null
            };
          }
          return c;
        })
      );
    };

    const onReactionUpdated = (data: { messageId: string; conversationId: string; reactions: ReactionGroup[] }) => {
      if (activeConversationIdRef.current === data.conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? { ...m, reactions: data.reactions }
              : m
          )
        );
      }
    };

    const onUserTyping = (data: { conversationId: string; userId: string }) => {
      const conv = conversationsRef.current.find((c) => c.id === data.conversationId);
      const name = conv?.participant.fullName || "Ai đó";
      
      setTypingUsers((prev) => {
        const users = prev[data.conversationId] || [];
        if (users.includes(name)) return prev;
        return { ...prev, [data.conversationId]: [...users, name] };
      });
    };

    const onUserStopTyping = (data: { conversationId: string; userId: string }) => {
      const conv = conversationsRef.current.find((c) => c.id === data.conversationId);
      const name = conv?.participant.fullName || "Ai đó";

      setTypingUsers((prev) => {
        const users = prev[data.conversationId] || [];
        return { ...prev, [data.conversationId]: users.filter((n) => n !== name) };
      });
    };

    socket.on("dm:message", onMessage);
    socket.on("dm:message_recalled", onMessageRecalled);
    socket.on("dm:reaction_updated", onReactionUpdated);
    socket.on("dm:user_typing", onUserTyping);
    socket.on("dm:user_stop_typing", onUserStopTyping);

    return () => {
      socket.off("dm:message", onMessage);
      socket.off("dm:message_recalled", onMessageRecalled);
      socket.off("dm:reaction_updated", onReactionUpdated);
      socket.off("dm:user_typing", onUserTyping);
      socket.off("dm:user_stop_typing", onUserStopTyping);
    };
  }, [loadConversations, markAsRead]);

  return {
    conversations,
    messages,
    hasMoreConversations,
    hasMoreMessages,
    isLoadingConversations,
    isLoadingMessages,
    typingUsers: activeConversationId ? (typingUsers[activeConversationId] || []) : [],
    sendMessage,
    recallMessage,
    toggleReaction,
    startTyping,
    stopTyping,
    loadMoreConversations: () => loadConversations(true),
    loadMoreMessages: () => activeConversationId && loadMessages(activeConversationId, true),
    refreshConversations: () => loadConversations()
  };
}

function getMediaPreviewText(media: any[]): string {
  if (!media || media.length === 0) return '';
  const imageCount = media.filter(m => m.type === 'image' || m.type === 'IMAGE').length;
  const videoCount = media.filter(m => m.type === 'video' || m.type === 'VIDEO').length;
  
  if (imageCount > 0 && videoCount > 0) {
    return `Đã gửi ${imageCount} ảnh và ${videoCount} video`;
  }
  if (imageCount > 0) {
    return `Đã gửi ${imageCount} ảnh`;
  }
  if (videoCount > 0) {
    return `Đã gửi ${videoCount} video`;
  }
  return 'Đã gửi tệp đính kèm';
}
