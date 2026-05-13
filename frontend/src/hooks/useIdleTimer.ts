import { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore";

const IDLE_TIME = 10 * 60 * 1000; // 10 minutos

export function useIdleTimer() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearSession = useAuthStore((state) => state.clearSession);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      clearSession();
    }, IDLE_TIME);
  }, [clearSession]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [resetTimer]);
}
