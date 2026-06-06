"use client";

import { useState, useEffect, useCallback } from "react";
import { getSocket, connectSocket } from "../socket";
import { messageApi } from "../api";
import { authStorage } from "../auth-storage";

export function useUnreadDM() {
  const [unreadCount, setUnreadCount] = useState(0);

  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio("/sounds/dm-notification.mp3");
      audio.volume = 0.5;
      audio.play().catch((err) => console.log("Audio play blocked by browser:", err));
    } catch (err) {
      console.error("Failed to play sound:", err);
    }
  }, []);

  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) return;

    // Fetch initial unread count
    messageApi.getUnreadCount()
      .then((count) => setUnreadCount(count))
      .catch((err) => console.error("Failed to fetch initial unread count:", err));

    let socket;
    try {
      socket = connectSocket();
    } catch (err) {
      return;
    }

    const onUnreadUpdate = (data: { count: number }) => {
      setUnreadCount(data.count);
    };

    const onMessageReceived = (msg: any) => {
      const currentUser = authStorage.getUser() as any;
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
  }, [playNotificationSound]);

  return {
    unreadCount,
    playNotificationSound
  };
}
