
"use client";

import { useState, useRef, useMemo, useCallback, useContext } from 'react';
import { FileUp, Download, Copy, Loader2, FileText, X } from 'lucide-react';
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
        className="flex flex-col h-full bg-background text-foreground"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEvents}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
        <main className="flex-grow p-4 md:p-6 relative">
            {!pdfFile ? (
                 <div
                 className={cn(
                   'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card text-center transition-colors border-border h-full min-h-[70vh]',
                   isDragging && 'border-primary bg-primary/10'
                 )}
                 onClick={() => fileInputRef.current?.click()}
               >
                 <FileUp className="mb-4 h-16 w-16 text-muted-foreground/30" />
                 <h3 className="text-xl font-semibold">{t.chooseFile}</h3>
                 <p className="mt-2 text-muted-foreground">{t.dropPdf}</p>
               </div>
            ) : (
                <Card className="shadow-sm overflow-hidden rounded-2xl h-full flex flex-col">
                    <div className="flex-shrink-0 flex items-center justify-between p-3 border-b bg-muted/30">
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
                            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10">
                                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                                <p className="text-lg font-medium text-foreground">{t.transcribing}</p>
                            </div>
                        )}
                        <Textarea
                            value={transcribedText}
                            readOnly
                            placeholder={isTranscribing ? 'Transcribing...' : t.transcribedTextPlaceholder}
                            className="h-[calc(76vh-60px)] w-full resize-none text-base leading-relaxed p-6 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            aria-label="Transcribed Text"
                            disabled={isTranscribing}
                        />
                    </div>
                </Card>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
                accept="application/pdf"
            />
        </main>
        
        {pdfFile && (
          <footer className="flex-shrink-0 flex items-center justify-center gap-2 p-4 bg-background border-t">
            <div className="w-full max-w-lg flex gap-2 items-center justify-center">
                  <Button onClick={handleCopy} variant="outline" size="icon" className="h-12 w-12 rounded-full" disabled={isTranscribing || !isReadyForContent}>
                      <Copy className="h-5 w-5" />
                      <span className="sr-only">{t.copy}</span>
                  </Button>
                  <Sheet open={isExportSheetOpen} onOpenChange={setIsExportSheetOpen}>
                    <SheetTrigger asChild>
                      <Button size="lg" className="h-12 px-6 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 flex-1" disabled={isTranscribing || !isReadyForContent}>
                          {isTranscribing ? <Loader2 className="animate-spin h-5 w-5" /> : <Download className="h-5 w-5" />}
                          <span className="ml-2 sm:inline font-bold">{isTranscribing ? t.transcribing : t.download}</span>
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
                                   {Object.entries(pdfExportFormats).map(([value, label]) => (
                                   <SelectItem key={value} value={value}>{label}</SelectItem>
                                   ))}
                               </SelectContent>
                           </Select>
                        </div>
                        <Button onClick={handleExport} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isTranscribing}>
                           {isTranscribing ? (
                               <>
                                   <Loader2 className="mr-2 animate-spin" />
                                   {t.transcribing}
                               </>
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

    