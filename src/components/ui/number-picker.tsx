
"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";

interface NumberPickerProps {
  min?: number;
  max?: number;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

export function NumberPicker({
  min = 1,
  max = 30,
  value,
  onChange,
}: NumberPickerProps) {
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState(value);
  const isInteracting = useRef(false);

  const scrollToValue = (val: number) => {
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
  
  // Set initial scroll position and update when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
      scrollToValue(value);
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
      const dataValue = (closestElement as HTMLElement).getAttribute('data-value');
      if (dataValue) {
        const newValue = parseInt(dataValue, 10);
        if (newValue !== internalValue) {
          setInternalValue(newValue);
        }
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
    isInteracting.current = true;
  }

  const handleClick = (num: number) => {
    setInternalValue(num);
    onChange(num);
    scrollToValue(num);
  }

  return (
    <div className="relative w-full h-16 flex items-center justify-center overflow-hidden">
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onMouseDown={handleInteractionStart}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        className="flex items-center gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar px-[calc(50%-2rem)] cursor-grab active:cursor-grabbing"
      >
        {numbers.map((num) => (
          <div
            key={num}
            data-value={num}
            onClick={() => handleClick(num)}
            className={cn(
                "snap-center shrink-0 w-16 h-16 flex items-center justify-center text-4xl font-bold transition-all duration-150 ease-in-out cursor-pointer",
                internalValue === num ? "text-primary scale-100" : "text-muted-foreground/30 scale-75"
            )}
          >
            {num}
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-primary/20" aria-hidden="true" />
    </div>
  );
}
