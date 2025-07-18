
"use client";

import { useState, useMemo, useContext, useRef, useCallback } from 'react';
import { Combine, Loader2, FileUp, X, File, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { allTranslations } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { combinePdf } from '@/ai/flows/combine-pdf-flow';

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

function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

const dataUriToBuffer = (dataUri: string): Buffer => {
    const base64 = dataUri.split(',')[1];
    return Buffer.from(base64, 'base64');
};


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
    const newFiles = Array.from(selectedFiles).filter(file => file.type === 'application/pdf');
    if (newFiles.length !== selectedFiles.length) {
        toast({
            title: t.invalidFileType,
            description: t.selectPdfFile,
            variant: "destructive",
        });
    }
    setFiles(prev => [...prev, ...newFiles]);
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

        const byteCharacters = atob(combinedPdfDataUri.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {type: 'application/pdf'});
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'combined.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setFiles([]);

    } catch(e: any) {
        toast({
            title: t.combineError,
            description: e.message || 'An unknown error occurred.',
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
    <div className="flex flex-col h-full bg-background text-foreground">
        <main 
            className="flex-grow p-4 md:p-6 grid grid-cols-1 gap-6 relative"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragEvents}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <Card 
                className={cn(
                    "flex flex-col items-center justify-center text-center rounded-2xl border-2 border-border bg-card h-full transition-colors cursor-pointer p-6",
                    isDragging && "border-primary bg-primary/10",
                    files.length > 0 && "items-start justify-start"
                )}
                onClick={() => files.length === 0 && fileInputRef.current?.click()}
            >
                {files.length === 0 ? (
                    <>
                        <FileUp className="w-16 h-16 text-muted-foreground/30 mb-4"/>
                        <h3 className="text-xl font-semibold">{t.combinePdfTitle}</h3>
                        <p className="text-muted-foreground mt-2">{t.dropMultiplePdfs}</p>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col">
                        <h3 className="text-xl font-semibold text-left mb-4">{t.filesToCombine}</h3>
                        <div className="flex-grow space-y-2 overflow-y-auto pr-2">
                           {files.map((file, index) => (
                               <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                   <div className="flex items-center gap-2 overflow-hidden">
                                       <File className="w-5 h-5 text-primary"/>
                                       <span className="truncate">{file.name}</span>
                                   </div>
                                   <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(index)}>
                                       <X className="w-4 h-4"/>
                                   </Button>
                               </div>
                           ))}
                        </div>
                        <Button 
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FileUp className="mr-2"/>
                            {t.addMorePdfs}
                        </Button>
                    </div>
                )}
            </Card>

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
                    className="flex-1 rounded-full h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={isCombining || files.length < 2}
                >
                    {isCombining ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <Combine className="h-5 w-5" />
                    )}
                    <span className="ml-2 sm:inline font-bold">{t.combineAndDownload}</span>
                </Button>
            </div>
        </footer>
    </div>
  );
}
