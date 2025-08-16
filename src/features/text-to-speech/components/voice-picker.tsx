
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { User, UserRound, Play, LoaderCircle, Pause } from "lucide-react";
import { useState, useRef, useEffect, memo, useCallback, useMemo } from "react";
import { textToSpeech } from "@/ai/flows/text-to-speech-flow";
import { useToast } from "@/hooks/use-toast";
import { showVoicePreviewErrorToast } from '@/lib/toast-utils';
import { Button } from "@/components/ui/button";

const VOICE_PREVIEW_CACHE_KEY = 'voicePreviewCache';

export const voices = [
    { value: 'algenib', label: 'Algenib', gender: 'Female' },
    { value: 'achernar', label: 'Achernar', gender: 'Male' },
    { value: 'gacrux', label: 'Gacrux', gender: 'Female' },
    { value: 'rasalgethi', label: 'Rasalgethi', gender: 'Male' },
    { value: 'despina', label: 'Despina', gender: 'Female' },
    { value: 'zephyr', label: 'Zephyr', gender: 'Male' },
    { value: 'umbriel', label: 'Umbriel', gender: 'Female' },
    { value: 'zubenelgenubi', label: 'Zubenelgenubi', gender: 'Male' },
];


interface VoicePickerProps {
    selectedValue: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
}

const VoicePicker = memo(function VoicePicker({ selectedValue, onValueChange, disabled }: VoicePickerProps) {
    const [previews, setPreviews] = useState<Record<string, string>>({});
    const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
    const [playingPreview, setPlayingPreview] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();

    // Load cached previews from localStorage on initial render
    useEffect(() => {
        try {
            const cachedPreviews = localStorage.getItem(VOICE_PREVIEW_CACHE_KEY);
            if (cachedPreviews) {
                setPreviews(JSON.parse(cachedPreviews));
            }
        } catch (error) {
            console.error("Failed to load voice previews from localStorage", error);
        }
    }, []);

    // Effect to clean up the audio element on unmount
    useEffect(() => {
        const audioElement = audioRef.current;
        return () => {
            if (audioElement) {
                audioElement.pause();
                audioElement.src = '';
            }
        };
    }, []);

    const stopCurrentPreview = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setPlayingPreview(null);
    }, []);

    const handlePreview = useCallback(async (e: React.MouseEvent, voiceValue: string) => {
        e.stopPropagation(); // Prevent card selection when clicking preview button
        if (loadingPreview) return;
    
        if (playingPreview === voiceValue) {
            stopCurrentPreview();
            return;
        }
        
        stopCurrentPreview(); // Stop any other preview before starting a new one
    
        const playAudio = (src: string) => {
            if (audioRef.current) {
                audioRef.current.src = src;
                audioRef.current.play().catch(console.error);
                setPlayingPreview(voiceValue);
            }
        };
    
        if (previews[voiceValue]) {
            playAudio(previews[voiceValue]);
            return;
        }
    
        setLoadingPreview(voiceValue);
        try {
            const { audioDataUri } = await textToSpeech({ text: "Hello, you are listening to a preview.", voice: voiceValue });
            const newPreviews = { ...previews, [voiceValue]: audioDataUri };
            setPreviews(newPreviews);
            try {
                localStorage.setItem(VOICE_PREVIEW_CACHE_KEY, JSON.stringify(newPreviews));
            } catch (error) {
                console.error("Failed to save voice previews to localStorage", error);
            }
            playAudio(audioDataUri);
        } catch (error: unknown) {
            const voiceLabel = voices.find(v => v.value === voiceValue)?.label || voiceValue;
            showVoicePreviewErrorToast(voiceLabel);
        } finally {
            setLoadingPreview(null);
        }
    }, [loadingPreview, playingPreview, previews, stopCurrentPreview, toast]);
    const carouselOpts = useMemo(() => ({
        align: "start" as const,
        loop: false,
    }), []);

    const handleCardClick = useCallback((voiceValue: string) => {
        if (!disabled) {
            onValueChange(voiceValue);
        }
    }, [disabled, onValueChange]);
    
    return (
        <div className="relative">
            <Carousel 
                opts={carouselOpts}
                className="w-full"
            >
                <CarouselContent>
                    {voices.map((voice) => (
                        <CarouselItem key={voice.value} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                            <div 
                                className="p-1"
                                onClick={() => handleCardClick(voice.value)}
                            >
                                <Card 
                                    className={cn(
                                        "overflow-hidden transition-all duration-200 cursor-pointer group",
                                        "hover:shadow-lg hover:border-primary",
                                        disabled && "opacity-50 cursor-not-allowed",
                                        selectedValue === voice.value && "border-2 border-primary shadow-lg"
                                    )}
                                >
                                    <CardContent className="relative flex flex-col items-center justify-center p-4 gap-2 aspect-square">
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="absolute top-2 right-2 w-8 h-8 rounded-full z-10"
                                            onClick={(e) => handlePreview(e, voice.value)}
                                            disabled={loadingPreview !== null || disabled}
                                        >
                                            {loadingPreview === voice.value ? (
                                                <LoaderCircle className="animate-spin" />
                                            ) : playingPreview === voice.value ? (
                                                <Pause className="w-5 h-5 fill-current" />
                                            ) : (
                                                <Play className="w-5 h-5 fill-current" />
                                            )}
                                            <span className="sr-only">Preview voice</span>
                                        </Button>
                                        <Avatar className="w-16 h-16 transition-transform duration-300 group-hover:scale-110">
                                            <AvatarFallback className="bg-muted/50 text-muted-foreground text-4xl">
                                                {voice.gender === 'Male' ? <User /> : <UserRound />}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-center">
                                            <p className="font-semibold">{voice.label}</p>
                                            <p className="text-xs text-muted-foreground">{voice.gender}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>
            <audio 
                ref={audioRef} 
                className="hidden" 
                onEnded={() => setPlayingPreview(null)}
                onPause={() => setPlayingPreview(null)} // This also helps reset state if user pauses manually
            />
        </div>
    );
});

export { VoicePicker };
