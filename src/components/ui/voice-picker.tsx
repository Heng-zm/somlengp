
"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState, useMemo, useContext } from "react";
import { textToSpeechPreview } from "@/ai/flows/text-to-speech-preview-flow";
import { Loader2, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LanguageContext } from "@/contexts/language-context";
import { allTranslations } from "@/lib/translations";

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [internalValue, setInternalValue] = useState(value);
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const isInteracting = useRef(false);
  const { toast } = useToast();

  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('VoicePicker must be used within a LanguageProvider');
  }
  const { language } = langContext;
  const t = useMemo(() => allTranslations[language], [language]);

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
  
  useEffect(() => {
    if (previewAudio && audioRef.current) {
        audioRef.current.src = previewAudio;
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  }, [previewAudio]);

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

  const generatePreview = async (voice: string) => {
    if (isPreviewLoading) return;
    setIsPreviewLoading(true);
    setPreviewAudio(null);
    try {
        const result = await textToSpeechPreview({ voice });
        setPreviewAudio(result.audioDataUri);
    } catch (e: any) {
        const errorMessage = (e.message || '').toLowerCase();
        let title = "Preview Error";
        let description = "Could not generate voice preview.";

        if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
            title = t.rateLimitExceeded;
            description = t.rateLimitMessage;
        }
        
        toast({ title, description, variant: "destructive" });
        console.error("Preview error:", e);
    } finally {
        setIsPreviewLoading(false);
    }
  };

  const handleInteractionEnd = () => {
    isInteracting.current = false;
     if (internalValue !== undefined) {
        if (internalValue !== value) {
            onChange(internalValue);
        }
        scrollToValue(internalValue);
     }
  }

  const handleInteractionStart = () => {
    if (disabled) return;
    isInteracting.current = true;
  }

  const handleClick = (voice: string) => {
    if (disabled) return;
    // Set the voice and trigger preview
    onChange(voice); 
    generatePreview(voice);
    setInternalValue(voice);
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
            <div className="flex items-center gap-2">
                <span>{voice.replace(/_/g, ' ')}</span>
                {internalValue === voice && isPreviewLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {internalValue === voice && !isPreviewLoading && previewAudio && <Volume2 className="h-4 w-4" />}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-primary/20" aria-hidden="true" />
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
