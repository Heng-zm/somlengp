
"use client";

import { useState, useRef, useMemo, useCallback } from 'react';
import { FileUp, Loader2, Download, Copy, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { transcribePdf } from '@/ai/flows/pdf-transcript-flow';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { exportTranscript } from '@/lib/export';
import { Sidebar } from '@/components/shared/sidebar';

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

const translations = {
  km: {
    pageTitle: "ប្រតិចារិក PDF",
    selectModel: "ជ្រើសរើសម៉ូដែល",
    transcribing: "កំពុងបម្លែង PDF សូមរង់ចាំ...",
    readyToTranscribe: "ត្រៀមខ្លួនដើម្បីបម្លែង",
    dropPdf: "ដាក់ឯកសារ PDF នៅទីនេះ ឬចុចដើម្បីផ្ទុកឡើង។",
    transcriptionFailed: "ការបម្លែងបានបរាជ័យ",
    noText: "ម៉ូដែលមិនបានបញ្ជូនអត្ថបទមកវិញទេ។ សូមព្យាយាមម្តងទៀត។",
    transcriptionError: "កំហុសក្នុងការបម្លែង",
    invalidFileType: "ប្រភេទឯកសារមិនត្រឹមត្រូវ",
    selectPdfFile: "សូមជ្រើសរើសឯកសារ PDF។",
    transcribedTextPlaceholder: "អត្ថបទដែលបានបម្លែងនឹងបង្ហាញនៅទីនេះ។",
    download: "ទាញយក",
    copy: "ចម្លង",
    copied: "បានចម្លង!",
    rateLimitExceeded: "លើសកម្រិតកំណត់",
    rateLimitMessage: "អ្នកបានធ្វើការស្នើសុំច្រើនពេក។ សូមរង់ចាំមួយភ្លែត ឬពិនិត្យមើលផែនការ API និងព័ត៌មានលម្អិតអំពីការចេញវិក្កយប័ត្ររបស់អ្នក។",
    uploadCardTitle: "ផ្ទុកឡើង PDF របស់អ្នក",
    transcriptionSuccess: "ការបម្លែងបានជោគជ័យ!",
    fileName: "ឈ្មោះ​ឯកសារ:",
    fileSize: "ទំហំ​ឯកសារ:",
    voiceScribe: "ប្រតិចារិកសំឡេង",
    pdfTranscript: "ប្រតិចារិក PDF",
    features: "លក្ខណៈពិសេស",
    support: "គាំទ្រ",
    supportDescription: "ប្រសិនបើអ្នកពេញចិត្តនឹងកម្មវិធីនេះ សូមពិចារណាគាំទ្រការអភិវឌ្ឍន៍របស់វា។",
    actions: "សកម្មភាព",
    actionsDescription: "ចម្លង ឬទាញយកអត្ថបទជាទម្រង់ផ្សេងៗ។",
    exportSettings: "ការកំណត់ការនាំចេញ",
    chooseFormat: "ជ្រើសរើសទម្រង់ និងការកំណត់របស់អ្នក បន្ទាប់មកចុចនាំចេញ។",
    exportFormat: "ទ្រង់ទ្រាយនាំចេញ",
    exportTranscript: "នាំចេញប្រតិចារិក",
  },
  en: {
    pageTitle: "PDF Transcript",
    selectModel: "Select model",
    transcribing: "Transcribing PDF, please wait...",
    readyToTranscribe: "Ready to Transcribe",
    dropPdf: "Drop a PDF file here or click to upload.",
    transcriptionFailed: "Transcription failed",
    noText: "The model did not return any text. Please try again.",
    transcriptionError: "Transcription Error",
    invalidFileType: "Invalid file type",
    selectPdfFile: "Please select a PDF file.",
    transcribedTextPlaceholder: "Transcribed text will appear here.",
    download: "DOWNLOAD",
    copy: "COPY",
    copied: "Copied!",
    rateLimitExceeded: "Rate Limit Exceeded",
    rateLimitMessage: "You've made too many requests. Please wait a moment or check your API plan and billing details.",
    uploadCardTitle: "Upload your PDF",
    transcriptionSuccess: "Transcription Successful!",
    fileName: "File Name:",
    fileSize: "File Size:",
    voiceScribe: "Voice Transcript",
    pdfTranscript: "PDF Transcript",
    features: "Features",
    support: "Support",
    supportDescription: "If you find this application useful, please consider supporting its development.",
    actions: "Actions",
    actionsDescription: "Copy or download the text in various formats.",
    exportSettings: "Export Settings",
    chooseFormat: "Choose your format and settings, then click export.",
    exportFormat: "Export Format",
    exportTranscript: "Export Transcript",
  }
};

export function PdfTranscriptPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isExportSheetOpen, setIsExportSheetOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [exportFormat, setExportFormat] = useState('docx');
  const [language, setLanguage] = useState<'km' | 'en'>('en');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const t = useMemo(() => translations[language], [language]);
  
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
    exportTranscript(transcribedText, exportFormat as 'txt' | 'json' | 'csv' | 'docx', [], toast);
    setIsExportSheetOpen(false);
  };
  
  const formatDisplayNames: {[key: string]: string} = {
    docx: 'DOCX (Word Document)',
    txt: 'TXT (Plain Text)',
    json: 'JSON (Structured Data)',
    csv: 'CSV (Spreadsheet)',
  }

  const handleCopy = () => {
    if (!transcribedText) return;
    navigator.clipboard.writeText(transcribedText).then(() => {
        toast({ title: t.copied });
    });
  };

  const isReadyForContent = !isTranscribing && transcribedText.length > 0;
  
  const modelDisplayNames = useMemo(() => ({
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
    'gemini-1.5-flash-latest': 'Gemini 1.5 Flash',
  }), []);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="left" 
                  className="p-0 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col"
                >
                  <SheetHeader>
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                  </SheetHeader>
                  <Sidebar />
                </SheetContent>
              </Sheet>
              <h1 className="text-xl font-bold">{t.pdfTranscript}</h1>
            </div>
            <div className="flex items-center gap-2">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t.selectModel} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(modelDisplayNames).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
        </header>

        <main 
            className="flex-grow p-4 md:p-6 grid grid-cols-1 gap-6 relative bg-muted/40 overflow-y-auto"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragEvents}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
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
                        "flex flex-col items-center justify-center text-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-background h-full transition-colors cursor-pointer",
                        isDragging && "border-primary bg-primary/10"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <FileUp className="w-20 h-20 text-muted-foreground/30 mb-4"/>
                    <h3 className="text-2xl font-semibold">{t.readyToTranscribe}</h3>
                    <p className="text-muted-foreground mt-2 mb-4">{t.dropPdf}</p>
                </div>
            ) : (
                <Card className="flex flex-col h-full shadow-sm overflow-hidden">
                    <Textarea
                        value={transcribedText}
                        readOnly
                        placeholder={t.transcribedTextPlaceholder}
                        className="h-full w-full resize-none font-body text-base leading-relaxed p-6 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-grow"
                        aria-label="Transcribed Text"
                    />
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
        
        <footer className="flex-shrink-0 flex items-center justify-center gap-2 p-4 border-t bg-background shadow-sm">
            <div className="w-full max-w-lg flex gap-2 items-center">
                <Button onClick={handleCopy} disabled={!isReadyForContent} variant="outline" size="icon" className="h-14 w-14 rounded-full">
                    <Copy className="h-6 w-6" />
                    <span className="sr-only">{t.copy}</span>
                </Button>
                <Sheet open={isExportSheetOpen} onOpenChange={setIsExportSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="default" size="lg" disabled={!isReadyForContent} className="flex-1 rounded-full h-14 px-8">
                            <Download className="h-5 w-5" />
                            <span className="ml-2 sm:inline font-bold text-lg">{t.download}</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-lg">
                        <SheetHeader className="text-left">
                            <SheetTitle>{t.exportSettings}</SheetTitle>
                            <SheetDescription>
                            {t.chooseFormat}
                            </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-6 py-6">
                        <div className="grid gap-3">
                                <Label>{t.exportFormat}</Label>
                                <Select value={exportFormat} onValueChange={setExportFormat}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select format" />
                                    </Trigger>
                                    <SelectContent>
                                        {Object.entries(formatDisplayNames).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                onClick={handleExport}
                                disabled={!isReadyForContent}
                                size="lg"
                            >
                                <Download className="mr-2" />
                                {t.exportTranscript}
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </footer>
    </div>
  );
}
