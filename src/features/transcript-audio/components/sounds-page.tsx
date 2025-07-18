
"use client";

import { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { Download, Loader2, FileUp, Sparkles, X as XIcon, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { exportTranscript } from '@/lib/export';
import type { TranscriptWord } from '@/lib/types';
import { transcribeAudio } from '@/ai/flows/speech-to-text-flow';
import { improveTranscriptionAccuracy } from '@/ai/flows/improve-transcription-accuracy-flow';
import { EditorView } from '@/components/shared/editor-view';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { NumberPicker } from '@/components/ui/number-picker';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RatingDialog } from '@/components/shared/rating-dialog';
import { allTranslations } from '@/lib/translations';
import { ModelContext } from '@/layouts/feature-page-layout';
import { LanguageContext } from '@/contexts/language-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to Base64.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export function SoundsPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [structuredTranscript, setStructuredTranscript] = useState<TranscriptWord[]>([]);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [wordsPerSecond, setWordsPerSecond] = useState<number | undefined>(10);
  const [exportFormat, setExportFormat] = useState('srt');
  const [isDragging, setIsDragging] = useState(false);
  const [isExportSheetOpen, setIsExportSheetOpen] = useState(false);
  const [customVocabulary, setCustomVocabulary] = useState<string[]>([]);
  const [vocabInput, setVocabInput] = useState('');
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const hasRated = useRef(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('SoundsPage must be used within a LanguageProvider');
  }
  const { language } = langContext;
  const t = useMemo(() => allTranslations[language], [language]);

  const modelContext = useContext(ModelContext);
  if (!modelContext) {
    throw new Error('SoundsPage must be used within a ModelProvider');
  }
  const { selectedModel } = modelContext;

  useEffect(() => {
    hasRated.current = localStorage.getItem('hasRated') === 'true';
  }, []);
  
  const handleRetranscribe = useCallback(async () => {
    if (!audioFile) return;
  
    setIsTranscribing(true);
    try {
      const audioDataUri = await blobToBase64(audioFile);
      const result = await improveTranscriptionAccuracy({
        audioDataUri,
        model: selectedModel,
        customVocabulary,
      });
  
      if (result && result.transcript) {
        setStructuredTranscript(result.transcript);
        setEditedTranscript(result.text);
        toast({ title: "Transcription Improved!", description: "The text has been updated with your custom vocabulary." });
      } else {
        toast({
          title: t.transcriptionFailed,
          description: t.noTranscript,
          variant: "destructive",
        });
      }
    } catch (e: any) {
      console.error(e);
      let title = t.transcriptionError;
      let description = e.message || "An error occurred while processing your audio.";
      const errorMessage = (e.message || '').toLowerCase();
      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        title = t.rateLimitExceeded;
        description = t.rateLimitMessage;
      }
      toast({ title, description, variant: "destructive" });
    } finally {
      setIsTranscribing(false);
    }
  }, [audioFile, customVocabulary, selectedModel, t, toast]);
  
  const processAudio = useCallback(async (file: File) => {
    setIsTranscribing(true);
    setStructuredTranscript([]);
    setEditedTranscript('');

    try {
        const audioDataUri = await blobToBase64(file);
        const result = await transcribeAudio({ audioDataUri, model: selectedModel });
        
        if (result && result.transcript) {
            setStructuredTranscript(result.transcript);
            setEditedTranscript(result.text);
        } else {
            toast({
                title: t.transcriptionFailed,
                description: t.noTranscript,
                variant: "destructive",
            });
        }
    } catch (e: any) {
        console.error(e);
        let title = t.transcriptionError;
        let description = e.message || "An error occurred while processing your audio.";
        const errorMessage = (e.message || '').toLowerCase();
        if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
            title = t.rateLimitExceeded;
            description = t.rateLimitMessage;
        }
        toast({
            title: title,
            description: description,
            variant: "destructive",
        });
    } finally {
        setIsTranscribing(false);
    }
  }, [selectedModel, t, toast]);

  useEffect(() => {
    if (audioFile) {
      processAudio(audioFile);
    }
  }, [audioFile, processAudio]);

  const handleFileSelect = (file: File | null | undefined) => {
    if (file && file.type.startsWith('audio/')) {
        setAudioFile(file);
    } else if (file) {
        toast({
            title: t.invalidFileType,
            description: t.selectAudioFile,
            variant: "destructive",
        });
    }
  }

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };
  
  const handleExport = useCallback(() => {
    exportTranscript(editedTranscript, exportFormat as 'srt' | 'vtt' | 'txt' | 'json' | 'csv', structuredTranscript, toast, wordsPerSecond);
    setIsExportSheetOpen(false);
    if (!hasRated.current) {
        setIsRatingOpen(true);
    }
  }, [editedTranscript, exportFormat, structuredTranscript, toast, wordsPerSecond]);
  
  const formatDisplayNames = useMemo(() => ({
    srt: 'SRT (Subtitles)',
    vtt: 'VTT (Subtitles)',
    txt: 'TXT (Plain Text)',
    json: 'JSON (Structured Data)',
    csv: 'CSV (Spreadsheet)',
  }), []);

  const isReadyForContent = !isTranscribing && structuredTranscript.length > 0;

  const handleAddVocab = () => {
    if (vocabInput.trim() && !customVocabulary.includes(vocabInput.trim())) {
      setCustomVocabulary([...customVocabulary, vocabInput.trim()]);
      setVocabInput('');
    }
  };

  const handleRemoveVocab = (wordToRemove: string) => {
    setCustomVocabulary(customVocabulary.filter(word => word !== wordToRemove));
  };

  const handleRatingSubmit = useCallback(async (rating: number, feedback: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: t.feedbackError }));
        console.error('API Error:', errorData);
        throw new Error(errorData.message);
      }
      
      localStorage.setItem('hasRated', 'true');
      hasRated.current = true;
      return true;
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast({ title: t.feedbackError, variant: 'destructive' });
      return false;
    }
  }, [t.feedbackError, toast]);

  const ratingTranslations = useMemo(() => ({
    title: t.ratingTitle,
    description: t.ratingDescription,
    feedbackPlaceholder: t.ratingFeedbackPlaceholder,
    submit: t.ratingSubmit,
    rateLater: t.ratingLater,
    thankYou: t.ratingThankYou,
  }), [t]);
  
  const handleCopy = () => {
    if (!editedTranscript) return;
    navigator.clipboard.writeText(editedTranscript).then(() => {
        toast({ title: t.copied });
    });
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
        <main 
            className="flex-grow p-4 md:p-6 grid grid-cols-1 gap-6 relative"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragEvents}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isTranscribing && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground mt-4 text-lg">{t.transcribing}</p>
                </div>
            )}

            {!audioFile ? (
                <div 
                    className={cn(
                        "flex flex-col items-center justify-center text-center rounded-2xl border-2 border-border bg-card h-full transition-colors cursor-pointer",
                        isDragging && "border-primary bg-primary/10"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <FileUp className="w-16 h-16 text-muted-foreground/30 mb-4"/>
                    <h3 className="text-xl font-semibold">{t.chooseFile}</h3>
                    <p className="text-muted-foreground mt-2">{t.dropAudio}</p>
                </div>
            ) : (
                isReadyForContent && (
                  <Card className="flex flex-col h-full shadow-sm overflow-hidden rounded-2xl">
                      <EditorView
                          transcript={editedTranscript}
                          onTranscriptChange={setEditedTranscript}
                          disabled={!isReadyForContent}
                      />
                  </Card>
                )
            )}
             <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
                accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/*"
            />
        </main>
        
        {isReadyForContent && (
          <footer className="flex-shrink-0 flex items-center justify-center gap-2 p-4 border-t bg-background">
              <div className="w-full max-w-lg flex gap-2 items-center">
                  <Button onClick={handleCopy} variant="outline" size="icon" className="h-12 w-12 rounded-full">
                      <Copy className="h-5 w-5" />
                      <span className="sr-only">{t.copy}</span>
                  </Button>
                  <Sheet open={isExportSheetOpen} onOpenChange={setIsExportSheetOpen}>
                      <SheetTrigger asChild>
                          <Button size="lg" className="flex-1 rounded-full h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90">
                              <Download className="h-5 w-5" />
                              <span className="ml-2 sm:inline font-bold">{t.download}</span>
                          </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="rounded-t-lg">
                        <SheetHeader className="text-left">
                            <SheetTitle>{t.exportSettings}</SheetTitle>
                            <SheetDescription>{t.chooseFormat}</SheetDescription>
                        </SheetHeader>
                          <div className="grid gap-6 py-6">
                              <div className="grid gap-3">
                                  <Label>{t.exportFormat}</Label>
                                  <Select value={exportFormat} onValueChange={setExportFormat}>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Select format" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {Object.entries(formatDisplayNames).map(([value, label]) => (
                                          <SelectItem key={value} value={value}>{label}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="grid gap-3">
                                  <Label htmlFor="words-per-second" className="text-center">{t.wordsPerSecond}</Label>
                                  <NumberPicker 
                                      value={wordsPerSecond}
                                      onChange={setWordsPerSecond}
                                  />
                                  <p className="text-xs text-muted-foreground text-center">{t.wordsPerSecondHint}</p>
                              </div>

                              <div className="p-4 border rounded-lg">
                                  <h4 className="font-semibold mb-2">{t.improveAccuracy}</h4>
                                  <p className="text-sm text-muted-foreground mb-3">{t.customVocabularyHint}</p>
                                  <div className="flex gap-2">
                                    <Input 
                                        value={vocabInput}
                                        onChange={(e) => setVocabInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddVocab()}
                                        placeholder={t.pressEnterToAdd}
                                    />
                                    <Button onClick={handleAddVocab} variant="secondary">{t.addWord}</Button>
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-3">
                                      {customVocabulary.map(word => (
                                          <Badge key={word} variant="secondary" className="text-base px-3 py-1">
                                              {word}
                                              <button onClick={() => handleRemoveVocab(word)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                                                  <XIcon className="h-3 w-3" />
                                              </button>
                                          </Badge>
                                      ))}
                                  </div>
                                  {customVocabulary.length > 0 && (
                                    <Button onClick={handleRetranscribe} disabled={isTranscribing} size="sm" className="mt-3 w-full">
                                        {isTranscribing ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                                        {t.retranscribe}
                                    </Button>
                                  )}
                              </div>

                              <Button onClick={handleExport} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                                  <Download className="mr-2" />
                                  {t.exportTranscript}
                              </Button>
                          </div>
                      </SheetContent>
                  </Sheet>
              </div>
          </footer>
        )}
        <RatingDialog
            open={isRatingOpen}
            onOpenChange={setIsRatingOpen}
            onSubmit={handleRatingSubmit}
            translations={ratingTranslations}
        />
    </div>
  );
}
