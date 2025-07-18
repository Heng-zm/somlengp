
"use client";

import { useState, useRef, useMemo, useCallback, useContext } from 'react';
import { FileUp, Loader2, Download, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { transcribePdf } from '@/ai/flows/pdf-transcript-flow';
import { exportTranscript } from '@/lib/export';
import { allTranslations } from '@/lib/translations';
import { ModelContext } from '@/layouts/feature-page-layout';
import { LanguageContext } from '@/contexts/language-context';

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

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('PdfTranscriptPage must be used within a LanguageProvider');
  }
  const { language } = langContext;
  const t = useMemo(() => allTranslations[language], [language]);

  const modelContext = useContext(ModelContext);
  if (!modelContext) {
    throw new Error('PdfTranscriptPage must be used within a ModelProvider');
  }
  const { selectedModel } = modelContext;
  
  const resetState = () => {
    setPdfFile(null);
    setTranscribedText('');
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
    
    resetState();
    setPdfFile(file);
    setIsTranscribing(true);

    try {
      const pdfDataUri = await blobToBase64(file);
      const result = await transcribePdf({ pdfDataUri, model: selectedModel });

      if (result && result.text) {
        setTranscribedText(result.text);
      } else {
        toast({
          title: t.transcriptionFailed,
          description: t.noText,
          variant: "destructive",
        });
      }
    } catch (e: any) {
      console.error(e);
      let title = t.transcriptionError;
      let description = e.message || "An error occurred while processing your PDF.";
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
  }, [t, toast, selectedModel]);


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

  const handleExport = () => {
    if (!transcribedText.trim()) {
        toast({
            title: t.exportFailed,
            description: t.noTextToExport,
            variant: "destructive",
        });
        return;
    }
    exportTranscript(transcribedText, 'docx', [], toast);
  };
  
  const handleCopy = () => {
    if (!transcribedText) return;
    navigator.clipboard.writeText(transcribedText).then(() => {
        toast({ title: t.copied });
    });
  };

  const isReadyForContent = !isTranscribing && transcribedText.length > 0;
  
  return (
    <div className="flex flex-col h-full bg-background text-foreground">
        <main 
            className="flex-grow flex flex-col p-4 md:p-6 relative"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragEvents}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{minHeight: !pdfFile ? '80vh' : 'auto' }}
        >
            {isTranscribing && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground mt-4 text-lg">{t.transcribing}</p>
                </div>
            )}

            {!pdfFile ? (
                <div 
                    className={cn(
                        "flex flex-col flex-grow items-center justify-center text-center rounded-2xl border-2 border-border bg-card h-full transition-colors cursor-pointer",
                        isDragging && "border-primary bg-primary/10"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <FileUp className="w-16 h-16 text-muted-foreground/30 mb-4"/>
                    <h3 className="text-xl font-semibold">{t.chooseFile}</h3>
                    <p className="text-muted-foreground mt-2">{t.dropPdf}</p>
                </div>
            ) : (
                isReadyForContent && (
                  <Card className="flex flex-col flex-grow h-full shadow-sm overflow-hidden rounded-2xl">
                      <Textarea
                          value={transcribedText}
                          readOnly
                          placeholder={t.transcribedTextPlaceholder}
                          className="h-full w-full resize-none text-base leading-relaxed p-6 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-grow"
                          aria-label="Transcribed Text"
                      />
                  </Card>
                )
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
                accept="application/pdf"
            />
        </main>
        
        {isReadyForContent && (
          <footer className="flex-shrink-0 flex items-center justify-center gap-2 p-4 border-t bg-background">
            <div className="w-full max-w-lg flex gap-2 items-center justify-center">
                  <Button onClick={handleCopy} variant="outline" size="icon" className="h-12 w-12 rounded-full">
                      <Copy className="h-5 w-5" />
                      <span className="sr-only">{t.copy}</span>
                  </Button>
                  <Button 
                      onClick={handleExport}
                      size="lg"
                      className="h-12 px-6 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                      <Download className="h-5 w-5" />
                      <span className="ml-2 sm:inline font-bold">{t.download}</span>
                  </Button>
            </div>
          </footer>
        )}
    </div>
  );
}
