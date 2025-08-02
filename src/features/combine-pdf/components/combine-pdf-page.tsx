
"use client";

import { useState, useMemo, useContext, useRef } from 'react';
import { FileUp, X, File, FilePlus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { allTranslations, resolveTranslation } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { combinePdf } from '@/ai/flows/combine-pdf-flow';
import { MAX_FILE_SIZE_MB } from '@/config';
import { ThreeDotsLoader } from '@/components/shared/three-dots-loader';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const dataUriToBlob = (dataUri: string): Blob => {
    const byteString = atob(dataUri.split(',')[1]);
    const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

export function CombinePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isCombining, setIsCombining] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('CombinePdfPage must be used within a LanguageProvider');
  }
  const { language } = langContext;
  const t = useMemo(() => allTranslations[language], [language]);
  
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(selectedFiles).forEach(file => {
        if (file.type !== 'application/pdf') {
            invalidFiles.push(file.name);
        } else {
            validFiles.push(file);
        }
    });

    if (invalidFiles.length > 0) {
        toast({
            title: t.invalidFileType,
            description: t.selectPdfFile,
            variant: "destructive",
        });
    }

    if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleCombine = async () => {
    if (files.length < 2) {
        toast({
            title: t.combineError,
            description: t.combineErrorDescription,
            variant: "destructive",
        });
        return;
    }
    
    setIsCombining(true);
    try {
        const fileUris = await Promise.all(files.map(file => blobToBase64(file)));
        const { combinedPdfDataUri } = await combinePdf({ pdfDataUris: fileUris });

        const blob = dataUriToBlob(combinedPdfDataUri);
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'combined.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setFiles([]);

    } catch(e: unknown) {
        let title = t.combineError;
        let description = e instanceof Error ? e.message : 'An unknown error occurred.';
        const errorMessage = (e instanceof Error ? e.message : '').toLowerCase();

        if (errorMessage.includes('413') || errorMessage.includes('too large')) {
            title = t.fileTooLargeTitle;
            description = resolveTranslation(t.fileTooLargeDescription, MAX_FILE_SIZE_MB);
        }
        toast({
            title,
            description,
            variant: 'destructive',
        });
    } finally {
        setIsCombining(false);
    }
  };

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
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div 
        className="flex flex-col h-full bg-transparent text-foreground"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEvents}
    >
      <main className="flex-grow p-4 md:p-6 flex flex-col items-center">
          <div className="w-full max-w-4xl flex-grow flex flex-col">
              {files.length === 0 ? (
                  <Card
                      className={cn(
                          "flex flex-col items-center justify-center text-center border-2 border-dashed h-full transition-colors cursor-pointer p-6",
                           isDragging ? "border-primary bg-primary/10" : "border-border"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                  >
                      <FileUp className="w-16 h-16 text-muted-foreground mb-4"/>
                      <h3 className="text-xl font-semibold">{t.combinePdfTitle}</h3>
                      <p className="text-muted-foreground mt-2">{t.dropMultiplePdfs}</p>
                  </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-6 h-full">
                  <Card className="flex flex-col">
                    <div className="p-4 border-b">
                        <h3 className="text-lg font-semibold">{t.filesToCombine} ({files.length})</h3>
                    </div>
                    <ScrollArea className="flex-grow p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {files.map((file, index) => (
                               <Card key={index} className="relative group aspect-square flex flex-col items-center justify-center p-2 text-center transition-shadow hover:shadow-md">
                                   <File className="w-12 h-12 text-primary mb-2"/>
                                   <p className="text-sm font-medium truncate w-full">{file.name}</p>
                                   <p className="text-xs text-muted-foreground">{`${(file.size / 1024 / 1024).toFixed(2)} MB`}</p>
                                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                                     <Button variant="destructive" size="icon" onClick={() => handleRemoveFile(index)}>
                                         <X className="w-5 h-5"/>
                                     </Button>
                                   </div>
                               </Card>
                            ))}
                        </div>
                    </ScrollArea>
                  </Card>

                  <Card
                      className={cn(
                          "flex flex-col items-center justify-center text-center border-2 border-dashed h-full transition-colors cursor-pointer p-6",
                           isDragging ? "border-primary bg-primary/10" : "border-border"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                  >
                      <FilePlus className="w-16 h-16 text-muted-foreground mb-4"/>
                      <h3 className="text-xl font-semibold">{t.addMorePdfs}</h3>
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
        
      <footer className="flex-shrink-0 flex items-center justify-center gap-2 p-4 border-t bg-background">
          <div className="w-full max-w-lg flex gap-2 items-center">
              <Button 
                  onClick={handleCombine}
                  size="lg"
                  className="flex-1 h-12"
                  disabled={isCombining || files.length < 2}
              >
                  {isCombining ? (
                      <ThreeDotsLoader />
                  ) : (
                      <Download className="h-5 w-5" />
                  )}
                  <span className="ml-2 sm:inline font-bold">{t.combineAndDownload}</span>
              </Button>
          </div>
      </footer>
    </div>
  );
}
