"use client";

import { useState, useEffect, useCallback } from "react";
import { connectSocket } from "../socket";
import { messageApi } from "../api";
import { authStorage } from "../auth-storage";
import { playChatSound } from "../sounds";
import type { DirectMessage } from "../types/message";

export function useUnreadDM() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [token, setToken] = useState<string | null>(() => 
    typeof window !== "undefined" ? authStorage.getToken() : null
  );

  const playNotificationSound = useCallback(() => {
    playChatSound("receive");
  }, []);

  // Sync token state with localStorage & listen to changes
  useEffect(() => {
    const handleAuthChange = () => {
      setToken(authStorage.getToken());
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnreadCount(0);
      return;
    }

    // Fetch initial unread count
    messageApi.getUnreadCount()
      .then((count) => setUnreadCount(count))
      .catch((err) => console.error("Failed to fetch initial unread count:", err));

    let socket;
    try {
      socket = connectSocket();
    } catch {
      return;
    }

    const onUnreadUpdate = (data: { count: number }) => {
      setUnreadCount(data.count);
    };

    const onMessageReceived = (msg: DirectMessage) => {
      const currentUser = authStorage.getUser() as { id: string } | null;
      if (currentUser && msg.senderId !== currentUser.id) {
        // Play sound if not the sender
        playNotificationSound();
      }
    };

    socket.on("dm:unread_update", onUnreadUpdate);
    socket.on("dm:message", onMessageReceived);

    return () => {
      socket.off("dm:unread_update", onUnreadUpdate);
      socket.off("dm:message", onMessageReceived);
    };
  }, [token, playNotificationSound]);

  return {
    unreadCount,
    playNotificationSound
  };
}
