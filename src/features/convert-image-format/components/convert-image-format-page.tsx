
'use client';

import {
  useState,
  useMemo,
  useContext,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import {FileUp, X, Download, Wand2, ImagePlus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
import {Card} from '@/components/ui/card';
import {allTranslations, resolveTranslation} from '@/lib/translations';
import {LanguageContext} from '@/contexts/language-context';
import {cn} from '@/lib/utils';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Label} from '@/components/ui/label';
import JSZip from 'jszip';
import { ThreeDotsLoader } from '@/components/shared/three-dots-loader';
import { ScrollArea } from '@/components/ui/scroll-area';

type TargetFormat = 'jpeg' | 'png' | 'webp' | 'bmp' | 'gif' | 'avif';

const clientSideConvert = (
  file: File,
  targetFormat: TargetFormat
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context.'));
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob conversion failed.'));
            }
          },
          `image/${targetFormat}`
        );
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function ConvertImageFormatPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('png');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {toast} = useToast();

  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error(
      'ConvertImageFormatPage must be used within a LanguageProvider'
    );
  }
  const {language} = langContext;
  const t = useMemo(() => allTranslations[language], [language]);

  const fileObjectURLs = useMemo(() => files.map(file => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    // This effect will run when the component unmounts or when fileObjectURLs changes.
    // It's crucial for preventing memory leaks.
    return () => {
        fileObjectURLs.forEach(url => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileObjectURLs]);

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const newFiles = Array.from(selectedFiles).filter(file => {
        if (!file.type.startsWith('image/')) {
          toast({
            title: t.invalidFileType,
            description: `${file.name} is not a valid image file.`,
            variant: 'destructive',
          });
          return false;
        }
        return true;
      });

      setFiles(prev => [...prev, ...newFiles]);
    },
    [t.invalidFileType, toast]
  );

  const handleConvert = async () => {
    if (files.length === 0) {
      toast({
        title: t.conversionError,
        description: t.conversionErrorDescription,
        variant: 'destructive',
      });
      return;
    }

    setIsConverting(true);
    const zip = new JSZip();

    try {
      await Promise.all(
        files.map(async file => {
          const convertedBlob = await clientSideConvert(file, targetFormat);
          const originalName = file.name.substring(
            0,
            file.name.lastIndexOf('.')
          );
          zip.file(`${originalName}.${targetFormat}`, convertedBlob);
        })
      );

      const zipBlob = await zip.generateAsync({type: 'blob'});
      const a = document.createElement('a');
      const url = URL.createObjectURL(zipBlob);
      a.href = url;
      a.download = `converted_images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Conversion Successful!',
        description: `${files.length} images have been converted and downloaded as a zip file.`,
      });
      setIsDrawerOpen(false);
    } catch (e: any) {
      toast({
        title: t.conversionError,
        description: e.message || 'An unknown error occurred during conversion.',
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

  const handleRemoveFile = (index: number) => {
    setFiles(prev => {
        const newFiles = prev.filter((_, i) => i !== index);
        if (newFiles.length === 0 && fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset the input so the same file can be selected again
        }
        return newFiles;
    });
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
                    'flex flex-col items-center justify-center text-center border-2 border-dashed h-full transition-colors cursor-pointer p-6',
                    isDragging ? "border-primary bg-primary/10" : "border-border"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <FileUp className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">{t.convertImageFormatTitle}</h3>
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
                          'flex flex-col items-center justify-center text-center border-2 border-dashed h-full transition-colors cursor-pointer p-6',
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
          onChange={e => handleFileSelect(e.target.files)}
          className="hidden"
          accept="image/*"
          multiple
        />
      </main>

      <footer className="flex-shrink-0 flex items-center justify-center gap-2 p-4 border-t bg-background">
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="w-full max-w-lg h-12"
              disabled={isConverting || files.length === 0}
            >
                <Wand2 className="h-5 w-5" />
                <span className="ml-2 sm:inline font-bold">
                  {t.exportSettings}
                </span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-lg bg-background border-t">
            <SheetHeader className="text-left">
              <SheetTitle>{t.exportSettings}</SheetTitle>
              <SheetDescription>{t.chooseFormat}</SheetDescription>
            </SheetHeader>
            <div className="grid gap-6 py-6">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="format-select">Target Format</Label>
                <Select
                  value={targetFormat}
                  onValueChange={v => setTargetFormat(v as TargetFormat)}
                  disabled={isConverting}
                >
                  <SelectTrigger id="format-select">
                    <SelectValue placeholder="Select format..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="webp">WEBP</SelectItem>
                    <SelectItem value="gif">GIF</SelectItem>
                    <SelectItem value="bmp">BMP</SelectItem>
                    <SelectItem value="avif">AVIF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleConvert}
                size="lg"
                className="w-full h-12"
                disabled={isConverting || files.length === 0}
              >
                {isConverting ? (
                  <ThreeDotsLoader />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                <span className="ml-2 sm:inline font-bold">
                  {t.convertAndDownload}
                </span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </footer>
    </div>
  );
}
