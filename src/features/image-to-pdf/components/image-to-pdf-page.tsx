
"use client";

import { useState, useMemo, useContext, useRef, useEffect } from 'react';
import { FileUp, X, Image as ImageIcon, ImagePlus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { allTranslations } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { imageToPdf } from '@/ai/flows/image-to-pdf-flow';
import Image from 'next/image';
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


export function ImageToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('ImageToPdfPage must be used within a LanguageProvider');
  }
  const { language } = langContext;
  const t = useMemo(() => allTranslations[language], [language]);

  const fileObjectURLs = useMemo(() => files.map(file => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => {
        fileObjectURLs.forEach(url => URL.revokeObjectURL(url));
    };
  }, [fileObjectURLs]);
  
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(selectedFiles).forEach(file => {
        if (!file.type.startsWith('image/')) {
            invalidFiles.push(file.name);
        } else {
            validFiles.push(file);
        }
    });

    if (invalidFiles.length > 0) {
        toast({
            title: t.invalidFileType,
            description: t.selectImageFile,
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
  
  const handleConvert = async () => {
    if (files.length === 0) {
        toast({
            title: t.conversionError,
            description: t.conversionErrorDescription,
            variant: "destructive",
        });
        return;
    }
    
    setIsConverting(true);
    try {
        const fileUris = await Promise.all(files.map(file => blobToBase64(file)));
        const { pdfDataUri } = await imageToPdf({ imageDataUris: fileUris });

        const blob = dataUriToBlob(pdfDataUri);
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setFiles([]);

    } catch(e: any) {
        let title = t.conversionError;
        let description = e.message || 'An unknown error occurred.';
        const errorMessage = (e.message || '').toLowerCase();

        if (errorMessage.includes('413') || errorMessage.includes('too large')) {
            title = t.fileTooLargeTitle;
            description = t.fileTooLargeDescription(MAX_FILE_SIZE_MB);
        }
        toast({
            title,
            description,
            variant: 'destructive',
        });
    } finally {
        setIsConverting(false);
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
                        <h3 className="text-xl font-semibold">{t.imageToPdfTitle}</h3>
                        <p className="text-muted-foreground mt-2">{t.dropImages}</p>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6 h-full">
                        <Card className="flex flex-col">
                            <div className="p-4 border-b">
                                <h3 className="text-lg font-semibold">{t.imagesToConvert} ({files.length})</h3>
                            </div>
                            <ScrollArea className="flex-grow p-4">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                  {fileObjectURLs.map((url, index) => (
                                      <Card key={url} className="relative aspect-square group overflow-hidden rounded-lg">
                                          <Image 
                                                  src={url} 
                                                  alt={`Preview ${index}`} 
                                                  fill
                                                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                                  style={{ objectFit: 'cover' }}
                                                  className="transition-transform duration-300 group-hover:scale-105"
                                          />
                                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
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
                            <ImagePlus className="w-16 h-16 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold">{t.addMoreImages}</h3>
                        </Card>
                    </div>
                )}
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                accept="image/*"
                multiple
            />
        </main>
        
        <footer className="flex-shrink-0 flex items-center justify-center gap-2 p-4 border-t bg-background">
            <div className="w-full max-w-lg flex gap-2 items-center">
                <Button 
                    onClick={handleConvert}
                    size="lg"
                    className="flex-1 h-12"
                    disabled={isConverting || files.length === 0}
                >
                    {isConverting ? (
                        <ThreeDotsLoader />
                    ) : (
                        <Download className="h-5 w-5" />
                    )}
                    <span className="ml-2 sm:inline font-bold">{t.convertAndDownload}</span>
                </Button>
            </div>
        </footer>
    </div>
  );
}
