"use client";

import { io, Socket } from "socket.io-client";
import { API_URL } from "./api";
import { authStorage } from "./auth-storage";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  // Return existing socket if it exists (even if reconnecting)
  // This prevents creating multiple socket instances
  if (socket) return socket;

  const token = authStorage.getToken();
  if (!token) {
    throw new Error("Cần đăng nhập để kết nối realtime");
  }

  socket = io(API_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket?.id);
  });

  let isRefreshingSocket = false;

  socket.on("connect_error", (err) => {
    console.error("🔌 Socket connection error:", err.message);

    // Token expired — try reconnecting with fresh token
    if ((err.message.includes("Token") || err.message.includes("jwt expired")) && !isRefreshingSocket) {
      isRefreshingSocket = true;
      fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Refresh failed");
          return res.json();
        })
        .then((data) => {
          const currentUser = authStorage.getUser();
          if (currentUser) {
            authStorage.save(data.accessToken, currentUser);
          }
          if (socket) {
            socket.auth = { token: data.accessToken };
            socket.connect();
          }
        })
        .catch((e) => {
          console.error("Socket token refresh failed", e);
        })
        .finally(() => {
          isRefreshingSocket = false;
        });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
