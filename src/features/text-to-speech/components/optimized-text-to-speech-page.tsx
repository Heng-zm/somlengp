"use client";

import React, { 
  useState, 
  useContext, 
  useCallback, 
  useMemo, 
  useRef, 
  useEffect,
  memo 
} from 'react';
import { 
  AudioLines, 
  Download, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Save,
  Trash2,
  Copy,
  FileText,
  Clock,
  Zap,
  Settings,
  BookOpen,
  Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  showTTSInputRequiredToast,
  showTTSErrorToast,
  showTTSSuccessToast,
  showTTSTextTooLongToast,
  showDataSavedToast,
  showDataLoadedToast,
  showMessageCopiedToast
} from '@/lib/toast-utils';
import { Textarea } from '@/components/ui/textarea';
import { LanguageContext } from '@/contexts/language-context';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { ThreeDotsLoader } from '@/components/shared/three-dots-loader';
import { voices, VoicePicker } from './voice-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Constants for configuration
const MAX_TEXT_LENGTH = 5000;
const STORAGE_KEY = 'tts-app-data';
const HISTORY_STORAGE_KEY = 'tts-history';
const MAX_HISTORY_ITEMS = 20;

// Types for better type safety
interface TTSHistory {
  id: string;
  text: string;
  voice: string;
  timestamp: number;
  audioDataUri?: string;
  duration?: number;
}

interface TTSSettings {
  autoPlay: boolean;
  saveToHistory: boolean;
  volume: number;
  playbackRate: number;
  defaultVoice: string;
}

interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

// Default settings
const DEFAULT_SETTINGS: TTSSettings = {
  autoPlay: false,
  saveToHistory: true,
  volume: 1,
  playbackRate: 1,
  defaultVoice: voices[0].value
};

// Memoized components for performance
const AudioControls = memo<{
  audioRef: React.RefObject<HTMLAudioElement>;
  playerState: AudioPlayerState;
  onStateChange: (updates: Partial<AudioPlayerState>) => void;
  disabled?: boolean;
}>(({ audioRef, playerState, onStateChange, disabled }) => {
  const { isPlaying, currentTime, duration, volume, playbackRate } = playerState;

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    onStateChange({ isPlaying: !isPlaying });
  }, [audioRef, isPlaying, onStateChange]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    onStateChange({ volume: newVolume });
  }, [audioRef, onStateChange]);

  const handlePlaybackRateChange = useCallback((value: number[]) => {
    const newRate = value[0];
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
    onStateChange({ playbackRate: newRate });
  }, [audioRef, onStateChange]);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={togglePlay}
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 w-8 p-0"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <div className="text-sm text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <Badge variant="secondary" className="text-xs">
          {playbackRate}x speed
        </Badge>
      </div>

      <Progress value={progressPercentage} className="h-2" />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Volume</Label>
          <div className="flex items-center gap-2">
            <VolumeX className="h-4 w-4" />
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.1}
              className="flex-1"
              disabled={disabled}
            />
            <Volume2 className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Speed</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs">0.5x</span>
            <Slider
              value={[playbackRate]}
              onValueChange={handlePlaybackRateChange}
              min={0.5}
              max={2}
              step={0.1}
              className="flex-1"
              disabled={disabled}
            />
            <span className="text-xs">2x</span>
          </div>
        </div>
      </div>
    </div>
  );
});

AudioControls.displayName = 'AudioControls';

// Optimized Text Statistics component
const TextStatistics = memo<{ text: string }>(({ text }) => {
  const stats = useMemo(() => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const estimatedTime = Math.ceil(words / 150); // Average reading speed: 150 words/minute
    
    return { words, characters, charactersNoSpaces, estimatedTime };
  }, [text]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center gap-2">
        <Type className="h-4 w-4 text-muted-foreground" />
        <div className="text-sm">
          <span className="font-medium">{stats.words}</span>
          <span className="text-muted-foreground ml-1">words</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div className="text-sm">
          <span className="font-medium">{stats.characters}</span>
          <span className="text-muted-foreground ml-1">characters</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <div className="text-sm">
          <span className="font-medium">~{stats.estimatedTime}</span>
          <span className="text-muted-foreground ml-1">min read</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Progress 
          value={(stats.characters / MAX_TEXT_LENGTH) * 100} 
          className="h-2 flex-1" 
        />
        <div className="text-xs text-muted-foreground">
          {Math.round((stats.characters / MAX_TEXT_LENGTH) * 100)}%
        </div>
      </div>
    </div>
  );
});

TextStatistics.displayName = 'TextStatistics';

// History item component
const HistoryItem = memo<{
  item: TTSHistory;
  onSelect: (text: string, voice: string) => void;
  onDelete: (id: string) => void;
}>(({ item, onSelect, onDelete }) => {
  const voiceLabel = voices.find(v => v.value === item.voice)?.label || item.voice;
  const date = new Date(item.timestamp).toLocaleDateString();
  
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2">
          <div 
            className="flex-1 min-w-0"
            role="button"
            tabIndex={0}
            onClick={() => onSelect(item.text, item.voice)}
          >
            <p className="text-sm font-medium truncate mb-1">
              {item.text.substring(0, 60)}...
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {voiceLabel}
              </Badge>
              <span>{date}</span>
            </div>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

HistoryItem.displayName = 'HistoryItem';

// Main optimized component
export const OptimizedTextToSpeechPage = memo(() => {
  // Core state
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>(voices[0].value);
  const [settings, setSettings] = useState<TTSSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<TTSHistory[]>([]);
  
  // Audio player state
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1
  });

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Context
  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('OptimizedTextToSpeechPage must be used within a LanguageProvider');
  }

  // Load saved data on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
          setSelectedVoice(parsed.settings.defaultVoice || voices[0].value);
        }
        if (parsed.lastText) {
          setText(parsed.lastText);
        }
      }

      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  }, []);

  // Save data when settings or text change
  const saveData = useCallback(() => {
    try {
      const dataToSave = {
        settings,
        lastText: text
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }, [settings, text]);

  useEffect(() => {
    const timeoutId = setTimeout(saveData, 1000); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [saveData]);

  // Audio event handlers
  const handleAudioEvents = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setPlayerState(prev => ({
        ...prev,
        currentTime: audio.currentTime,
        duration: audio.duration || 0
      }));
    };

    const handlePlay = () => setPlayerState(prev => ({ ...prev, isPlaying: true }));
    const handlePause = () => setPlayerState(prev => ({ ...prev, isPlaying: false }));
    const handleEnded = () => setPlayerState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentTime: 0 
    }));

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', updateTime);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', updateTime);
    };
  }, []);

  useEffect(() => {
    const cleanup = handleAudioEvents();
    return cleanup;
  }, [handleAudioEvents, audioDataUri]);

  // Text validation
  const textValidation = useMemo(() => {
    const trimmedText = text.trim();
    const isValid = trimmedText.length > 0 && trimmedText.length <= MAX_TEXT_LENGTH;
    const isTooLong = trimmedText.length > MAX_TEXT_LENGTH;
    
    return { isValid, isTooLong, length: trimmedText.length };
  }, [text]);

  // Handle text generation
  const handleGenerate = useCallback(async () => {
    if (!textValidation.isValid) {
      if (textValidation.isTooLong) {
        showTTSTextTooLongToast(MAX_TEXT_LENGTH);
      } else {
        showTTSInputRequiredToast();
      }
      return;
    }

    setIsGenerating(true);
    setAudioDataUri(null);
    setPlayerState(prev => ({ ...prev, isPlaying: false, currentTime: 0, duration: 0 }));

    try {
      const result = await textToSpeech({ text, voice: selectedVoice });
      setAudioDataUri(result.audioDataUri);
      
      // Save to history if enabled
      if (settings.saveToHistory) {
        const historyItem: TTSHistory = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text,
          voice: selectedVoice,
          timestamp: Date.now(),
          audioDataUri: result.audioDataUri
        };
        
        setHistory(prev => {
          const newHistory = [historyItem, ...prev.slice(0, MAX_HISTORY_ITEMS - 1)];
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
          return newHistory;
        });
      }

      const selectedVoiceObj = voices.find(v => v.value === selectedVoice);
      showTTSSuccessToast(selectedVoiceObj?.label);

      // Auto-play if enabled
      if (settings.autoPlay) {
        setTimeout(() => {
          audioRef.current?.play();
        }, 100);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      const selectedVoiceObj = voices.find(v => v.value === selectedVoice);
      showTTSErrorToast(errorMessage, selectedVoiceObj?.label);
    } finally {
      setIsGenerating(false);
    }
  }, [text, selectedVoice, textValidation, settings]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (!audioDataUri) return;
    
    const a = document.createElement('a');
    a.href = audioDataUri;
    a.download = `tts-${new Date().getTime()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [audioDataUri]);

  // Copy text to clipboard
  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      showMessageCopiedToast();
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, [text]);

  // Handle history selection
  const handleHistorySelect = useCallback((historyText: string, historyVoice: string) => {
    setText(historyText);
    setSelectedVoice(historyVoice);
    textareaRef.current?.focus();
  }, []);

  // Handle history deletion
  const handleHistoryDelete = useCallback((id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // Update player state
  const updatePlayerState = useCallback((updates: Partial<AudioPlayerState>) => {
    setPlayerState(prev => ({ ...prev, ...updates }));
  }, []);

  // Update settings
  const updateSettings = useCallback((updates: Partial<TTSSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <main className="flex-grow p-4 md:p-6 flex flex-col gap-6">
        
        {/* Voice Selection */}
        <div className="w-full">
          <VoicePicker 
            selectedValue={selectedVoice} 
            onValueChange={setSelectedVoice}
            disabled={isGenerating}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Text Input and Audio */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Text Statistics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Text Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <TextStatistics text={text} />
              </CardContent>
            </Card>

            {/* Text Input */}
            <Card className="flex-grow">
              <CardContent className="p-0">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter your text here to convert to speech..."
                    className={cn(
                      "min-h-[300px] resize-none border-0 focus-visible:ring-0",
                      "text-base leading-relaxed p-6 bg-transparent",
                      textValidation.isTooLong && "border-red-500"
                    )}
                    disabled={isGenerating}
                    aria-label="Text to speech input"
                  />
                  
                  {/* Character count indicator */}
                  <div className="absolute bottom-4 right-4">
                    <Badge 
                      variant={textValidation.isTooLong ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {textValidation.length} / {MAX_TEXT_LENGTH}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audio Player */}
            {audioDataUri && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Audio Player</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCopyText}
                        variant="outline"
                        size="sm"
                        disabled={!text}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Text
                      </Button>
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <AudioControls
                    audioRef={audioRef}
                    playerState={playerState}
                    onStateChange={updatePlayerState}
                    disabled={isGenerating}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history">
                  <BookOpen className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Recent Generations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] w-full">
                      {history.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No history yet</p>
                          <p className="text-xs">Generated audio will appear here</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {history.map((item) => (
                            <HistoryItem
                              key={item.id}
                              item={item}
                              onSelect={handleHistorySelect}
                              onDelete={handleHistoryDelete}
                            />
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Auto-play generated audio</Label>
                      <Button
                        variant={settings.autoPlay ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSettings({ autoPlay: !settings.autoPlay })}
                      >
                        {settings.autoPlay ? "On" : "Off"}
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Save to history</Label>
                      <Button
                        variant={settings.saveToHistory ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSettings({ saveToHistory: !settings.saveToHistory })}
                      >
                        {settings.saveToHistory ? "On" : "Off"}
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-sm">Default Voice</Label>
                      <select
                        value={settings.defaultVoice}
                        onChange={(e) => {
                          updateSettings({ defaultVoice: e.target.value });
                          setSelectedVoice(e.target.value);
                        }}
                        className="w-full p-2 rounded border bg-background"
                      >
                        {voices.map((voice) => (
                          <option key={voice.value} value={voice.value}>
                            {voice.label} ({voice.gender})
                          </option>
                        ))}
                      </select>
                    </div>

                    <Separator />

                    <Button
                      onClick={() => {
                        localStorage.removeItem(HISTORY_STORAGE_KEY);
                        setHistory([]);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear History
                    </Button>

                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      {/* Footer with Generate Button */}
      <footer className="flex-shrink-0 p-4 border-t bg-background/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <Button 
            onClick={handleGenerate}
            size="lg"
            className={cn(
              "w-full h-12 font-semibold transition-all duration-200",
              textValidation.isValid 
                ? "bg-primary hover:bg-primary/90" 
                : "bg-muted text-muted-foreground"
            )}
            disabled={isGenerating || !textValidation.isValid}
          >
            {isGenerating ? (
              <>
                <ThreeDotsLoader />
                <span className="ml-2">Generating Audio...</span>
              </>
            ) : (
              <>
                <AudioLines className="h-5 w-5 mr-2" />
                Generate Speech with {voices.find(v => v.value === selectedVoice)?.label}
              </>
            )}
          </Button>
        </div>
      </footer>

      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        src={audioDataUri || undefined}
        className="hidden" 
        preload="metadata"
      />
    </div>
  );
});

OptimizedTextToSpeechPage.displayName = 'OptimizedTextToSpeechPage';