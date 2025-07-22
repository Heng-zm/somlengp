
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { User, UserRound } from "lucide-react";

export const voices = [
    { value: 'Algenib', label: 'Algenib', gender: 'Female' },
    { value: 'Achernar', label: 'Achernar', gender: 'Male' },
    { value: 'en-US-Wavenet-A', label: 'Linda', gender: 'Female' },
    { value: 'en-US-Wavenet-B', label: 'John', gender: 'Male' },
    { value: 'en-GB-Wavenet-A', label: 'Abigail', gender: 'Female' },
    { value: 'en-GB-Wavenet-B', label: 'Peter', gender: 'Male' },
    { value: 'en-AU-Wavenet-A', label: 'Olivia', gender: 'Female' },
    { value: 'en-AU-Wavenet-B', label: 'James', gender: 'Male' },
];

interface VoicePickerProps {
    selectedValue: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
}

export function VoicePicker({ selectedValue, onValueChange, disabled }: VoicePickerProps) {
    return (
        <Carousel 
            opts={{
                align: "start",
                loop: false,
            }}
            className="w-full"
        >
            <CarouselContent>
                {voices.map((voice) => (
                    <CarouselItem key={voice.value} className="basis-1/3 md:basis-1/4 lg:basis-1/6">
                        <div 
                            className="p-1"
                            onClick={() => !disabled && onValueChange(voice.value)}
                        >
                            <Card 
                                className={cn(
                                    "overflow-hidden transition-all duration-200 cursor-pointer",
                                    "hover:shadow-lg hover:border-primary",
                                    disabled && "opacity-50 cursor-not-allowed",
                                    selectedValue === voice.value && "border-2 border-primary shadow-lg"
                                )}
                            >
                                <CardContent className="flex flex-col items-center justify-center p-4 gap-2 aspect-square">
                                    <Avatar className="w-16 h-16">
                                        <AvatarFallback className="bg-muted/50 text-muted-foreground text-4xl">
                                            {voice.gender === 'Male' ? <User /> : <UserRound />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold">{voice.label}</p>
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
    );
}
