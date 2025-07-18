
"use client";

import { useState, useMemo, useContext, useRef } from 'react';
import { Loader2, FileUp, X, Image as ImageIcon, Download, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { allTranslations } from '@/lib/translations';
import { LanguageContext } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { imageToPdf } from '@/ai/flows/image-to-pdf-flow';
import Image from 'next/image';

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
  
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles = Array.from(selectedFiles).filter(file => file.type.startsWith('image/'));
    if (newFiles.length !== selectedFiles.length) {
        toast({
            title: t.invalidFileType,
            description: t.selectImageFile,
            variant: "destructive",
        });
    }
    setFiles(prev => [...prev, ...newFiles]);
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

        const byteCharacters = atob(pdfDataUri.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {type: 'application/pdf'});
        
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
        toast({
            title: t.conversionError,
            description: e.message || 'An unknown error occurred.',
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
    <div className="flex flex-col h-full bg-background text-foreground">
        <main 
            className="flex-grow p-4 md:p-6 grid grid-cols-1 gap-6 relative overflow-y-auto"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragEvents}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <Card 
                className={cn(
                    "flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-card h-full transition-colors p-6",
                    isDragging && "border-primary bg-primary/10",
                    files.length > 0 && "items-start justify-start"
                )}
            >
                {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full w-full cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <FileUp className="w-16 h-16 text-muted-foreground/30 mb-4"/>
                        <h3 className="text-xl font-semibold">{t.imageToPdfTitle}</h3>
                        <p className="text-muted-foreground mt-2">{t.dropImages}</p>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col">
                        <h3 className="text-xl font-semibold text-left mb-4">{t.imagesToConvert}</h3>
                        <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto pr-2">
                           {files.map((file, index) => (
                               <div key={index} className="relative aspect-square group">
                                   <Image 
                                        src={URL.createObjectURL(file)} 
                                        alt={`Preview ${index}`} 
                                        layout="fill"
                                        objectFit="cover"
                                        className="rounded-md"
                                   />
                                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Button variant="destructive" size="icon" onClick={() => handleRemoveFile(index)}>
                                           <X className="w-5 h-5"/>
                                       </Button>
                                   </div>
                               </div>
                           ))}
                           <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md text-muted-foreground hover:bg-muted/50 hover:border-primary transition-colors"
                            >
                                <ImagePlus className="w-8 h-8 mb-2" />
                                <span>{t.addMoreImages}</span>
                            </button>
                        </div>
                    </div>
                )}
            </Card>

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
                    className="flex-1 rounded-full h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={isConverting || files.length === 0}
                >
                    {isConverting ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <ImageIcon className="h-5 w-5" />
                    )}
                    <span className="ml-2 sm:inline font-bold">{t.convertAndDownload}</span>
                </Button>
            </div>
        </footer>
    </div>
  );
}
