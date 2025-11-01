"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface IdleSessionGuardProps {
  timeoutMs?: number;
  redirectPath?: string;
}

// Monitors user activity and redirects to home after inactivity
export function IdleSessionGuard({ timeoutMs = 10 * 60 * 1000, redirectPath = "/" }: IdleSessionGuardProps) {
  const router = useRouter();
  const timeoutRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // Sync across tabs via BroadcastChannel (fallback to storage events)
    try { channelRef.current = new BroadcastChannel("idle-activity"); } catch {}

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      try { localStorage.setItem("__last_activity", String(lastActivityRef.current)); } catch {}
      try { channelRef.current?.postMessage({ t: lastActivityRef.current }); } catch {}
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => handleIdle(), timeoutMs);
    };

    const handleIdle = () => {
      // Double-check based on last activity timestamp to avoid false triggers
      const now = Date.now();
      const last = lastActivityRef.current;
      if (now - last < timeoutMs - 1000) return;

      // Hard redirect to ensure a full reload and session refresh
      try {
        window.location.replace(redirectPath);
      } catch {
        router.replace(redirectPath);
      }
    };

    // Initial schedule
    updateActivity();

    const onVisibility = () => { if (document.visibilityState === "visible") updateActivity(); };

    const events: Array<[keyof DocumentEventMap, EventListener]> = [
      ["mousemove", updateActivity as unknown as EventListener],
      ["mousedown", updateActivity as unknown as EventListener],
      ["keydown", updateActivity as unknown as EventListener],
      ["wheel", updateActivity as unknown as EventListener],
      ["touchstart", updateActivity as unknown as EventListener],
      ["scroll", updateActivity as unknown as EventListener],
      ["visibilitychange", onVisibility as unknown as EventListener],
    ];

    events.forEach(([type, handler]) => document.addEventListener(type, handler, { passive: true } as AddEventListenerOptions));

    const onStorage = (e: StorageEvent) => {
      if (e.key === "__last_activity" && e.newValue) {
        const v = Number(e.newValue);
        if (!Number.isNaN(v)) {
          lastActivityRef.current = v;
          if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
          const remaining = Math.max(0, timeoutMs - (Date.now() - v));
          timeoutRef.current = window.setTimeout(() => handleIdle(), remaining || 0);
        }
      }
    };
    window.addEventListener("storage", onStorage);

    const onBC = (msg: MessageEvent) => {
      const v = Number((msg?.data as any)?.t);
      if (!Number.isNaN(v)) {
        lastActivityRef.current = v;
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        const remaining = Math.max(0, timeoutMs - (Date.now() - v));
        timeoutRef.current = window.setTimeout(() => handleIdle(), remaining || 0);
      }
    };
    channelRef.current?.addEventListener("message", onBC as any);

    return () => {
      events.forEach(([type, handler]) => document.removeEventListener(type, handler));
      window.removeEventListener("storage", onStorage);
      try { channelRef.current?.removeEventListener("message", onBC as any); } catch {}
      timeoutRef.current && window.clearTimeout(timeoutRef.current);
      try { channelRef.current?.close(); } catch {}
    };
  }, [router, timeoutMs, redirectPath]);

  return null;
}
