"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface RouteTimeout {
  prefix: string;
  timeoutMs: number;
}

interface IdleSessionGuardProps {
  enabled?: boolean;
  timeoutMs?: number;
  warnMs?: number;
  redirectPath?: string;
  pingMs?: number;
  pollMs?: number;
  routeTimeouts?: readonly RouteTimeout[];
  roleTimeouts?: Readonly<Record<string, number>>;
}

interface ActivityMessage {
  forceLogout?: boolean;
  t?: number;
}

const EMPTY_ROUTE_TIMEOUTS: readonly RouteTimeout[] = [];
const EMPTY_ROLE_TIMEOUTS: Readonly<Record<string, number>> = {};
const ACTIVITY_THROTTLE_MS = 1_000;
const MANUAL_ACTIVITY_EVENT = "somleng:activity";

export function IdleSessionGuard({
  enabled = true,
  timeoutMs = 10 * 60 * 1000,
  warnMs = 60 * 1000,
  redirectPath = "/",
  pingMs = 5 * 60 * 1000,
  pollMs = 30 * 1000,
  routeTimeouts = EMPTY_ROUTE_TIMEOUTS,
  roleTimeouts = EMPTY_ROLE_TIMEOUTS,
}: IdleSessionGuardProps) {
  const router = useRouter();
  const timeoutRef = useRef<number | null>(null);
  const tickerRef = useRef<number | null>(null);
  const lastActivityRef = useRef(Date.now());
  const lastHandledActivityRef = useRef(0);
  const lastPingRef = useRef(0);
  const warningVisibleRef = useRef(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const [remainingMs, setRemainingMs] = useState(timeoutMs);
  const [showWarn, setShowWarn] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const getEffectiveTimeout = useCallback(() => {
    let result = timeoutMs;

    if (role && roleTimeouts[role]) {
      result = roleTimeouts[role];
    }

    const path = typeof window === "undefined" ? "/" : window.location.pathname;
    const routeTimeout = routeTimeouts.find(({ prefix }) =>
      path.startsWith(prefix)
    );

    return routeTimeout?.timeoutMs ?? result;
  }, [role, roleTimeouts, routeTimeouts, timeoutMs]);

  const clearClientSession = useCallback(async () => {
    // Keep user preferences and working data. Only remove metadata owned by
    // this guard; authentication libraries clear their own cookies/tokens.
    try {
      localStorage.removeItem("__last_activity");
    } catch {
      // Storage may be unavailable.
    }

    try {
      const auth = await import("next-auth/react").catch(() => null);
      await auth?.signOut?.({ redirect: false });
    } catch {
      // NextAuth is optional in this application.
    }

    try {
      channelRef.current?.postMessage({ forceLogout: true });
    } catch {
      // BroadcastChannel is optional.
    }
  }, []);

  const performLogout = useCallback(async () => {
    await clearClientSession();

    try {
      await fetch("/api/session/revoke", { method: "POST" });
    } catch {
      // Continue with the local redirect if the network is unavailable.
    }

    try {
      window.location.replace(redirectPath);
    } catch {
      router.replace(redirectPath);
    }
  }, [clearClientSession, redirectPath, router]);

  useEffect(() => {
    if (!enabled) return;

    try {
      channelRef.current = new BroadcastChannel("idle-activity");
    } catch {
      channelRef.current = null;
    }

    const setWarningVisibility = (remaining: number) => {
      const shouldWarn = remaining <= warnMs;

      if (shouldWarn) {
        setRemainingMs(remaining);
      }

      if (warningVisibleRef.current !== shouldWarn) {
        warningVisibleRef.current = shouldWarn;
        setShowWarn(shouldWarn);
      }
    };

    const handleIdle = async () => {
      const effectiveTimeout = getEffectiveTimeout();
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed < effectiveTimeout - 1000) {
        const remaining = Math.max(0, effectiveTimeout - elapsed);
        timeoutRef.current = window.setTimeout(handleIdle, remaining);
        return;
      }

      await performLogout();
    };

    const scheduleIdleCheck = (activityAt: number) => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      const remaining = Math.max(
        0,
        getEffectiveTimeout() - (Date.now() - activityAt)
      );
      timeoutRef.current = window.setTimeout(handleIdle, remaining);
    };

    const updateActivity = (force = false) => {
      const now = Date.now();
      if (
        !force &&
        now - lastHandledActivityRef.current < ACTIVITY_THROTTLE_MS
      ) {
        return;
      }

      lastHandledActivityRef.current = now;
      lastActivityRef.current = now;
      scheduleIdleCheck(now);
      setWarningVisibility(getEffectiveTimeout());

      try {
        localStorage.setItem("__last_activity", String(now));
      } catch {
        // Cross-tab storage sync is optional.
      }

      try {
        channelRef.current?.postMessage({ t: now });
      } catch {
        // BroadcastChannel sync is optional.
      }

      if (now - lastPingRef.current >= pingMs) {
        lastPingRef.current = now;
        fetch("/api/session/extend", { method: "POST" }).catch(() => {});
      }
    };

    const syncExternalActivity = (activityAt: number) => {
      if (!Number.isFinite(activityAt)) return;
      lastActivityRef.current = activityAt;
      scheduleIdleCheck(activityAt);
      const remaining = Math.max(
        0,
        getEffectiveTimeout() - (Date.now() - activityAt)
      );
      setWarningVisibility(remaining);
    };

    const onActivity = () => updateActivity();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        updateActivity(true);
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === "__last_activity" && event.newValue) {
        syncExternalActivity(Number(event.newValue));
      }
    };
    const onBroadcast = (event: MessageEvent<ActivityMessage>) => {
      if (event.data?.forceLogout) {
        void performLogout();
        return;
      }

      if (typeof event.data?.t === "number") {
        syncExternalActivity(event.data.t);
      }
    };

    const activityEvents: Array<keyof DocumentEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "wheel",
      "touchstart",
      "scroll",
    ];

    updateActivity(true);
    tickerRef.current = window.setInterval(() => {
      const remaining = Math.max(
        0,
        getEffectiveTimeout() - (Date.now() - lastActivityRef.current)
      );
      setWarningVisibility(remaining);
    }, 1000);

    activityEvents.forEach((type) =>
      document.addEventListener(type, onActivity, { passive: true })
    );
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    window.addEventListener(MANUAL_ACTIVITY_EVENT, onActivity);
    channelRef.current?.addEventListener("message", onBroadcast);

    return () => {
      activityEvents.forEach((type) =>
        document.removeEventListener(type, onActivity)
      );
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(MANUAL_ACTIVITY_EVENT, onActivity);
      channelRef.current?.removeEventListener("message", onBroadcast);

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      if (tickerRef.current !== null) {
        window.clearInterval(tickerRef.current);
      }

      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [
    enabled,
    getEffectiveTimeout,
    performLogout,
    pingMs,
    warnMs,
  ]);

  useEffect(() => {
    if (!enabled) return;

    let timer: number | null = null;
    let controller: AbortController | null = null;

    const poll = async () => {
      if (document.visibilityState === "hidden") return;

      controller?.abort();
      controller = new AbortController();

      try {
        const response = await fetch("/api/session/state", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;

        const state = (await response.json()) as {
          forceLogout?: boolean;
          role?: string | null;
        };

        if (state.forceLogout) {
          await performLogout();
          return;
        }

        setRole((current) =>
          state.role && state.role !== current ? state.role : current
        );
      } catch {
        // Polling is best-effort and resumes on the next interval.
      }
    };

    void poll();
    timer = window.setInterval(() => void poll(), pollMs);

    return () => {
      controller?.abort();
      if (timer !== null) {
        window.clearInterval(timer);
      }
    };
  }, [enabled, performLogout, pollMs]);

  const staySignedIn = useCallback(() => {
    window.dispatchEvent(new Event(MANUAL_ACTIVITY_EVENT));
  }, []);

  if (!enabled || !showWarn) {
    return null;
  }

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000)
    .toString()
    .padStart(2, "0");

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-[1000] flex w-[min(92vw,34rem)] -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <span className="text-sm">
        Inactive — signing out in {minutes}:{seconds}.
      </span>
      <button
        type="button"
        onClick={staySignedIn}
        className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
      >
        Stay signed in
      </button>
    </div>
  );
}
