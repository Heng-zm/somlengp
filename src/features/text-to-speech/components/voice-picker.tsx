
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { User, UserRound, Play, LoaderCircle, Pause } from "lucide-react";
import { useState, useRef } from "react";
import { textToSpeech } from "@/ai/flows/text-to-speech-flow";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

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

export function VoicePicker({ selectedValue, onValueChange, disabled }: VoicePickerProps) {
    const [previews, setPreviews] = useState<Record<string, string>>({});
    const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
    const [playingPreview, setPlayingPreview] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { toast } = useToast();

    const stopCurrentPreview = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setPlayingPreview(null);
    };

    const handlePreview = async (e: React.MouseEvent, voiceValue: string) => {
        e.stopPropagation(); // Prevent card selection when clicking preview button
        if (loadingPreview) return;

        if (playingPreview === voiceValue) {
            stopCurrentPreview();
            return;
        }
        
        stopCurrentPreview(); // Stop any other preview before starting a new one

        if (previews[voiceValue]) {
            if (audioRef.current) {
                audioRef.current.src = previews[voiceValue];
                audioRef.current.play().catch(console.error);
                setPlayingPreview(voiceValue);
            }
            return;
        }

        setLoadingPreview(voiceValue);
        try {
            const { audioDataUri } = await textToSpeech({ text: "Hello, you are listening to a preview.", voice: voiceValue });
            setPreviews(prev => ({ ...prev, [voiceValue]: audioDataUri }));
            
            if (audioRef.current) {
                audioRef.current.src = audioDataUri;
                audioRef.current.play().catch(console.error);
                setPlayingPreview(voiceValue);
            }

        } catch (error: any) {
            toast({
                title: "Preview Failed",
                description: error.message || "Could not generate voice preview.",
                variant: "destructive"
            });
        } finally {
            setLoadingPreview(null);
        }
    }
    
    return (
        <div className="relative">
            <Carousel 
                opts={{
                    align: "start",
                    loop: false,
                }}
                className="w-full"
            >
                <CarouselContent>
                    {voices.map((voice) => (
                        <CarouselItem key={voice.value} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                            <div 
                                className="p-1"
                                onClick={() => !disabled && onValueChange(voice.value)}
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
                onPause={() => setPlayingPreview(null)}
            />
        </div>
    );
}
