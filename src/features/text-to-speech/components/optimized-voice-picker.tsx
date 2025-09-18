"use client";

import React, { 
  useState, 
  useRef, 
  useEffect, 
  memo, 
  useCallback, 
  useMemo 
} from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { 
  User, 
  UserRound, 
  Play, 
  Pause, 
  Volume2, 
  Heart,
  HeartOff,
  Star,
  Info
} from "lucide-react";
import { textToSpeech } from "@/ai/flows/text-to-speech-flow";
import { 
  showVoicePreviewErrorToast, 
  showVoicePreviewSuccessToast 
} from '@/lib/toast-utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Enhanced voice data with more metadata
export const voices = [
  { 
    value: 'algenib', 
    label: 'Algenib', 
    gender: 'Female',
    accent: 'American',
    description: 'Warm and professional voice perfect for business content',
    personality: 'Professional',
    sampleRate: 24000,
    tags: ['business', 'professional', 'warm']
  },
  { 
    value: 'achernar', 
    label: 'Achernar', 
    gender: 'Male',
    accent: 'American',
    description: 'Deep and authoritative voice ideal for narrations',
    personality: 'Authoritative',
    sampleRate: 24000,
    tags: ['narration', 'deep', 'authoritative']
  },
  { 
    value: 'gacrux', 
    label: 'Gacrux', 
    gender: 'Female',
    accent: 'British',
    description: 'Clear and articulate with a sophisticated tone',
    personality: 'Sophisticated',
    sampleRate: 24000,
    tags: ['clear', 'articulate', 'british']
  },
  { 
    value: 'rasalgethi', 
    label: 'Rasalgethi', 
    gender: 'Male',
    accent: 'American',
    description: 'Friendly and conversational, great for educational content',
    personality: 'Friendly',
    sampleRate: 24000,
    tags: ['friendly', 'educational', 'conversational']
  },
  { 
    value: 'despina', 
    label: 'Despina', 
    gender: 'Female',
    accent: 'American',
    description: 'Youthful and energetic voice perfect for creative content',
    personality: 'Energetic',
    sampleRate: 24000,
    tags: ['youthful', 'energetic', 'creative']
  },
  { 
    value: 'zephyr', 
    label: 'Zephyr', 
    gender: 'Male',
    accent: 'American',
    description: 'Calm and soothing voice ideal for meditation and relaxation',
    personality: 'Calm',
    sampleRate: 24000,
    tags: ['calm', 'soothing', 'meditation']
  },
  { 
    value: 'umbriel', 
    label: 'Umbriel', 
    gender: 'Female',
    accent: 'American',
    description: 'Versatile and natural voice suitable for various content types',
    personality: 'Versatile',
    sampleRate: 24000,
    tags: ['versatile', 'natural', 'balanced']
  },
  { 
    value: 'zubenelgenubi', 
    label: 'Zubenelgenubi', 
    gender: 'Male',
    accent: 'American',
    description: 'Rich and expressive voice great for storytelling',
    personality: 'Expressive',
    sampleRate: 24000,
    tags: ['rich', 'expressive', 'storytelling']
  },
];

// Cache configuration
const VOICE_PREVIEW_CACHE_KEY = 'voicePreviewCache_v2';
const VOICE_FAVORITES_KEY = 'voiceFavorites';
const VOICE_USAGE_STATS_KEY = 'voiceUsageStats';
const PREVIEW_TEXT_OPTIONS = [
  "Hello! This is a sample of my voice. How do I sound?",
  "Welcome to our text-to-speech service. I hope you enjoy listening.",
  "The quick brown fox jumps over the lazy dog. Numbers: 1, 2, 3, 4, 5.",
  "Thank you for trying our voice synthesis technology today.",
];

// Types
interface VoicePickerProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  showAdvancedControls?: boolean;
}

interface PreviewState {
  [voiceId: string]: {
    audioDataUri: string;
    duration: number;
    timestamp: number;
  };
}

interface VoiceStats {
  [voiceId: string]: {
    usageCount: number;
    lastUsed: number;
    totalListenTime: number;
  };
}

// Memoized Voice Card component
const VoiceCard = memo<{
  voice: typeof voices[0];
  isSelected: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  isFavorite: boolean;
  usageCount: number;
  onSelect: () => void;
  onPreview: (e: React.MouseEvent) => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  disabled: boolean;
  showAdvancedControls: boolean;
}>(({ 
  voice, 
  isSelected, 
  isPlaying, 
  isLoading, 
  isFavorite,
  usageCount,
  onSelect, 
  onPreview, 
  onToggleFavorite,
  disabled,
  showAdvancedControls
}) => {
  const isPopular = usageCount > 5;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={cn(
              "overflow-hidden transition-all duration-200 cursor-pointer group relative",
              "hover:shadow-lg hover:border-primary/50 hover:scale-[1.02]",
              disabled && "opacity-50 cursor-not-allowed",
              isSelected && "border-2 border-primary shadow-lg scale-[1.02]",
              isFavorite && "ring-2 ring-yellow-400/30"
            )}
            onClick={onSelect}
          >
            <CardContent className="relative flex flex-col items-center justify-center p-4 gap-2 aspect-square">
              
              {/* Top badges */}
              <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
                {isPopular && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                )}
                
                <div className="flex gap-1">
                  {showAdvancedControls && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="w-6 h-6 p-0 rounded-full bg-background/80 backdrop-blur-sm"
                      onClick={onToggleFavorite}
                      disabled={disabled}
                    >
                      {isFavorite ? (
                        <Heart className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <HeartOff className="w-3 h-3 opacity-60" />
                      )}
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="w-6 h-6 p-0 rounded-full bg-background/80 backdrop-blur-sm"
                    onClick={onPreview}
                    disabled={isLoading || disabled}
                  >
                    {isLoading ? (
                      <div className="w-3 h-3 animate-spin rounded-full border border-current border-t-transparent" />
                    ) : isPlaying ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Avatar */}
              <Avatar className={cn(
                "w-16 h-16 transition-all duration-300 group-hover:scale-110",
                isSelected && "ring-4 ring-primary/20"
              )}>
                <AvatarFallback className={cn(
                  "text-2xl transition-colors",
                  voice.gender === 'Male' 
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" 
                    : "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300"
                )}>
                  {voice.gender === 'Male' ? <User /> : <UserRound />}
                </AvatarFallback>
              </Avatar>

              {/* Voice info */}
              <div className="text-center">
                <p className="font-semibold text-sm">{voice.label}</p>
                <p className="text-xs text-muted-foreground">
                  {voice.gender} • {voice.accent}
                </p>
                {showAdvancedControls && usageCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Used {usageCount} times
                  </p>
                )}
              </div>

              {/* Personality badge */}
              <Badge variant="outline" className="text-xs">
                {voice.personality}
              </Badge>

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <div className="text-xs text-muted-foreground">Loading...</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{voice.label}</p>
            <p className="text-xs text-muted-foreground">{voice.description}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {voice.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

VoiceCard.displayName = 'VoiceCard';

// Filter controls component
const VoiceFilters = memo<{
  filterGender: string;
  filterPersonality: string;
  showOnlyFavorites: boolean;
  onGenderChange: (gender: string) => void;
  onPersonalityChange: (personality: string) => void;
  onToggleFavorites: () => void;
}>(({ 
  filterGender, 
  filterPersonality, 
  showOnlyFavorites,
  onGenderChange, 
  onPersonalityChange, 
  onToggleFavorites 
}) => {
  const personalities = useMemo(() => {
    return Array.from(new Set(voices.map(v => v.personality)));
  }, []);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <select
        value={filterGender}
        onChange={(e) => onGenderChange(e.target.value)}
        className="px-3 py-1 text-sm rounded border bg-background"
      >
        <option value="">All Genders</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>

      <select
        value={filterPersonality}
        onChange={(e) => onPersonalityChange(e.target.value)}
        className="px-3 py-1 text-sm rounded border bg-background"
      >
        <option value="">All Personalities</option>
        {personalities.map(personality => (
          <option key={personality} value={personality}>{personality}</option>
        ))}
      </select>

      <Button
        onClick={onToggleFavorites}
        variant={showOnlyFavorites ? "default" : "outline"}
        size="sm"
        className="text-xs"
      >
        <Heart className="w-3 h-3 mr-1" />
        Favorites Only
      </Button>
    </div>
  );
});

VoiceFilters.displayName = 'VoiceFilters';

// Main Optimized Voice Picker Component
const OptimizedVoicePicker = memo<VoicePickerProps>(({ 
  selectedValue, 
  onValueChange, 
  disabled = false,
  showAdvancedControls = true
}) => {
  // State management
  const [previews, setPreviews] = useState<PreviewState>({});
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [voiceStats, setVoiceStats] = useState<VoiceStats>({});
  
  // Filter states
  const [filterGender, setFilterGender] = useState('');
  const [filterPersonality, setFilterPersonality] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentPreviewText = useRef(PREVIEW_TEXT_OPTIONS[0]);

  // Load cached data on mount
  useEffect(() => {
    try {
      // Load cached previews
      const cachedPreviews = localStorage.getItem(VOICE_PREVIEW_CACHE_KEY);
      if (cachedPreviews) {
        const parsed = JSON.parse(cachedPreviews);
        setPreviews(parsed);
      }

      // Load favorites
      const savedFavorites = localStorage.getItem(VOICE_FAVORITES_KEY);
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      }

      // Load usage stats
      const savedStats = localStorage.getItem(VOICE_USAGE_STATS_KEY);
      if (savedStats) {
        setVoiceStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error("Failed to load cached data:", error);
    }
  }, []);

  // Audio cleanup effect
  useEffect(() => {
    const audioElement = audioRef.current;
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, []);

  // Update usage stats when voice changes
  useEffect(() => {
    if (selectedValue) {
      setVoiceStats(prev => {
        const updated = {
          ...prev,
          [selectedValue]: {
            usageCount: (prev[selectedValue]?.usageCount || 0) + 1,
            lastUsed: Date.now(),
            totalListenTime: prev[selectedValue]?.totalListenTime || 0
          }
        };
        localStorage.setItem(VOICE_USAGE_STATS_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [selectedValue]);

  // Stop current preview
  const stopCurrentPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingPreview(null);
  }, []);

  // Handle preview generation and playback
  const handlePreview = useCallback(async (e: React.MouseEvent, voiceValue: string) => {
    e.stopPropagation();
    if (loadingPreview || disabled) return;

    // If currently playing this voice, stop it
    if (playingPreview === voiceValue) {
      stopCurrentPreview();
      return;
    }
    
    // Stop any other preview
    stopCurrentPreview();

    // Use cached preview if available and recent (less than 1 hour old)
    const cached = previews[voiceValue];
    if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) {
      const playAudio = (src: string) => {
        if (audioRef.current) {
          audioRef.current.src = src;
          audioRef.current.play().catch(console.error);
          setPlayingPreview(voiceValue);
        }
      };
      playAudio(cached.audioDataUri);
      return;
    }

    // Generate new preview
    setLoadingPreview(voiceValue);
    
    // Use a random preview text for variety
    const randomText = PREVIEW_TEXT_OPTIONS[Math.floor(Math.random() * PREVIEW_TEXT_OPTIONS.length)];
    currentPreviewText.current = randomText;

    try {
      const { audioDataUri } = await textToSpeech({ 
        text: randomText, 
        voice: voiceValue 
      });
      
      const newPreview = {
        audioDataUri,
        duration: 0, // Will be set when audio loads
        timestamp: Date.now()
      };

      // Update cache
      const newPreviews = { ...previews, [voiceValue]: newPreview };
      setPreviews(newPreviews);
      
      try {
        localStorage.setItem(VOICE_PREVIEW_CACHE_KEY, JSON.stringify(newPreviews));
      } catch (error) {
        console.error("Failed to save preview cache:", error);
      }

      // Play audio
      if (audioRef.current) {
        audioRef.current.src = audioDataUri;
        audioRef.current.play().catch(console.error);
        setPlayingPreview(voiceValue);
      }

      const voiceLabel = voices.find(v => v.value === voiceValue)?.label || voiceValue;
      showVoicePreviewSuccessToast(voiceLabel);
    } catch (previewError: unknown) {
      console.error('Voice preview error:', previewError);
      const voiceLabel = voices.find(v => v.value === voiceValue)?.label || voiceValue;
      showVoicePreviewErrorToast(voiceLabel);
    } finally {
      setLoadingPreview(null);
    }
  }, [loadingPreview, playingPreview, previews, stopCurrentPreview, disabled]);

  // Handle favorite toggle
  const handleToggleFavorite = useCallback((e: React.MouseEvent, voiceValue: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(voiceValue)) {
        newFavorites.delete(voiceValue);
      } else {
        newFavorites.add(voiceValue);
      }
      localStorage.setItem(VOICE_FAVORITES_KEY, JSON.stringify([...newFavorites]));
      return newFavorites;
    });
  }, []);

  // Handle card selection
  const handleCardClick = useCallback((voiceValue: string) => {
    if (!disabled && voiceValue !== selectedValue) {
      onValueChange(voiceValue);
      stopCurrentPreview();
    }
  }, [disabled, selectedValue, onValueChange, stopCurrentPreview]);

  // Filter voices based on current filters
  const filteredVoices = useMemo(() => {
    return voices.filter(voice => {
      if (filterGender && voice.gender !== filterGender) return false;
      if (filterPersonality && voice.personality !== filterPersonality) return false;
      if (showOnlyFavorites && !favorites.has(voice.value)) return false;
      return true;
    });
  }, [filterGender, filterPersonality, showOnlyFavorites, favorites]);

  // Sort voices by popularity (usage) and favorites
  const sortedVoices = useMemo(() => {
    return [...filteredVoices].sort((a, b) => {
      // Favorites first
      if (favorites.has(a.value) && !favorites.has(b.value)) return -1;
      if (!favorites.has(a.value) && favorites.has(b.value)) return 1;
      
      // Then by usage count
      const aUsage = voiceStats[a.value]?.usageCount || 0;
      const bUsage = voiceStats[b.value]?.usageCount || 0;
      return bUsage - aUsage;
    });
  }, [filteredVoices, favorites, voiceStats]);

  // Carousel options
  const carouselOpts = useMemo(() => ({
    align: "start" as const,
    loop: false,
  }), []);

  return (
    <div className="relative">
      {/* Advanced controls */}
      {showAdvancedControls && (
        <VoiceFilters
          filterGender={filterGender}
          filterPersonality={filterPersonality}
          showOnlyFavorites={showOnlyFavorites}
          onGenderChange={setFilterGender}
          onPersonalityChange={setFilterPersonality}
          onToggleFavorites={() => setShowOnlyFavorites(!showOnlyFavorites)}
        />
      )}

      {/* Voice count info */}
      {showAdvancedControls && (
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {sortedVoices.length} of {voices.length} voices
          {favorites.size > 0 && ` • ${favorites.size} favorites`}
        </div>
      )}

      {/* Voice Carousel */}
      <Carousel opts={carouselOpts} className="w-full">
        <CarouselContent>
          {sortedVoices.map((voice) => (
            <CarouselItem 
              key={voice.value} 
              className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
            >
              <div className="p-1">
                <VoiceCard
                  voice={voice}
                  isSelected={selectedValue === voice.value}
                  isPlaying={playingPreview === voice.value}
                  isLoading={loadingPreview === voice.value}
                  isFavorite={favorites.has(voice.value)}
                  usageCount={voiceStats[voice.value]?.usageCount || 0}
                  onSelect={() => handleCardClick(voice.value)}
                  onPreview={(e) => handlePreview(e, voice.value)}
                  onToggleFavorite={(e) => handleToggleFavorite(e, voice.value)}
                  disabled={disabled}
                  showAdvancedControls={showAdvancedControls}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Carousel navigation - only show if needed */}
        {sortedVoices.length > 6 && (
          <>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </>
        )}
      </Carousel>

      {/* Empty state */}
      {sortedVoices.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No voices match your current filters</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              setFilterGender('');
              setFilterPersonality('');
              setShowOnlyFavorites(false);
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        className="hidden" 
        onEnded={() => setPlayingPreview(null)}
        onPause={() => setPlayingPreview(null)}
        onLoadedMetadata={(e) => {
          // Update duration in cache
          const target = e.target as HTMLAudioElement;
          if (playingPreview && target.duration) {
            setPreviews(prev => ({
              ...prev,
              [playingPreview]: {
                ...prev[playingPreview],
                duration: target.duration
              }
            }));
          }
        }}
      />
    </div>
  );
});

OptimizedVoicePicker.displayName = 'OptimizedVoicePicker';

export { OptimizedVoicePicker };
