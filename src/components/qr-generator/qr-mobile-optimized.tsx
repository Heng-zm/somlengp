'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { 
  Download, Copy, QrCode, Share, Settings, Palette, 
  Monitor, Smartphone, Image as ImageIcon, FileImage, Camera,
  Zap, Shield, Lock, Eye, RotateCcw,
  Sparkles, CheckCircle, Loader2, TextCursor, Hash, History,
  Star, Grid, Layers, Maximize, Minimize,
  Trash2, Edit3, Plus, X, Check, AlertCircle,
  Menu, MoreVertical, Wifi, Phone, Mail, MessageSquare,
  Globe, AtSign, Smartphone as PhoneIcon, MessageCircle,
  Edit, SlidersHorizontal, Paintbrush, Wand2, SquareUserRound,
  Crop, Ruler, Move3D, Contrast, Brush, SquareDashedMousePointer,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/lib/toast-utils';
import { getQRAnalytics } from '@/lib/qr-analytics';
import { createQRError, QRErrorType, useQRErrorReporting } from '@/components/qr-generator/error-boundary';
import { QRScannerSheet } from '@/components/qr-scanner-sheet';

// QR Code templates with Lucide React icons
const QR_TEMPLATES = [
  { id: 'url', name: 'URL', shortName: 'URL', icon: Globe, placeholder: 'https://example.com', format: (text: string) => text.startsWith('http') ? text : `https://${text}` },
  { id: 'email', name: 'Email', shortName: 'Email', icon: AtSign, placeholder: 'email@domain.com', format: (text: string) => text.startsWith('mailto:') ? text : `mailto:${text}` },
  { id: 'phone', name: 'Phone', shortName: 'Phone', icon: PhoneIcon, placeholder: '+1234567890', format: (text: string) => text.startsWith('tel:') ? text : `tel:${text}` },
  { id: 'sms', name: 'SMS', shortName: 'SMS', icon: MessageCircle, placeholder: '+1234567890', format: (text: string) => text.includes('sms:') ? text : `sms:${text}` },
  { id: 'wifi', name: 'WiFi', shortName: 'WiFi', icon: Wifi, placeholder: 'WIFI:T:WPA;S:Name;P:pass;;', format: (text: string) => text },
  { id: 'text', name: 'Text', shortName: 'Text', icon: TextCursor, placeholder: 'Enter any text...', format: (text: string) => text }
];

// Color presets - mobile optimized
const COLOR_PRESETS = {
  foreground: ['#000000', '#1f2937', '#dc2626', '#ea580c', '#2563eb', '#7c3aed'],
  background: ['#ffffff', '#f3f4f6', '#fef2f2', '#fff7ed', '#eff6ff', '#f3e8ff']
};

// Custom hooks
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback((newValue: T | ((val: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setStoredValue] as const;
}

interface QRCodeOptions {
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  width: number;
  quality?: number;
}

interface SavedQRCode {
  id: string;
  content: string;
  template: string;
  options: QRCodeOptions;
  dataUrl: string;
  timestamp: number;
  favorite: boolean;
}

interface QRCodeMobileOptimizedProps {
  externalScannerState?: {
    isScannerOpen: boolean;
    setIsScannerOpen: (open: boolean) => void;
  };
  externalHistoryState?: {
    isHistoryOpen: boolean;
    setIsHistoryOpen: (open: boolean) => void;
  };
  externalSettingsState?: {
    isSettingsOpen: boolean;
    setIsSettingsOpen: (open: boolean) => void;
  };
}

export function QRCodeMobileOptimized({
  externalScannerState,
  externalHistoryState,
  externalSettingsState
}: QRCodeMobileOptimizedProps = {}) {
  // Core state
  const [inputText, setInputText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('text');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [livePreviewUrl, setLivePreviewUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLiveGenerating, setIsLiveGenerating] = useState(false);

  // Settings state
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [size, setSize] = useState(256);
  const [margin, setMargin] = useState(4);
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [outputFormat, setOutputFormat] = useState<'png' | 'svg' | 'jpeg'>('png');
  const [quality, setQuality] = useState(0.92);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(0.2); // 20% of QR code size
  const [logoBorderRadius, setLogoBorderRadius] = useState(0); // 0-50% for border radius

  // UI state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [internalIsHistoryOpen, setInternalIsHistoryOpen] = useState(false);
  const [internalIsSettingsOpen, setInternalIsSettingsOpen] = useState(false);
  const [internalIsScannerOpen, setInternalIsScannerOpen] = useState(false);
  const [showCustomDesign, setShowCustomDesign] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isHistoryOpen = externalHistoryState?.isHistoryOpen ?? internalIsHistoryOpen;
  const setIsHistoryOpen = externalHistoryState?.setIsHistoryOpen ?? setInternalIsHistoryOpen;
  const isSettingsOpen = externalSettingsState?.isSettingsOpen ?? internalIsSettingsOpen;
  const setIsSettingsOpen = externalSettingsState?.setIsSettingsOpen ?? setInternalIsSettingsOpen;
  const isScannerOpen = externalScannerState?.isScannerOpen ?? internalIsScannerOpen;
  const setIsScannerOpen = externalScannerState?.setIsScannerOpen ?? setInternalIsScannerOpen;

  // Storage and history
  const [savedCodes, setSavedCodes] = useLocalStorage<SavedQRCode[]>('qr-codes-history', []);
  const [recentTemplates, setRecentTemplates] = useLocalStorage<string[]>('qr-recent-templates', ['text']);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  // Analytics and error reporting
  const analytics = useMemo(() => getQRAnalytics(), []);
  const { reportError } = useQRErrorReporting();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debounced values for better performance
  const debouncedInputText = useDebounce(inputText, 200);
  const debouncedOptions = useDebounce({
    errorCorrectionLevel,
    margin,
    color: { dark: foregroundColor, light: backgroundColor },
    width: size,
    quality: outputFormat === 'jpeg' ? Math.max(0.3, quality) : quality
  }, 150);

  // Current template
  const currentTemplate = useMemo(
    () => QR_TEMPLATES.find(t => t.id === selectedTemplate) || QR_TEMPLATES[0],
    [selectedTemplate]
  );

  // Format text based on selected template
  const formatTextForQR = useCallback((text: string, templateId: string) => {
    const template = QR_TEMPLATES.find(t => t.id === templateId);
    return template ? template.format(text) : text;
  }, []);

  // Generate QR code with logo overlay
  const generateQRWithLogo = useCallback(async (qrDataUrl: string, logoDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const qrImg = new window.Image();
      
      qrImg.onload = () => {
        canvas.width = qrImg.width;
        canvas.height = qrImg.height;
        
        // Draw QR code
        ctx.drawImage(qrImg, 0, 0);
        
        // Load and draw logo
        const logoImg = new window.Image();
        logoImg.onload = () => {
          const logoSizePx = qrImg.width * logoSize;
          const logoX = (qrImg.width - logoSizePx) / 2;
          const logoY = (qrImg.height - logoSizePx) / 2;
          
          // Create a white background circle/square for logo
          ctx.fillStyle = 'white';
          ctx.fillRect(logoX - 5, logoY - 5, logoSizePx + 10, logoSizePx + 10);
          
          // Apply border radius if specified
          if (logoBorderRadius > 0) {
            ctx.save();
            const radius = (logoSizePx * logoBorderRadius) / 100;
            ctx.beginPath();
            ctx.roundRect(logoX, logoY, logoSizePx, logoSizePx, radius);
            ctx.clip();
          }
          
          // Draw logo
          ctx.drawImage(logoImg, logoX, logoY, logoSizePx, logoSizePx);
          
          if (logoBorderRadius > 0) {
            ctx.restore();
          }
          
          resolve(canvas.toDataURL('image/png', 0.92));
        };
        
        logoImg.src = logoDataUrl;
      };
      
      qrImg.src = qrDataUrl;
    });
  }, [logoSize, logoBorderRadius]);

  // Live preview generation with error handling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const generateLivePreview = async () => {
      if (!debouncedInputText.trim()) {
        setLivePreviewUrl('');
        return;
      }

      setIsLiveGenerating(true);
      
      try {
        // Import QR code library dynamically
        const QR = await import('qrcode');
        const formattedText = formatTextForQR(debouncedInputText, selectedTemplate);
        
        let url: string;
        if (outputFormat === 'svg') {
          const svgString = await QR.toString(formattedText, {
            ...debouncedOptions,
            type: 'svg',
          });
          url = `data:image/svg+xml;base64,${btoa(svgString)}`;
        } else {
          url = await QR.toDataURL(formattedText, {
            ...debouncedOptions,
            type: outputFormat === 'jpeg' ? 'image/jpeg' as const : 'image/png' as const
          });
        }
        // If logo is provided, embed it into the live preview
        if (logoImage && outputFormat !== 'svg') {
          try {
            url = await generateQRWithLogo(url, logoImage);
          } catch (error) {
            console.warn('Failed to embed logo in preview:', error);
          }
        }
        
        setLivePreviewUrl(url);
        
        // Track preview performance
        analytics.trackPreviewTime(performance.now(), {
          size,
          format: outputFormat,
          contentLength: formattedText.length,
          template: selectedTemplate
        });
      } catch (error) {
        console.error('Live preview generation error:', error);
        setLivePreviewUrl('');
        reportError(createQRError(QRErrorType.GENERATION_FAILED, 'Live preview failed', { 
          text: debouncedInputText,
          template: selectedTemplate 
        }));
      } finally {
        setIsLiveGenerating(false);
      }
    };

    timeoutId = setTimeout(generateLivePreview, 100);
    
    return () => clearTimeout(timeoutId);
  }, [debouncedInputText, debouncedOptions, outputFormat, selectedTemplate, logoImage, formatTextForQR, analytics, reportError, size, logoSize, logoBorderRadius]);

  // Generate QR Code with comprehensive error handling
  const generateQRCode = useCallback(async () => {
    if (!inputText.trim()) {
      showWarningToast('Please enter some content');
      return;
    }

    setIsGenerating(true);
    const startTime = performance.now();
    
    try {
      // Import QR code library dynamically
      const QR = await import('qrcode');
      const formattedText = formatTextForQR(inputText, selectedTemplate);
      
      let url = livePreviewUrl;
      if (!url) {
        if (outputFormat === 'svg') {
          const svgString = await QR.toString(formattedText, { 
            errorCorrectionLevel, 
            margin, 
            color: { dark: foregroundColor, light: backgroundColor }, 
            width: size, 
            type: 'svg' 
          });
          url = `data:image/svg+xml;base64,${btoa(svgString)}`;
        } else {
          url = await QR.toDataURL(formattedText, {
            errorCorrectionLevel, 
            margin, 
            color: { dark: foregroundColor, light: backgroundColor }, 
            width: size,
            type: outputFormat === 'jpeg' ? 'image/jpeg' as const : 'image/png' as const,
            ...(outputFormat === 'jpeg' && { quality })
          });
        }
      }
      
      // If logo is provided, embed it into the QR code
      if (logoImage) {
        try {
          url = await generateQRWithLogo(url, logoImage);
        } catch (error) {
          console.warn('Failed to embed logo, using QR without logo:', error);
        }
      }
      
      setQrCodeUrl(url);
      
      // Generate canvas for downloads
      if (canvasRef.current) {
        await QR.toCanvas(canvasRef.current, formattedText, {
          errorCorrectionLevel, 
          margin, 
          color: { dark: foregroundColor, light: backgroundColor }, 
          width: size
        });
        
        // If logo exists, also embed it in canvas
        if (logoImage) {
          try {
            const canvasDataUrl = canvasRef.current.toDataURL('image/png', quality);
            const logoEmbeddedUrl = await generateQRWithLogo(canvasDataUrl, logoImage);
            
            // Update canvas with logo-embedded version
            const img = new window.Image();
            img.onload = () => {
              const ctx = canvasRef.current?.getContext('2d');
              if (ctx && canvasRef.current) {
                canvasRef.current.width = img.width;
                canvasRef.current.height = img.height;
                ctx.drawImage(img, 0, 0);
              }
            };
            img.src = logoEmbeddedUrl;
          } catch (error) {
            console.warn('Failed to embed logo in canvas:', error);
          }
        }
      }

      // Save to history
      const savedCode: SavedQRCode = {
        id: Date.now().toString(),
        content: formattedText,
        template: selectedTemplate,
        options: { errorCorrectionLevel, margin, color: { dark: foregroundColor, light: backgroundColor }, width: size },
        dataUrl: url,
        timestamp: Date.now(),
        favorite: false
      };
      
      setSavedCodes(prev => [savedCode, ...prev.slice(0, 19)]);
      
      // Update recent templates
      setRecentTemplates(prev => {
        const updated = [selectedTemplate, ...prev.filter(t => t !== selectedTemplate)];
        return updated.slice(0, 5);
      });

      // Track analytics
      const generationTime = performance.now() - startTime;
      analytics.trackGeneration({
        template: selectedTemplate,
        format: outputFormat,
        size,
        errorCorrection: errorCorrectionLevel,
        contentLength: formattedText.length,
        generationTime
      });

      setIsSheetOpen(true);
      showSuccessToast('QR Code generated successfully!');
    } catch (error) {
      console.error('QR generation error:', error);
      const qrError = createQRError(QRErrorType.GENERATION_FAILED, 'Failed to generate QR code', {
        text: inputText,
        template: selectedTemplate,
        settings: { size, format: outputFormat }
      });
      reportError(qrError);
      showErrorToast('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  }, [inputText, selectedTemplate, livePreviewUrl, outputFormat, errorCorrectionLevel, margin, foregroundColor, backgroundColor, size, quality, logoImage, formatTextForQR, setSavedCodes, setRecentTemplates, analytics, reportError, logoSize, logoBorderRadius]);

  // Download functions with error handling
  const downloadQRCode = useCallback(async () => {
    if (!qrCodeUrl) return;
    
    try {
      const link = downloadLinkRef.current || document.createElement('a');
      link.download = `qr-code-${Date.now()}.${outputFormat}`;
      link.href = qrCodeUrl;
      
      if (!downloadLinkRef.current) {
        document.body.appendChild(link);
      }
      
      link.click();
      
      if (!downloadLinkRef.current) {
        document.body.removeChild(link);
      }
      
      analytics.trackDownload(outputFormat);
      showSuccessToast(`QR code downloaded as ${outputFormat.toUpperCase()}`);
    } catch (error) {
      const downloadError = createQRError(QRErrorType.DOWNLOAD_FAILED, 'Download failed', { format: outputFormat });
      reportError(downloadError);
      showErrorToast('Failed to download QR code');
    }
  }, [qrCodeUrl, outputFormat, analytics, reportError]);

  // Copy to clipboard with error handling
  const copyToClipboard = useCallback(async () => {
    if (!qrCodeUrl) return;
    
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      analytics.trackCopy();
      showSuccessToast('QR code copied to clipboard');
    } catch (error) {
      const copyError = createQRError(QRErrorType.COPY_FAILED, 'Copy failed', { url: qrCodeUrl });
      reportError(copyError);
      showErrorToast('Failed to copy QR code');
    }
  }, [qrCodeUrl, analytics, reportError]);

  // Share functionality with error handling
  const shareQRCode = useCallback(async () => {
    if (!qrCodeUrl || !navigator.share) {
      showWarningToast('Share not supported on this device');
      return;
    }

    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], `qr-code.${outputFormat}`, { type: blob.type });
      
      await navigator.share({
        title: 'QR Code',
        text: `QR Code for: ${inputText.substring(0, 50)}${inputText.length > 50 ? '...' : ''}`,
        files: [file],
      });
      
      analytics.trackShare();
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        const shareError = createQRError(QRErrorType.SHARE_FAILED, 'Share failed', { format: outputFormat });
        reportError(shareError);
        showErrorToast('Failed to share QR code');
      }
    }
  }, [qrCodeUrl, inputText, outputFormat, analytics, reportError]);

  // Template selection
  const selectTemplate = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
    analytics.trackTemplateChange(templateId);
    const template = QR_TEMPLATES.find(t => t.id === templateId);
    if (template && !inputText.trim()) {
      setInputText(template.placeholder);
    }
  }, [inputText, analytics]);
  
  // Scanner Success Handler
  const handleScanSuccess = useCallback((data: string) => {
    setInputText(data);
    setIsScannerOpen(false);
  }, []);

  // Image upload handler
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      showErrorToast('Please select a valid image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoImage(result);
      showSuccessToast('Logo uploaded successfully!');
    };
    reader.onerror = () => {
      showErrorToast('Failed to upload image');
    };
    reader.readAsDataURL(file);
  }, []);

  // Remove logo
  const removeLogo = useCallback(() => {
    setLogoImage(null);
    showSuccessToast('Logo removed');
  }, []);


  // Mobile template selector
  const MobileTemplateSelector = () => (
    <div className="flex gap-2 overflow-x-auto pb-3 px-1">
      {QR_TEMPLATES.map((template) => {
        const IconComponent = template.icon;
        const isSelected = selectedTemplate === template.id;
        return (
          <button
            key={template.id}
            onClick={() => selectTemplate(template.id)}
            className={`flex-shrink-0 p-3 rounded-lg text-center min-w-16 border ${
              isSelected
                ? 'bg-blue-500 border-blue-600 text-white'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex justify-center mb-1">
              <IconComponent className={`w-5 h-5 ${
                isSelected ? 'text-white' : 'text-gray-600'
              }`} />
            </div>
            <div className={`text-xs ${
              isSelected ? 'text-white' : 'text-gray-700'
            }`}>
              {template.shortName}
            </div>
          </button>
        );
      })}
    </div>
  );

  // Desktop template selector
  const DesktopTemplateSelector = () => (
    <div className="grid grid-cols-3 gap-3">
      {QR_TEMPLATES.map((template) => {
        const IconComponent = template.icon;
        const isSelected = selectedTemplate === template.id;
        return (
          <button
            key={template.id}
            onClick={() => selectTemplate(template.id)}
            className={`p-4 rounded-lg border text-center ${
              isSelected
                ? 'bg-blue-500 border-blue-600 text-white'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex justify-center mb-2">
              <IconComponent className={`w-6 h-6 ${
                isSelected ? 'text-white' : 'text-gray-600'
              }`} />
            </div>
            <div className={`text-sm ${
              isSelected ? 'text-white' : 'text-gray-700'
            }`}>
              {template.name}
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className={`container mx-auto ${isMobile ? 'px-0 py-0' : 'px-4 py-4 sm:py-8'} max-w-7xl`}>
        
        {/* Desktop Header Only */}
        {!isMobile && (
          /* Desktop Header */
          <div className="mb-8">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-2xl mb-4">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                QR Code Generator
              </h1>
              <p className="text-gray-600 max-w-lg mx-auto">
                Create customizable QR codes with instant preview
              </p>
            </div>

            {/* Navigation Bar */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center gap-4 bg-white rounded-lg p-3 border shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsHistoryOpen(true)}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  <History className="w-4 h-4" />
                  <span>History</span>
                  <Badge variant="outline" className="ml-1">
                    {savedCodes.length}
                  </Badge>
                </Button>
                <div className="w-px h-5 bg-gray-300"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
                <div className="w-px h-5 bg-gray-300"></div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Camera className="w-4 h-4" />
                  <span>Scan QR</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`${isMobile ? 'p-4' : 'grid gap-8 lg:grid-cols-2'}`}>
          {isMobile ? (
            /* Mobile Single Card Design */
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <CardContent className="p-6 space-y-6">
                {/* Content Input Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TextCursor className="w-5 h-5 text-gray-600" />
                    <Label className="text-lg font-semibold text-gray-900">
                      Enter Your Content
                    </Label>
                  </div>
                  <div className="relative">
                    <Textarea
                      placeholder="Paste your URL, type a message, or enter any text to generate a QR code..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      rows={5}
                      className="resize-none border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-4 text-base w-full"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      {inputText.length} characters
                    </div>
                  </div>
                </div>

                {/* Customize Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-600" />
                    <Label className="text-lg font-semibold text-gray-900">
                      Customize Settings
                    </Label>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {/* Error Correction */}
                    <div className="space-y-2">
                      <div className="flex justify-center">
                        <Shield className="w-5 h-5 text-gray-600" />
                      </div>
                      <Select value={errorCorrectionLevel} onValueChange={(v: 'L' | 'M' | 'Q' | 'H') => setErrorCorrectionLevel(v)}>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L">Low</SelectItem>
                          <SelectItem value="M">Medium</SelectItem>
                          <SelectItem value="Q">Quartile</SelectItem>
                          <SelectItem value="H">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Size */}
                    <div className="space-y-2">
                      <div className="flex justify-center">
                        <Monitor className="w-5 h-5 text-gray-600" />
                      </div>
                      <Select value={size.toString()} onValueChange={(v) => setSize(parseInt(v))}>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="256">Medium...</SelectItem>
                          <SelectItem value="128">Small</SelectItem>
                          <SelectItem value="512">Large</SelectItem>
                          <SelectItem value="1024">XL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Format */}
                    <div className="space-y-2">
                      <div className="flex justify-center">
                        <FileImage className="w-5 h-5 text-gray-600" />
                      </div>
                      <Select value={outputFormat} onValueChange={(v: 'png' | 'svg' | 'jpeg') => setOutputFormat(v)}>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="png">PNG...</SelectItem>
                          <SelectItem value="svg">SVG</SelectItem>
                          <SelectItem value="jpeg">JPEG</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Colors Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-gray-600" />
                    <Label className="text-lg font-semibold text-gray-900">
                      Colors
                    </Label>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Color Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-center">
                          <Hash className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-10 rounded-lg border-2 border-gray-300 overflow-hidden">
                            <Input
                              type="color"
                              value={foregroundColor}
                              onChange={(e) => setForegroundColor(e.target.value)}
                              className="w-full h-full border-0 p-0 cursor-pointer"
                            />
                          </div>
                          <div className="w-12 h-10 bg-black rounded-lg"></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-center">
                          <Hash className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-10 rounded-lg border-2 border-gray-300 overflow-hidden">
                            <Input
                              type="color"
                              value={backgroundColor}
                              onChange={(e) => setBackgroundColor(e.target.value)}
                              className="w-full h-full border-0 p-0 cursor-pointer"
                            />
                          </div>
                          <div className="w-12 h-10 bg-white rounded-lg border border-gray-300"></div>
                        </div>
                      </div>
                    </div>

                    {/* Color Palette */}
                    <div className="flex gap-2 flex-wrap">
                      {COLOR_PRESETS.foreground.map((color, index) => (
                        <button
                          key={color}
                          onClick={() => setForegroundColor(color)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            foregroundColor === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Logo Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-gray-600" />
                    <Label className="text-lg font-semibold text-gray-900">
                      Add Logo
                    </Label>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Logo Upload */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-center">
                          <Plus className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="w-full h-10 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-400 transition-colors">
                            <span className="text-xs text-gray-500">Upload</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-center">
                          <X className="w-4 h-4 text-gray-600" />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={removeLogo}
                          disabled={!logoImage}
                          className="w-full h-10 text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    {/* Logo Preview */}
                    {logoImage && (
                      <div className="flex justify-center">
                        <div className="relative w-16 h-16 rounded-lg border-2 border-gray-200 overflow-hidden">
                          <Image
                            src={logoImage}
                            alt="Logo preview"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}

                    {/* Logo Settings */}
                    {logoImage && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <Crop className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="space-y-1">
                            <Slider
                              value={[logoSize * 100]}
                              onValueChange={([v]) => setLogoSize(v / 100)}
                              min={10}
                              max={40}
                              step={5}
                              className="py-2"
                            />
                            <div className="text-center text-xs text-gray-500">
                              Size: {Math.round(logoSize * 100)}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-center">
                            <RotateCcw className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="space-y-1">
                            <Slider
                              value={[logoBorderRadius]}
                              onValueChange={([v]) => setLogoBorderRadius(v)}
                              min={0}
                              max={50}
                              step={5}
                              className="py-2"
                            />
                            <div className="text-center text-xs text-gray-500">
                              Radius: {logoBorderRadius}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1 h-12">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" size="icon" className="h-12 w-12">
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-12 w-12">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={generateQRCode}
                  disabled={isGenerating || !inputText.trim()}
                  className="w-full h-14 text-base font-semibold bg-gray-800 hover:bg-gray-900 text-white rounded-xl"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5" />
                      Generate QR Code
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Desktop Layout */
            <div className="contents">
              {/* Input Section */}
              <Card className="bg-white border rounded-lg shadow">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                    <Edit className="w-5 h-5 text-gray-600" />
                    Content Input
                  </CardTitle>
                  <p className="text-sm text-gray-600">Enter your content</p>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Template Selection - Desktop Only */}
                  <div className="space-y-3">
                    <div className="text-center">
                      <Label className="text-base font-medium text-gray-700">Choose Content Type</Label>
                    </div>
                    <DesktopTemplateSelector />
                  </div>

                  {/* Text Input */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="input-text" className="text-sm font-medium text-gray-700">
                        Your Content
                      </Label>
                      <span className="text-xs text-gray-500">{inputText.length} chars</span>
                    </div>
                    <div className="relative">
                      <Textarea
                        id="input-text"
                        placeholder={currentTemplate.placeholder}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        rows={5}
                        className="resize-none border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-3"
                      />
                    </div>
                  </div>

                  {/* Quick Settings */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Quick Settings</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Size</Label>
                        <Select value={size.toString()} onValueChange={(v) => setSize(parseInt(v))}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="128">Small (128px)</SelectItem>
                            <SelectItem value="256">Medium (256px)</SelectItem>
                            <SelectItem value="512">Large (512px)</SelectItem>
                            <SelectItem value="1024">XL (1024px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Format</Label>
                        <Select value={outputFormat} onValueChange={(v: 'png' | 'svg' | 'jpeg') => setOutputFormat(v)}>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="png">PNG</SelectItem>
                            <SelectItem value="svg">SVG</SelectItem>
                            <SelectItem value="jpeg">JPEG</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Custom QR Design - Desktop */}
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium flex items-center gap-2 text-gray-700">
                        <Wand2 className="w-4 h-4" />
                        Custom QR Design
                      </Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowCustomDesign(!showCustomDesign)}
                        className="h-8 px-2"
                      >
                        {showCustomDesign ? (
                          <Minimize className="w-4 h-4" />
                        ) : (
                          <Maximize className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {showCustomDesign && (
                      <div className="space-y-5 pt-3">
                        {/* Custom design content for desktop */}
                      </div>
                    )}
                  </div>
                  
                  {/* Generate Button */}
                  <div className="pt-3">
                    <Button
                      onClick={generateQRCode}
                      disabled={isGenerating || !inputText.trim()}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      {isGenerating ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4" />
                          <span>Generate QR Code</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Preview Section - Desktop */}
              <Card className="bg-white border rounded-lg shadow">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                    <Sparkles className="w-5 h-5 text-gray-600" />
                    Live Preview
                    {isLiveGenerating && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600 ml-2" />
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-600">Preview updates as you type</p>
                </CardHeader>
                <CardContent className="p-6">
                  {livePreviewUrl ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="relative">
                          <div className="p-4 bg-white rounded-lg border shadow-sm">
                            <Image
                              src={livePreviewUrl}
                              alt="Live QR Code Preview"
                              width={280}
                              height={280}
                              className="w-full h-auto rounded"
                              unoptimized
                            />
                          </div>
                          {livePreviewUrl && !isLiveGenerating && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (livePreviewUrl) {
                              const link = document.createElement('a');
                              link.download = `preview.${outputFormat}`;
                              link.href = livePreviewUrl;
                              link.click();
                            }
                          }}
                          disabled={!livePreviewUrl}
                          className="h-10"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          <span>Download</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (livePreviewUrl) {
                              try {
                                const response = await fetch(livePreviewUrl);
                                const blob = await response.blob();
                                await navigator.clipboard.write([
                                  new ClipboardItem({ [blob.type]: blob })
                                ]);
                                showSuccessToast('Preview copied!');
                              } catch {
                                showErrorToast('Copy failed');
                              }
                            }
                          }}
                          disabled={!livePreviewUrl}
                          className="h-10"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          <span>Copy</span>
                        </Button>
                      </div>

                      {/* Preview Info */}
                      <div className="bg-gray-50 rounded-lg p-3 border text-center">
                        <p className="text-sm text-gray-600">
                          {outputFormat.toUpperCase()} â€¢ {size}x{size}px
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Generate for full quality
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                      <div className="p-4 bg-gray-100 rounded-lg border mb-4">
                        <QrCode className="w-12 h-12 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-base font-medium text-gray-600 mb-1">Ready for Preview</h3>
                        <p className="text-sm text-gray-500">
                          Enter content to see live preview
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas and download link */}
      <canvas ref={canvasRef} className="hidden" />
      <a ref={downloadLinkRef} className="hidden" />

      {/* QR Code Result Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] sm:h-[80vh]">
          <SheetHeader>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <SheetTitle className="text-center flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              QR Code Generated!
            </SheetTitle>
            <SheetDescription className="text-center">
              Your QR code is ready to use
            </SheetDescription>
          </SheetHeader>

          {qrCodeUrl && (
            <div className="mt-6 space-y-6">
              <div className="flex justify-center">
                <div className="p-6 bg-white rounded-lg border">
                  <Image
                    src={qrCodeUrl}
                    alt="Generated QR Code"
                    width={isMobile ? 250 : 300}
                    height={isMobile ? 250 : 300}
                    className="w-full max-w-xs h-auto"
                    unoptimized
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4">
                <Button onClick={downloadQRCode} size="sm" className="h-11">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button onClick={copyToClipboard} variant="outline" size="sm" className="h-11">
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
                {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                  <Button onClick={shareQRCode} variant="outline" size="sm" className="h-11">
                    <Share className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    if (canvasRef.current) {
                      const link = document.createElement('a');
                      link.download = `qr-code-${Date.now()}.png`;
                      link.href = canvasRef.current.toDataURL('image/png', quality);
                      link.click();
                    }
                  }}
                  variant="outline" 
                  size="sm" 
                  className="h-11"
                >
                  <FileImage className="w-4 h-4 mr-1" />
                  Canvas
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              QR Code History
            </DialogTitle>
            <DialogDescription>
              Your previously generated QR codes
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 max-h-[60vh]">
            {savedCodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedCodes.map((code) => (
                  <Card key={code.id} className="relative">
                    <CardContent className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSavedCodes(prev => prev.filter(c => c.id !== code.id));
                          showSuccessToast('Deleted from history');
                        }}
                        className="absolute top-2 right-2 h-6 w-6 p-0 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSavedCodes(prev => 
                            prev.map(c => c.id === code.id ? {...c, favorite: !c.favorite} : c)
                          );
                          showSuccessToast(code.favorite ? 'Removed from favorites' : 'Added to favorites');
                        }}
                        className="absolute top-2 left-2 h-6 w-6 p-0 text-yellow-400 hover:text-yellow-600"
                      >
                        <Star className={`w-4 h-4 ${code.favorite ? 'fill-yellow-400' : ''}`} />
                      </Button>

                      <div className="flex justify-center mb-3 mt-4">
                        <Image
                          src={code.dataUrl}
                          alt="QR Code"
                          width={80}
                          height={80}
                          className="rounded border"
                          unoptimized
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm truncate" title={code.content}>
                          {code.content}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <Badge variant="outline" className="text-xs">
                            {QR_TEMPLATES.find(t => t.id === code.template)?.name || 'Text'}
                          </Badge>
                          <span>
                            {new Date(code.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInputText(code.content);
                            setSelectedTemplate(code.template);
                            setErrorCorrectionLevel(code.options.errorCorrectionLevel);
                            setSize(code.options.width);
                            setMargin(code.options.margin);
                            setForegroundColor(code.options.color.dark);
                            setBackgroundColor(code.options.color.light);
                            setIsHistoryOpen(false);
                            showSuccessToast('Settings loaded');
                          }}
                          className="flex-1"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Load
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.download = `qr-code-${code.id}.png`;
                            link.href = code.dataUrl;
                            link.click();
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <History className="w-16 h-16 mx-auto mb-4" />
                <p>No QR codes generated yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Configure your preferences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label>Clear all history</Label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSavedCodes([]);
                  showSuccessToast('History cleared');
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label>Statistics</Label>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Total generated: {savedCodes.length}</div>
                <div>Recent templates: {recentTemplates.slice(0, 3).join(', ')}</div>
                <div>Favorites: {savedCodes.filter(c => c.favorite).length}</div>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <Label className="text-sm">Auto-save to history</Label>
                </div>
                <Switch checked={true} disabled />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import from QR Scanner */}
      <QRScannerSheet 
        open={isScannerOpen} 
        onOpenChange={setIsScannerOpen} 
        onScanSuccess={handleScanSuccess} 
      />
    </div>
  );
}

// Default export for dynamic imports
export default QRCodeMobileOptimized;
