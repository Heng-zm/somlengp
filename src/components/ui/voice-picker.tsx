
"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";

interface VoicePickerProps {
  voices: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function VoicePicker({
  voices,
  value,
  onChange,
  disabled = false,
}: VoicePickerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState(value);
  const isInteracting = useRef(false);

  const scrollToValue = (val: string) => {
    const container = scrollContainerRef.current;
    if (container) {
      const selectedElement = container.querySelector(`[data-value="${val}"]`) as HTMLElement;
      if (selectedElement) {
        const containerWidth = container.offsetWidth;
        const elementWidth = selectedElement.offsetWidth;
        const scrollLeft = selectedElement.offsetLeft - (containerWidth / 2) + (elementWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  };
  
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
      setTimeout(() => scrollToValue(value), 100);
    }
  }, [value]);

  const handleScroll = () => {
    if (!isInteracting.current) return;
    
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const containerWidth = container.offsetWidth;
    const center = scrollLeft + containerWidth / 2;

    let closestElement: HTMLElement | null = null;
    let minDistance = Infinity;

    container.querySelectorAll<HTMLElement>('[data-value]').forEach((element) => {
      const elementWidth = element.offsetWidth;
      const elementCenter = element.offsetLeft + elementWidth / 2;
      const distance = Math.abs(center - elementCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestElement = element;
      }
    });

    if (closestElement) {
      const newValue = closestElement.dataset.value || "";
      if (newValue && newValue !== internalValue) {
        setInternalValue(newValue);
      }
    }
  };

  const handleInteractionEnd = () => {
    isInteracting.current = false;
     if (internalValue !== undefined) {
        onChange(internalValue);
        scrollToValue(internalValue);
     }
  }

  const handleInteractionStart = () => {
    if (disabled) return;
    isInteracting.current = true;
  }

  const handleClick = (voice: string) => {
    if (disabled) return;
    setInternalValue(voice);
    onChange(voice);
    scrollToValue(voice);
  }

  return (
    <div className={cn("relative w-full h-16 flex items-center justify-center overflow-hidden", disabled && "opacity-50")}>
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onMouseDown={handleInteractionStart}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        className={cn(
            "flex items-center gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar px-[calc(50%-5rem)]",
            disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
        )}
      >
        {voices.map((voice) => (
          <div
            key={voice}
            data-value={voice}
            onClick={() => handleClick(voice)}
            className={cn(
                "snap-center shrink-0 w-40 h-16 flex items-center justify-center text-xl font-bold transition-all duration-150 ease-in-out capitalize",
                disabled ? "cursor-not-allowed" : "cursor-pointer",
                internalValue === voice ? "text-primary scale-100" : "text-muted-foreground/30 scale-75"
            )}
          >
            {voice.replace(/_/g, ' ')}
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-primary/20" aria-hidden="true" />
    </div>
  );
}
