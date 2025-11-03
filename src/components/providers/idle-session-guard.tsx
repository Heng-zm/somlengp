"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

interface RouteTimeout {
  prefix: string; // e.g. "/checkout"
  timeoutMs: number;
}

interface IdleSessionGuardProps {
  timeoutMs?: number;
  warnMs?: number;
  redirectPath?: string;
  pingMs?: number; // keep-alive interval when active
  pollMs?: number; // server state poll interval
  routeTimeouts?: RouteTimeout[];
  roleTimeouts?: Record<string, number>; // e.g. { admin: 30*60*1000, user: 10*60*1000 }
}

// Monitors user activity and redirects to home after inactivity, clearing client session
export function IdleSessionGuard({ timeoutMs = 10 * 60 * 1000, warnMs = 60 * 1000, redirectPath = "/", pingMs = 5 * 60 * 1000, pollMs = 30 * 1000, routeTimeouts = [], roleTimeouts = {} }: IdleSessionGuardProps) {
  const router = useRouter();
  const timeoutRef = useRef<number | null>(null);
  const tickerRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(timeoutMs);
  const [showWarn, setShowWarn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [effectiveTimeout, setEffectiveTimeout] = useState<number>(timeoutMs);
  const lastPingRef = useRef<number>(0);

  const clearClientSession = useCallback(async () => {
    try { sessionStorage.clear(); } catch {}
    try { localStorage.clear(); } catch {}
    // Attempt NextAuth sign-out if available
    try {
      const mod = await import("next-auth/react").catch(() => null as any);
      if (mod?.signOut) {
        await mod.signOut({ redirect: false });
      }
    } catch {}
    try { channelRef.current?.postMessage({ forceLogout: true }); } catch {}
  }, []);

  useEffect(() => {
    // Sync across tabs via BroadcastChannel (fallback to storage events)
    try { channelRef.current = new BroadcastChannel("idle-activity"); } catch {}

    const chooseTimeout = () => {
      const path = typeof window !== 'undefined' ? window.location.pathname : '/';
      let t = timeoutMs;
      // role overrides if provided
      if (role && roleTimeouts[role]) t = roleTimeouts[role]!;
      // route-specific override
      const rt = routeTimeouts.find(r => path.startsWith(r.prefix));
      if (rt) t = rt.timeoutMs;
      setEffectiveTimeout(t);
      return t;
    };

    const handleIdle = async () => {
      // Double-check based on last activity timestamp to avoid false triggers
      const now = Date.now();
      const last = lastActivityRef.current;
      if (now - last < effectiveTimeout - 1000) return;

      await clearClientSession();
      try { await fetch('/api/session/revoke', { method: 'POST' }).catch(() => {}); } catch {}
      // Hard redirect to ensure a full reload and session refresh
      try {
        window.location.replace(redirectPath);
      } catch {
        router.replace(redirectPath);
      }
    };

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      try { localStorage.setItem("__last_activity", String(lastActivityRef.current)); } catch {}
      try { channelRef.current?.postMessage({ t: lastActivityRef.current }); } catch {}
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      const t = chooseTimeout();
      timeoutRef.current = window.setTimeout(() => handleIdle(), t);
      setShowWarn(false);
      setRemainingMs(t);

      // keep-alive ping
      const now = Date.now();
      if (now - (lastPingRef.current || 0) >= pingMs - 5000) {
        lastPingRef.current = now;
        fetch('/api/session/extend', { method: 'POST' }).catch(() => {});
      }
    };

    // heartbeat ticker for countdown + warn UI
    const startTicker = () => {
      if (tickerRef.current) window.clearInterval(tickerRef.current);
      tickerRef.current = window.setInterval(() => {
        const t = effectiveTimeout;
        const rem = Math.max(0, t - (Date.now() - lastActivityRef.current));
        setRemainingMs(rem);
        setShowWarn(rem <= warnMs);
      }, 1000);
    };

    // Initial schedule
    chooseTimeout();
    updateActivity();
    startTicker();

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
          const t = effectiveTimeout;
          const remaining = Math.max(0, t - (Date.now() - v));
          timeoutRef.current = window.setTimeout(() => handleIdle(), remaining || 0);
        }
      }
    };
    window.addEventListener("storage", onStorage);

    const onBC = (msg: MessageEvent) => {
      const data: any = msg?.data || {};
      if (data?.forceLogout) {
        handleIdle();
        return;
      }
      const v = Number(data?.t);
      if (!Number.isNaN(v)) {
        lastActivityRef.current = v;
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        const t = effectiveTimeout;
        const remaining = Math.max(0, t - (Date.now() - v));
        timeoutRef.current = window.setTimeout(() => handleIdle(), remaining || 0);
      }
    };
    channelRef.current?.addEventListener("message", onBC as any);

    return () => {
      events.forEach(([type, handler]) => document.removeEventListener(type, handler));
      window.removeEventListener("storage", onStorage);
      try { channelRef.current?.removeEventListener("message", onBC as any); } catch {}
      timeoutRef.current && window.clearTimeout(timeoutRef.current);
      tickerRef.current && window.clearInterval(tickerRef.current);
      try { channelRef.current?.close(); } catch {}
    };
  }, [router, timeoutMs, warnMs, redirectPath, clearClientSession, pingMs, routeTimeouts, roleTimeouts, effectiveTimeout]);

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, '0');

  // Poll server state for force-logout and role updates
  useEffect(() => {
    let timer: number | null = null;
    const poll = async () => {
      try {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        const r = await fetch('/api/session/state', { headers: { 'cache-control': 'no-store' } });
        const j = await r.json().catch(() => ({}));
        if (j?.forceLogout) {
          // Trigger idle sequence immediately
          lastActivityRef.current = Date.now() - (effectiveTimeout + 1000);
        }
        if (j?.role && j.role !== role) {
          setRole(j.role);
        }
      } catch {}
    };
    poll();
    timer = window.setInterval(poll, pollMs);
    return () => { if (timer) window.clearInterval(timer); };
  }, [pollMs, effectiveTimeout, role]);

  const staySignedIn = useCallback(() => {
    // manual activity ping
    try { localStorage.setItem("__last_activity", String(Date.now())); } catch {}
    // also dispatch a small event locally
    window.dispatchEvent(new Event('mousemove'));
  }, []);

  return showWarn ? (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-full shadow-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-800 dark:text-gray-100 flex items-center gap-3">
      <span className="text-sm">Inactive – redirecting home in {minutes}:{seconds}. Click to stay signed in.</span>
      <button
        onClick={staySignedIn}
        className="px-3 py-1 text-sm rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Stay signed in"
      >
        Stay signed in
      </button>
    </div>
  ) : null;
}
