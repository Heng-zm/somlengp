
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Download, Loader2, FileUp, Languages, Sparkles, X as XIcon, Menu, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast';
import { exportTranscript } from '@/lib/export';
import type { TranscriptWord } from '@/lib/types';
import { transcribeAudio } from '@/ai/flows/speech-to-text-flow';
import { improveTranscriptionAccuracy } from '@/ai/flows/improve-transcription-accuracy-flow';
import { EditorView } from '@/components/shared/editor-view';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { NumberPicker } from '@/components/ui/number-picker';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RatingDialog } from '@/components/shared/rating-dialog';
import Link from 'next/link';
import { Sidebar } from '@/components/shared/sidebar';

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

const translations = {
  km: {
    voiceScribe: "ការសរសេរតាមសំឡេង",
    selectModel: "ជ្រើសរើសម៉ូដែល",
    transcribing: "កំពុងបកប្រែសំឡេង សូមរង់ចាំ...",
    readyToTranscribe: "ត្រៀមខ្លួនរួចរាល់ដើម្បីបកប្រែ",
    dropAudio: "ដាក់ឯកសារសំឡេងនៅទីនេះ ឬចុចដើម្បីផ្ទុកឡើង។",
    download: "ទាញយក",
    exportSettings: "ការកំណត់ការនាំចេញ",
    chooseFormat: "ជ្រើសរើសទម្រង់ និងការកំណត់របស់អ្នក បន្ទាប់មកចុចនាំចេញ។",
    exportFormat: "ទ្រង់ទ្រាយនាំចេញ",
    wordsPerSecond: "ពាក្យក្នុងមួយវិនាទី",
    wordsPerSecondHint: "សម្រាប់ SRT/VTT។ បដិសេធពេលវេលា AI ។",
    exportTranscript: "ទាញយក",
    invalidFileType: "ប្រភេទឯកសារមិនត្រឹមត្រូវ",
    selectAudioFile: "សូមជ្រើសរើសឯកសារអូឌីយ៉ូ។",
    transcriptionFailed: "ការបកប្រែបានបរាជ័យ",
    noTranscript: "ម៉ូដែលមិនបានបញ្ជូនប្រតិចារិកមកវិញទេ។ សូមព្យាយាមម្តងទៀត។",
    transcriptionError: "កំហុសក្នុងការបកប្រែ",
    rateLimitExceeded: "លើសកម្រិតកំណត់",
    rateLimitMessage: "អ្នកបានធ្វើការស្នើសុំច្រើនពេក។ សូមរង់ចាំមួយភ្លែត ឬពិនិត្យមើលផែនការ API និងព័ត៌មានលម្អិតអំពីការចេញវិក្កយប័ត្ររបស់អ្នក។",
    support: "គាំទ្រ",
    supportDescription: "ប្រសិនបើអ្នកពេញចិត្តនឹងកម្មវិធីនេះ សូមពិចារណាគាំទ្រការអភិវឌ្ឍន៍របស់វា។",
    improveAccuracy: "កែលម្អ",
    customVocabulary: "វាក្យសព្ទផ្ទាល់ខ្លួន",
    customVocabularyHint: "បន្ថែមពាក្យ ឬឃ្លាដែលពិបាកបកប្រែ ដើម្បីបង្កើនភាពត្រឹមត្រូវ។",
    addWord: "បន្ថែមពាក្យ",
    pressEnterToAdd: "ចុច Enter ដើម្បីបន្ថែម",
    retranscribe: "បកប្រែឡើងវិញ",
    ratingTitle: "តើអ្នកពេញចិត្តនឹងការបកប្រែទេ?",
    ratingDescription: "មតិកែលម្អរបស់អ្នកជួយយើងក្នុងការកែលម្អ។ សូមវាយតម្លៃបទពិសោធន៍របស់អ្នក។",
    ratingFeedbackPlaceholder: "ប្រាប់យើងបន្ថែមអំពីបទពិសោធន៍របស់អ្នក...",
    ratingSubmit: "បញ្ជូន",
    ratingLater: "វាយតម្លៃពេលក្រោយ",
    feedbackSuccess: "សូមអរគុណសម្រាប់មតិកែលម្អរបស់អ្នក!",
    feedbackError: "មិនអាចបញ្ជូនមតិកែលម្អបានទេ។ សូម​ព្យាយាម​ម្តង​ទៀត​នៅ​ពេល​ក្រោយ។",
    ratingThankYou: "សូម​អរគុណ!",
    pdfTranscript: "ប្រតិចារិក PDF",
    features: "លក្ខណៈពិសេស",
    copy: "ចម្លង",
    copied: "បានចម្លង!",
    chooseFile: "Choose File",
  },
  en: {
    voiceScribe: "Voice Transcript",
    selectModel: "Select model",
    transcribing: "Transcribing audio, please wait...",
    readyToTranscribe: "Ready to Transcribe",
    dropAudio: "Drop an audio file here or click to upload.",
    download: "DOWNLOAD",
    exportSettings: "Export Settings",
    chooseFormat: "Choose your format and settings, then click export.",
    exportFormat: "Export Format",
    wordsPerSecond: "Words per second",
    wordsPerSecondHint: "For SRT/VTT. Overrides AI timing.",
    exportTranscript: "Export Transcript",
    invalidFileType: "Invalid file type",
    selectAudioFile: "Please select an audio file.",
    transcriptionFailed: "Transcription failed",
    noTranscript: "The model did not return a transcript. Please try again.",
    transcriptionError: "Transcription Error",
    rateLimitExceeded: "Rate Limit Exceeded",
    rateLimitMessage: "You've made too many requests. Please wait a moment or check your API plan and billing details.",
    support: "Support",
    supportDescription: "If you find this application useful, please consider supporting its development.",
    improveAccuracy: "IMPROVE",
    customVocabulary: "Custom Vocabulary",
    customVocabularyHint: "Add difficult-to-transcribe words or phrases to improve accuracy.",
    addWord: "Add Word",
    pressEnterToAdd: "Press Enter to add",
    retranscribe: "Retranscribe",
    ratingTitle: "How was the transcription?",
    ratingDescription: "Your feedback helps us improve. Please rate your experience.",
    ratingFeedbackPlaceholder: "Tell us more about your experience...",
    ratingSubmit: "Submit",
    ratingLater: "Rate Later",
    feedbackSuccess: "Thank you for your feedback!",
    feedbackError: "Could not submit feedback. Please try again later.",
    ratingThankYou: "Thank you!",
    pdfTranscript: "PDF Transcript",
    features: "Features",
    copy: "COPY",
    copied: "Copied!",
    chooseFile: "Choose File",
  }
};


export function SoundsPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [structuredTranscript, setStructuredTranscript] = useState<TranscriptWord[]>([]);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [wordsPerSecond, setWordsPerSecond] = useState<number | undefined>(10);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [exportFormat, setExportFormat] = useState('srt');
  const [isDragging, setIsDragging] = useState(false);
  const [isExportSheetOpen, setIsExportSheetOpen] = useState(false);
  // Language state now lives in Sidebar, this is just for translations
  const [language, setLanguage] = useState<'km' | 'en'>('en');
  const [customVocabulary, setCustomVocabulary] = useState<string[]>([]);
  const [vocabInput, setVocabInput] = useState('');
  const [isVocabSheetOpen, setIsVocabSheetOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const hasRated = useRef(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const t = useMemo(() => translations[language], [language]);

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
      setIsVocabSheetOpen(false);
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

  const modelDisplayNames = useMemo(() => ({
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
    'gemini-1.5-flash-latest': 'Gemini 1.5 Flash',
  }), []);

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
  }), [t.ratingTitle, t.ratingDescription, t.ratingFeedbackPlaceholder, t.ratingSubmit, t.ratingLater, t.ratingThankYou]);
  
  const handleCopy = () => {
    if (!editedTranscript) return;
    navigator.clipboard.writeText(editedTranscript).then(() => {
        toast({ title: t.copied });
    });
  };

  return (
    <>
      <div className="flex flex-col h-full bg-background text-foreground">
          <header className="flex-shrink-0 flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4">
                  <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                      <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="md:hidden">
                          <Menu className="h-6 w-6" />
                          <span className="sr-only">Toggle navigation menu</span>
                      </Button>
                      </SheetTrigger>
                      <SheetContent 
                      side="left" 
                      className="p-0 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col"
                      >
                        <SheetHeader>
                          <SheetTitle className="sr-only">Navigation</SheetTitle>
                        </SheetHeader>
                        <Sidebar />
                      </SheetContent>
                  </Sheet>
                  <h1 className="text-xl font-bold">{t.voiceScribe}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t.selectModel} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(modelDisplayNames).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          </header>

          <main 
              className="flex-grow p-4 md:p-6 grid grid-cols-1 gap-6 relative bg-muted/40 overflow-y-auto"
              onDragEnter={handleDragEnter}
              onDragOver={handleDragEvents}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
          >
              {isTranscribing ? (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <p className="text-muted-foreground mt-4 text-lg">{t.transcribing}</p>
                  </div>
              ) : null}

              {!audioFile ? (
                  <div 
                      className={cn(
                          "flex flex-col items-center justify-center text-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-background h-full transition-colors cursor-pointer",
                          isDragging && "border-primary bg-primary/10"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                  >
                      <FileUp className="w-20 h-20 text-muted-foreground/30 mb-4"/>
                      <h3 className="text-2xl font-semibold">{t.readyToTranscribe}</h3>
                      <p className="text-muted-foreground mt-2 mb-4">{t.dropAudio}</p>
                  </div>
              ) : (
                  <Card className="flex flex-col h-full shadow-sm overflow-hidden">
                      <EditorView
                          transcript={editedTranscript}
                          onTranscriptChange={setEditedTranscript}
                          disabled={!isReadyForContent}
                      />
                  </Card>
              )}
               <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  className="hidden"
                  accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/*"
              />
          </main>
          
          <footer className="flex-shrink-0 flex items-center justify-center gap-2 p-4 border-t bg-background shadow-sm">
              <div className="w-full max-w-lg flex gap-2 items-center">
                  <Button onClick={handleCopy} disabled={!isReadyForContent} variant="outline" size="icon" className="h-14 w-14 rounded-full">
                      <Copy className="h-6 w-6" />
                      <span className="sr-only">{t.copy}</span>
                  </Button>
                  <Sheet open={isVocabSheetOpen} onOpenChange={setIsVocabSheetOpen}>
                      <SheetTrigger asChild>
                          <Button variant="outline" size="icon" disabled={!isReadyForContent} className="h-14 w-14 rounded-full">
                              <Sparkles className="h-6 w-6" />
                              <span className="sr-only">{t.improveAccuracy}</span>
                          </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="rounded-t-lg">
                          <SheetHeader className="text-left">
                              <SheetTitle>{t.improveAccuracy}</SheetTitle>
                              <SheetDescription>{t.customVocabularyHint}</SheetDescription>
                          </SheetHeader>
                          <div className="grid gap-4 py-4">
                              <div className="flex gap-2">
                                  <Input 
                                      value={vocabInput}
                                      onChange={(e) => setVocabInput(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleAddVocab()}
                                      placeholder={t.pressEnterToAdd}
                                  />
                                  <Button onClick={handleAddVocab}>{t.addWord}</Button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                  {customVocabulary.map(word => (
                                      <Badge key={word} variant="secondary" className="text-base px-3 py-1">
                                          {word}
                                          <button onClick={() => handleRemoveVocab(word)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                                              <XIcon className="h-3 w-3" />
                                          </button>
                                      </Badge>
                                  ))}
                              </div>
                              <Button onClick={handleRetranscribe} disabled={isTranscribing || customVocabulary.length === 0} size="lg">
                                  {isTranscribing ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                                  {t.retranscribe}
                              </Button>
                          </div>
                      </SheetContent>
                  </Sheet>
                  <Sheet open={isExportSheetOpen} onOpenChange={setIsExportSheetOpen}>
                      <SheetTrigger asChild>
                          <Button variant="default" size="lg" disabled={!isReadyForContent} className="flex-1 rounded-full h-14 px-8">
                              <Download className="h-5 w-5" />
                              <span className="ml-2 sm:inline font-bold text-lg">{t.download}</span>
                          </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="rounded-t-lg">
                        <SheetHeader className="text-left">
                            <SheetTitle>
                                {t.exportSettings}
                                <span className="sr-only">Export Settings</span>
                            </SheetTitle>
                            <SheetDescription>
                            {t.chooseFormat}
                            </SheetDescription>
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
                              <Button 
                                  onClick={handleExport}
                                  disabled={!isReadyForContent}
                                  size="lg"
                              >
                                  <Download className="mr-2" />
                                  {t.exportTranscript}
                              </Button>
                          </div>
                      </SheetContent>
                  </Sheet>
              </div>
          </footer>
          <RatingDialog
              open={isRatingOpen}
              onOpenChange={setIsRatingOpen}
              onSubmit={handleRatingSubmit}
              translations={ratingTranslations}
          />
      </div>
    </>
  );
}
