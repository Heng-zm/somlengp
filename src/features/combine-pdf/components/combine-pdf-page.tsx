
"use client";

import { useState, useMemo, useContext, useRef, useCallback } from 'react';
import { FileUp, X, File, FilePlus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { allTranslations, resolveTranslation } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { MAX_FILE_SIZE_MB } from '@/config';
import { ThreeDotsLoader } from '@/components/shared/three-dots-loader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatFileSize, formatTotalFileSize } from '@/lib/format-file-size';

// Small, memo-friendly file card to avoid re-renders of the whole list
function FileCard({ file, onRemove }: { file: File; onRemove: () => void }) {
  return (
    <Card className="relative group aspect-square flex flex-col items-center justify-center p-2 text-center transition-shadow hover:shadow-md">
      <File className="w-12 h-12 text-primary mb-2" />
      <p className="text-sm font-medium truncate w-full">{file.name}</p>
      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
        <Button variant="destructive" size="icon" onClick={onRemove}>
          <X className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  );
}

const MAX_FILES = 50;

export function CombinePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isCombining, setIsCombining] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('CombinePdfPage must be used within a LanguageProvider');
  }
  const { language } = langContext;
  const t = useMemo(() => allTranslations[language], [language]);

  const totalSizeLabel = useMemo(() => formatTotalFileSize(files), [files]);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    const existing = new Set(files.map((f) => `${f.name}_${f.size}_${f.lastModified}`));

    for (const file of Array.from(selectedFiles)) {
      if (file.type !== 'application/pdf') {
        invalidFiles.push(file.name);
        continue;
      }
      const key = `${file.name}_${file.size}_${file.lastModified}`;
      if (!existing.has(key)) validFiles.push(file);
    }

    if (invalidFiles.length > 0) {
      toast({
        title: t.invalidFileType,
        description: t.selectPdfFile,
        variant: 'destructive',
      });
    }

    if (validFiles.length > 0) {
      setFiles((prev) => {
        const next = [...prev, ...validFiles];
        if (next.length > MAX_FILES) {
          toast({ title: t.combineError, description: `Limit ${MAX_FILES} files.`, variant: 'destructive' });
          return next.slice(0, MAX_FILES);
        }
        return next;
      });
    }
  }, [files, t, toast]);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCombine = useCallback(async () => {
    if (files.length < 2) {
      toast({ title: t.combineError, description: t.combineErrorDescription, variant: 'destructive' });
      return;
    }

    setIsCombining(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const form = new FormData();
      for (const f of files) form.append('files', f);

      const res = await fetch('/api/combine-pdf', { method: 'POST', body: form, signal: controller.signal });

      if (!res.ok) {
        const text = await res.text();
        const error = new Error(text || `Request failed with status ${res.status}`);
        (error as any).status = res.status;
        throw error;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'combined.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFiles([]);
    } catch (e: unknown) {
      if ((e as any)?.name === 'AbortError') return;
      let title = t.combineError;
      let description = e instanceof Error ? e.message : 'An unknown error occurred.';
      const status = (e as any)?.status as number | undefined;
      const errorMessage = (e instanceof Error ? e.message : '').toLowerCase();

      if (status === 413 || errorMessage.includes('413') || errorMessage.includes('too large')) {
        title = t.fileTooLargeTitle;
        description = resolveTranslation(t.fileTooLargeDescription, MAX_FILE_SIZE_MB);
      }
      toast({ title, description, variant: 'destructive' });
    } finally {
      setIsCombining(false);
    }
  }, [files, t, toast]);

  const cancelCombine = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsCombining(false);
  }, []);

  const handleDragEvents = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, [handleDragEvents]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  }, [handleDragEvents]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleDragEvents, handleFileSelect]);

  return (
    <div
      className="flex flex-col min-h-[100dvh] bg-transparent text-foreground touch-manipulation safe-area-top safe-area-bottom"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragEvents}
    >
      <main className="flex-grow p-3 sm:p-4 md:p-6 flex flex-col items-center">
        <div className="w-full max-w-4xl flex-grow flex flex-col">
          {files.length === 0 ? (
            <Card
              className={cn(
                'flex flex-col items-center justify-center text-center border-2 border-dashed h-64 sm:h-80 md:h-full transition-colors cursor-pointer p-4 sm:p-6 mobile-gap-2',
                isDragging ? 'border-primary bg-primary/10' : 'border-border'
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileUp className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold">{t.combinePdfTitle}</h3>
              <p className="text-muted-foreground mt-2 mobile-text-sm">{t.dropMultiplePdfs}</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 h-full">
              <Card className="flex flex-col">
                <div className="p-3 sm:p-4 border-b">
                  <h3 className="text-base sm:text-lg font-semibold">{t.filesToCombine} ({files.length})</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Total size: {totalSizeLabel}</p>
                </div>
                <ScrollArea className="flex-grow p-3 sm:p-4 no-scrollbar smooth-scroll">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {files.map((file, index) => (
                      <FileCard key={`${file.name}_${file.size}_${file.lastModified}`} file={file} onRemove={() => handleRemoveFile(index)} />
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              <Card
                className={cn(
                  'flex flex-col items-center justify-center text-center border-2 border-dashed h-40 sm:h-auto transition-colors cursor-pointer p-4 sm:p-6',
                  isDragging ? 'border-primary bg-primary/10' : 'border-border'
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <FilePlus className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-3 sm:mb-4" />
                <h3 className="text-lg font-semibold">{t.addMorePdfs}</h3>
              </Card>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          accept="application/pdf"
          multiple
        />
      </main>

      <footer className="sticky bottom-0 z-10 flex items-center justify-center gap-2 p-3 sm:p-4 border-t bg-background/80 backdrop-blur safe-area-bottom">
        <div className="w-full max-w-lg flex gap-2 items-center">
          <Button onClick={handleCombine} size="lg" className="flex-1 h-12" disabled={isCombining || files.length < 2}>
            {isCombining ? <ThreeDotsLoader /> : <Download className="h-5 w-5" />}
            <span className="ml-2 sm:inline font-bold">{t.combineAndDownload}</span>
          </Button>
          {isCombining ? (
            <Button variant="secondary" onClick={cancelCombine} className="h-12">
              {t.cancel ?? 'Cancel'}
            </Button>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
