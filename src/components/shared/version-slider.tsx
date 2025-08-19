"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface VersionSliderProps {
  className?: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number; // controlled
  defaultValue?: number; // uncontrolled
  onChange?: (value: number) => void;
  persistKey?: string; // if provided, persists to localStorage
}

export function VersionSlider({
  className,
  label = "Version",
  min = 1,
  max = 5,
  step = 0.1,
  value,
  defaultValue = 1,
  onChange,
  persistKey = "app_version",
}: VersionSliderProps) {
  const [internal, setInternal] = useState<number>(value ?? defaultValue);

  // derive decimal places based on step
  const decimals = useMemo(() => {
    const s = step.toString();
    const idx = s.indexOf(".");
    return idx === -1 ? 0 : s.length - idx - 1;
  }, [step]);

  // Load persisted value on mount if uncontrolled
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (value !== undefined) return; // controlled, do not override
    if (!persistKey) return;
    try {
      const raw = localStorage.getItem(persistKey);
      if (!raw) return;
      const parsed = parseFloat(raw);
      if (!Number.isNaN(parsed)) {
        setInternal(clamp(parsed, min, max));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep internal in sync with controlled value
  useEffect(() => {
    if (value !== undefined) setInternal(value);
  }, [value]);

  // Persist when internal changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!persistKey) return;
    try {
      localStorage.setItem(persistKey, String(internal));
    } catch {}
  }, [internal, persistKey]);

  const display = useMemo(() => `v${internal.toFixed(decimals)}`,[internal, decimals]);

  const handleChange = (vals: number[]) => {
    const next = clamp(roundTo(vals[0], step), min, max);
    setInternal(next);
    onChange?.(next);
  };

  return (
    <Card className={cn("p-4 flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium tabular-nums">{display}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[internal]}
        onValueChange={handleChange}
        aria-label={label}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>v{min.toFixed(decimals)}</span>
        <span>v{max.toFixed(decimals)}</span>
      </div>
    </Card>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function roundTo(n: number, step: number) {
  const inv = 1 / step;
  return Math.round(n * inv) / inv;
}
