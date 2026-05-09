import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useSocketStore } from "../store/socketStore";

export function useRealtime() {
  const queryClient = useQueryClient();
  const syncState = useSocketStore((state) => state.syncState);
  const setSyncState = useSocketStore((state) => state.setSyncState);
  const markMessage = useSocketStore((state) => state.markMessage);

  useEffect(() => {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/dashboard-update`;
    const socket = new WebSocket(socketUrl);
    let shouldCloseWhenOpen = false;

    socket.onopen = () => {
      if (shouldCloseWhenOpen) {
        socket.close();
        return;
      }
      setSyncState("LIVE");
    };
    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed?.channel === "appointment-changed") {
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
          queryClient.invalidateQueries({ queryKey: ["appointment-detail"] });
          queryClient.invalidateQueries({ queryKey: ["appointment-status-log"] });
          queryClient.invalidateQueries({ queryKey: ["appointment-candidates"] });
        }
      } catch {
        // Keep the sync indicator resilient even if the payload is malformed.
      }
      markMessage();
      setSyncState("LIVE");
    };
    socket.onclose = () => setSyncState("DISCONNECTED");
    socket.onerror = () => setSyncState("STALE");

    const heartbeat = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send("ping");
      }
    }, 10_000);

    return () => {
      clearInterval(heartbeat);
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
        return;
      }
      if (socket.readyState === WebSocket.CONNECTING) {
        shouldCloseWhenOpen = true;
      }
    };
  }, [markMessage, queryClient, setSyncState]);

  const badgeColor = useMemo(() => {
    if (syncState === "LIVE") return "text-success-700";
    if (syncState === "DELAYED") return "text-warning-700";
    return "text-error-700";
  }, [syncState]);

  return { syncState, badgeColor };
}
