
'use client';

import {
  useState,
  useMemo,
  useContext,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import {Loader2, FileUp, X, Download, Wand2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useToast} from '@/hooks/use-toast';
import {Card} from '@/components/ui/card';
import {allTranslations} from '@/lib/translations';
import {LanguageContext} from '@/contexts/language-context';
import {cn} from '@/lib/utils';
import {convertImageFormat} from '@/ai/flows/convert-image-format-flow';
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
import {MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB} from '@/config';

type TargetFormat = 'jpeg' | 'png' | 'webp';

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

export function ConvertImageFormatPage() {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
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

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreview(null);
    }
  }, [file]);

  const handleFileSelect = useCallback(
    (selectedFile: File | null | undefined) => {
      if (!selectedFile) return;

      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: t.fileTooLargeTitle,
          description: t.fileTooLargeDescription(MAX_FILE_SIZE_MB),
          variant: 'destructive',
        });
        return;
      }

      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: t.invalidFileType,
          description: t.selectImageFile,
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
    },
    [t, toast]
  );

  const handleConvert = async () => {
    if (!file) {
      toast({
        title: t.conversionError,
        description: t.conversionErrorDescription,
        variant: 'destructive',
      });
      return;
    }

    setIsConverting(true);
    try {
      const imageDataUri = await blobToBase64(file);
      const {convertedImageDataUri} = await convertImageFormat({
        imageDataUri,
        targetFormat,
      });

      const a = document.createElement('a');
      a.href = convertedImageDataUri;
      const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
      a.download = `${originalName}.${targetFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: 'Conversion Successful!',
        description: `Your image has been converted to ${targetFormat.toUpperCase()}.`,
      });
      setIsDrawerOpen(false); // Close drawer on success
    } catch (e: any) {
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
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        {!file ? (
          <Card
            className={cn(
              'flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed border-border bg-card h-full transition-colors cursor-pointer p-6 min-h-[70vh]',
              isDragging && 'border-primary bg-primary/10'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold">{t.convertImageFormatTitle}</h3>
            <p className="text-muted-foreground mt-2">{t.dropImageToConvert}</p>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center gap-6">
            <Card className="relative w-full max-w-xl aspect-video group overflow-hidden rounded-lg shadow-md">
              {filePreview && (
                <Image
                  src={filePreview}
                  alt="Image preview"
                  fill
                  style={{objectFit: 'contain'}}
                />
              )}
              <div className="absolute top-2 right-2">
                <Button
                  variant="destructive"
                  size="icon"
                  className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={clearFile}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={e => handleFileSelect(e.target.files?.[0])}
          className="hidden"
          accept="image/*"
        />
      </main>

      <footer className="flex-shrink-0 flex items-center justify-center gap-2 p-4 border-t bg-background">
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="w-full max-w-lg rounded-full h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={isConverting || !file}
            >
                <Wand2 className="h-5 w-5" />
                <span className="ml-2 sm:inline font-bold">
                  {t.exportSettings}
                </span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-lg">
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
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleConvert}
                size="lg"
                className="w-full"
                disabled={isConverting || !file}
              >
                {isConverting ? (
                  <Loader2 className="animate-spin" />
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
