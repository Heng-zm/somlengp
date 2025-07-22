
"use client";

import { useState, useRef, useMemo, useCallback, useContext } from 'react';
import { FileUp, Download, Copy, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { transcribePdf } from '@/ai/flows/pdf-transcript-flow';
import { allTranslations } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/config';
import { ThreeDotsLoader } from '@/components/shared/three-dots-loader';

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

export function PdfTranscriptPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isExportSheetOpen, setIsExportSheetOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('docx');

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('PdfTranscriptPage must be used within a LanguageProvider');
  }
  const { language } = langContext;
  const t = useMemo(() => allTranslations[language], [language]);

  const clearFile = () => {
    setPdfFile(null);
    setTranscribedText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
  
  const handleFileSelect = useCallback(async (file: File | null | undefined) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: t.invalidFileType,
        description: t.selectPdfFile,
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
            title: t.fileTooLargeTitle,
            description: t.fileTooLargeDescription(MAX_FILE_SIZE_MB),
            variant: "destructive",
        });
        return;
    }
    
    setPdfFile(file);
    setIsTranscribing(true);
    setTranscribedText('');

    try {
      const pdfDataUri = await blobToBase64(file);
      const result = await transcribePdf({ pdfDataUri });

      if (result && result.text) {
        setTranscribedText(result.text);
      } else {
        toast({
          title: t.transcriptionFailed,
          description: t.noText,
          variant: "destructive",
        });
        clearFile();
      }
    } catch (e: any) {
        console.error(e);
        const errorMessage = (e.message || '').toLowerCase();
        let title = t.transcriptionError;
        let description = e.message || "An error occurred while processing your PDF.";

        if (errorMessage.includes('503') || errorMessage.includes('model is overloaded')) {
            title = t.modelOverloadedTitle;
            description = t.modelOverloadedDescription;
        } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
            title = t.fileTooLargeTitle;
            description = t.fileTooLargeDescription(MAX_FILE_SIZE_MB);
        } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
            title = t.rateLimitExceeded;
            description = t.rateLimitMessage;
        }
        toast({ title, description, variant: "destructive" });
        clearFile();
    } finally {
      setIsTranscribing(false);
    }
  }, [t, toast]);


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

  const handleExport = async () => {
    if (!transcribedText.trim()) {
        toast({
            title: t.exportFailed,
            description: t.noTextToExport,
            variant: "destructive",
        });
        return;
    }
    // Lazy load for performance
    const { exportTranscript: exportFn } = await import('@/lib/client-export');
    exportFn(transcribedText, exportFormat as 'docx' | 'txt', [], toast);
    setIsExportSheetOpen(false);
  };
  
  const handleCopy = () => {
    if (!transcribedText) return;
    navigator.clipboard.writeText(transcribedText).then(() => {
        toast({ title: t.copied });
    });
  };

  const isReadyForContent = !isTranscribing && transcribedText;

  const pdfExportFormats = useMemo(() => ({
    docx: 'DOCX (Word Document)',
    txt: 'TXT (Plain Text)',
  }), []);
  
  return (
    <div 
        className="flex flex-col h-full bg-transparent text-foreground"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEvents}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
        <main className="flex-grow p-4 md:p-6 flex flex-col items-center">
            <div className="w-full max-w-4xl flex-grow flex flex-col">
                {!pdfFile ? (
                    <div
                        className={cn(
                        'flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-white/20 text-center transition-colors h-full p-6',
                        'glass-card',
                        isDragging && 'border-primary bg-primary/10'
                        )}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <FileUp className="mb-4 h-16 w-16 text-white/30" />
                        <h3 className="text-xl font-semibold">{t.chooseFile}</h3>
                        <p className="mt-2 text-white/70">{t.dropPdf}</p>
                    </div>
                ) : (
                    <div className="h-full flex flex-col glass-card overflow-hidden">
                        <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-white/10 bg-black/10">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-5 h-5 text-primary"/>
                                <span className="font-medium truncate">{pdfFile.name}</span>
                                <span className="text-sm text-muted-foreground">{`${(pdfFile.size / 1024 / 1024).toFixed(2)} MB`}</span>
                            </div>
                            <Button onClick={clearFile} variant="ghost" size="icon" className="rounded-full">
                                <X className="w-4 h-4" />
                                <span className="sr-only">Clear file</span>
                            </Button>
                        </div>
                        <div className="flex-grow relative">
                            {isTranscribing && (
                                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                                    <ThreeDotsLoader />
                                    <p className="text-lg font-medium text-foreground mt-4">{t.transcribing}</p>
                                </div>
                            )}
                            <Textarea
                                value={transcribedText}
                                readOnly
                                placeholder={isTranscribing ? 'Transcribing...' : t.transcribedTextPlaceholder}
                                className="h-full w-full resize-none text-base leading-relaxed p-6 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                                aria-label="Transcribed Text"
                                disabled={isTranscribing}
                            />
                        </div>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
                accept="application/pdf"
            />
        </main>
        
        {pdfFile && (
          <footer className="flex-shrink-0 flex items-center justify-center gap-2 p-4 bg-transparent border-t border-white/10">
            <div className="w-full max-w-lg flex gap-2 items-center justify-center">
                  <Button onClick={handleCopy} variant="outline" size="icon" className="h-12 w-12 rounded-full glass-button" disabled={isTranscribing || !isReadyForContent}>
                      <Copy className="h-5 w-5" />
                      <span className="sr-only">{t.copy}</span>
                  </Button>
                  <Sheet open={isExportSheetOpen} onOpenChange={setIsExportSheetOpen}>
                    <SheetTrigger asChild>
                      <Button size="lg" className="h-12 px-6 rounded-full glass-button flex-1" disabled={isTranscribing || !isReadyForContent}>
                          {isTranscribing ? <ThreeDotsLoader /> : <Download className="h-5 w-5" />}
                          <span className="ml-2 sm:inline font-bold">{isTranscribing ? t.transcribing : t.download}</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-lg bg-background/80 backdrop-blur-xl border-t border-white/10">
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
                                   {Object.entries(pdfExportFormats).map(([value, label]) => (
                                   <SelectItem key={value} value={value}>{label}</SelectItem>
                                   ))}
                               </SelectContent>
                           </Select>
                        </div>
                        <Button onClick={handleExport} size="lg" className="glass-button" disabled={isTranscribing}>
                           {isTranscribing ? (
                               <ThreeDotsLoader />
                           ) : (
                               <>
                                   <Download className="mr-2" />
                                   {t.exportTranscript}
                               </>
                           )}
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
            </div>
          </footer>
        )}
    </div>
  );
}
