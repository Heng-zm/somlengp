'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect, Suspense , memo} from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { 
  Download, Copy, QrCode, Share, Settings, Palette, 
  Monitor, Smartphone, Image as ImageIcon, FileImage, Camera,
  Zap, Shield, Lock, Wrench, Eye, RotateCcw,
  Sparkles, CheckCircle, Loader2, Type, Hash, History,
  Star, Bookmark, Grid, Layers, Maximize, Minimize,
  Save, Trash2, Edit3, Plus, X, Check, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/lib/toast-utils';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';

// QR code library - imported directly since it's not a React component
import QRCode from 'qrcode';

// QR Code templates
const QR_TEMPLATES = [
  { id: 'url', name: 'Website URL', icon: '🌐', placeholder: 'https://example.com', format: (text: string) => text.startsWith('http') ? text : `https://${text}` },
  { id: 'email', name: 'Email', icon: '📧', placeholder: 'mailto:email@domain.com', format: (text: string) => text.startsWith('mailto:') ? text : `mailto:${text}` },
  { id: 'phone', name: 'Phone', icon: '📞', placeholder: 'tel:+1234567890', format: (text: string) => text.startsWith('tel:') ? text : `tel:${text}` },
  { id: 'sms', name: 'SMS', icon: '💬', placeholder: 'sms:+1234567890:Hello!', format: (text: string) => text.includes('sms:') ? text : `sms:${text}` },
  { id: 'wifi', name: 'WiFi', icon: '📶', placeholder: 'WIFI:T:WPA;S:NetworkName;P:password;;', format: (text: string) => text },
  { id: 'text', name: 'Plain Text', icon: '📝', placeholder: 'Enter any text...', format: (text: string) => text }
];

// Color presets
const COLOR_PRESETS = {
  foreground: ['#000000', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#dc2626', '#ea580c', '#d97706', '#65a30d', '#059669', '#0891b2', '#0284c7', '#2563eb', '#7c3aed', '#c026d3'],
  background: ['#ffffff', '#f8fafc', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#fef2f2', '#fff7ed', '#fffbeb', '#f7fee7', '#ecfdf5', '#f0fdfa', '#f0f9ff', '#eff6ff', '#f3e8ff', '#fae8ff']
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

// Performance monitoring hook
function usePerformanceMonitor(actionName: string) {
  const [metrics, setMetrics] = useState({ duration: 0, timestamp: 0 });
  
  const startTime = useRef<number>(0);
  
  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);
  
  const end = useCallback(() => {
    const duration = performance.now() - startTime.current;
    const timestamp = Date.now();
    setMetrics({ duration, timestamp });
    
    // Log performance metrics for optimization
    if (duration > 100) {
      console.warn(`Performance warning: ${actionName} took ${duration.toFixed(2)}ms`);
    }
  }, [actionName]);
  
  return { start, end, metrics };
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

const OptimizedQRCodeGeneratorComponent = function OptimizedQRCodeGenerator() {
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

  // UI state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [currentTab, setCurrentTab] = useState('generator');

  // Storage and history
  const [savedCodes, setSavedCodes] = useLocalStorage<SavedQRCode[]>('qr-codes-history', []);
  const [favorites, setFavorites] = useLocalStorage<string[]>('qr-codes-favorites', []);
  const [recentTemplates, setRecentTemplates] = useLocalStorage<string[]>('qr-recent-templates', ['text']);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  // Performance monitoring
  const generatePerf = usePerformanceMonitor('QR Generation');
  const livePreviewPerf = usePerformanceMonitor('Live Preview');

  // Debounced values for better performance
  const debouncedInputText = useDebounce(inputText, 150);
  const debouncedOptions = useDebounce({
    errorCorrectionLevel,
    margin,
    color: { dark: foregroundColor, light: backgroundColor },
    width: size,
    quality: outputFormat === 'jpeg' ? Math.max(0.3, quality) : quality
  }, 100);

  // Memoized QR options
  const qrOptions: QRCodeOptions = useMemo(() => ({
    errorCorrectionLevel,
    margin,
    color: {
      dark: foregroundColor,
      light: backgroundColor,
    },
    width: size,
    ...(outputFormat !== 'svg' && { quality })
  }), [errorCorrectionLevel, margin, foregroundColor, backgroundColor, size, outputFormat, quality]);

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

  // Live preview generation
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const generateLivePreview = async () => {
      if (!debouncedInputText.trim()) {
        setLivePreviewUrl('');
        return;
      }

      setIsLiveGenerating(true);
      livePreviewPerf.start();
      
      try {
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
        setLivePreviewUrl(url);
      } catch (error) {
        console.error('Live preview generation error:', error);
        setLivePreviewUrl('');
      } finally {
        setIsLiveGenerating(false);
        livePreviewPerf.end();
      }
    };

    // Debounce the live preview generation
    timeoutId = setTimeout(generateLivePreview, 100);
    
    return () => clearTimeout(timeoutId);
  }, [debouncedInputText, debouncedOptions, outputFormat, selectedTemplate, formatTextForQR, livePreviewPerf]);

  // Generate QR Code
  const generateQRCode = useCallback(async () => {
    if (!inputText.trim()) {
      showWarningToast('Please enter some content');
      return;
    }

    setIsGenerating(true);
    generatePerf.start();
    
    try {
      const QR = await import('qrcode');
      const formattedText = formatTextForQR(inputText, selectedTemplate);
      
      let url = livePreviewUrl;
      if (!url) {
        if (outputFormat === 'svg') {
          const svgString = await QR.toString(formattedText, { ...qrOptions, type: 'svg' });
          url = `data:image/svg+xml;base64,${btoa(svgString)}`;
        } else {
          url = await QR.toDataURL(formattedText, {
            ...qrOptions,
            type: outputFormat === 'jpeg' ? 'image/jpeg' as const : 'image/png' as const
          });
        }
      }
      
      setQrCodeUrl(url);
      
      // Generate canvas for downloads
      if (canvasRef.current) {
        await QR.toCanvas(canvasRef.current, formattedText, qrOptions);
      }

      // Save to history
      const savedCode: SavedQRCode = {
        id: Date.now().toString(),
        content: formattedText,
        template: selectedTemplate,
        options: qrOptions,
        dataUrl: url,
        timestamp: Date.now(),
        favorite: false
      };
      
      setSavedCodes(prev => [savedCode, ...prev.slice(0, 19)]); // Keep last 20
      
      // Update recent templates
      setRecentTemplates(prev => {
        const updated = [selectedTemplate, ...prev.filter(t => t !== selectedTemplate)];
        return updated.slice(0, 5);
      });

      setIsSheetOpen(true);
      showSuccessToast('QR Code generated successfully!');
    } catch (error) {
      console.error('QR generation error:', error);
      showErrorToast('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
      generatePerf.end();
    }
  }, [inputText, selectedTemplate, livePreviewUrl, outputFormat, qrOptions, formatTextForQR, setSavedCodes, setRecentTemplates, generatePerf]);

  // Download functions
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
      
      showSuccessToast(`QR code downloaded as ${outputFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Download error:', error);
      showErrorToast('Failed to download QR code');
    }
  }, [qrCodeUrl, outputFormat]);

  const downloadFromCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    
    try {
      const link = document.createElement('a');
      link.download = `qr-code-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL('image/png', quality);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccessToast('QR code downloaded from canvas');
    } catch (error) {
      console.error('Canvas download error:', error);
      showErrorToast('Failed to download from canvas');
    }
  }, [quality]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    if (!qrCodeUrl) return;
    
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      showSuccessToast('QR code copied to clipboard');
    } catch (error) {
      console.error('Copy error:', error);
      showErrorToast('Failed to copy QR code');
    }
  }, [qrCodeUrl]);

  // Share functionality
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
    } catch (error) {
      console.error('Share error:', error);
      if (error instanceof Error && error.name !== 'AbortError') {
        showErrorToast('Failed to share QR code');
      }
    }
  }, [qrCodeUrl, inputText, outputFormat]);

  // Template selection
  const selectTemplate = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
    const template = QR_TEMPLATES.find(t => t.id === templateId);
    if (template && !inputText.trim()) {
      setInputText(template.placeholder);
    }
  }, [inputText]);

  // Color presets
  const applyColorPreset = useCallback((type: 'foreground' | 'background', color: string) => {
    if (type === 'foreground') {
      setForegroundColor(color);
    } else {
      setBackgroundColor(color);
    }
  }, []);

  // Reset functions
  const resetColors = useCallback(() => {
    setForegroundColor('#000000');
    setBackgroundColor('#ffffff');
  }, []);

  const resetSettings = useCallback(() => {
    setErrorCorrectionLevel('M');
    setSize(256);
    setMargin(4);
    setOutputFormat('png');
    setQuality(0.92);
    resetColors();
  }, [resetColors]);

  // History management
  const toggleFavorite = useCallback((id: string) => {
    setSavedCodes(prev => prev.map(code => 
      code.id === id ? { ...code, favorite: !code.favorite } : code
    ));
    setFavorites(prev => {
      const isFavorite = prev.includes(id);
      return isFavorite 
        ? prev.filter(fId => fId !== id)
        : [...prev, id];
    });
  }, [setSavedCodes, setFavorites]);

  const deleteFromHistory = useCallback((id: string) => {
    setSavedCodes(prev => prev.filter(code => code.id !== id));
    setFavorites(prev => prev.filter(fId => fId !== id));
    showSuccessToast('QR code deleted from history');
  }, [setSavedCodes, setFavorites]);

  const loadFromHistory = useCallback((code: SavedQRCode) => {
    setInputText(code.content);
    setSelectedTemplate(code.template);
    setErrorCorrectionLevel(code.options.errorCorrectionLevel);
    setSize(code.options.width);
    setMargin(code.options.margin);
    setForegroundColor(code.options.color.dark);
    setBackgroundColor(code.options.color.light);
    setIsHistoryOpen(false);
    showSuccessToast('Settings loaded from history');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            generateQRCode();
            break;
          case 's':
            e.preventDefault();
            if (qrCodeUrl) downloadQRCode();
            break;
          case 'c':
            if (e.shiftKey) {
              e.preventDefault();
              if (qrCodeUrl) copyToClipboard();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generateQRCode, downloadQRCode, copyToClipboard, qrCodeUrl]);

  // Performance stats
  const performanceStats = useMemo(() => ({
    avgGenerationTime: generatePerf.metrics.duration,
    avgPreviewTime: livePreviewPerf.metrics.duration,
    totalCodes: savedCodes.length,
    favorites: favorites.length
  }), [generatePerf.metrics, livePreviewPerf.metrics, savedCodes.length, favorites.length]);

  return (
    <FeaturePageLayout title="Advanced QR Code Generator">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          
          {/* Header with tabs */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  QR Code Generator
                </h1>
                <p className="text-gray-600 mt-2">Create, customize, and manage QR codes with advanced features</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsHistoryOpen(true)}
                  className="hidden sm:flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  History ({savedCodes.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSettingsOpen(true)}
                  className="hidden sm:flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </div>
            </div>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                <TabsTrigger value="generator">Generator</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="batch" className="hidden lg:flex">Batch</TabsTrigger>
                <TabsTrigger value="analytics" className="hidden lg:flex">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="generator" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Input Section */}
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Type className="w-5 h-5" />
                        Content Input
                      </CardTitle>
                      <CardDescription>
                        Enter your content and customize the QR code settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Template Selection */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Template Type</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {QR_TEMPLATES.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => selectTemplate(template.id)}
                              className={`p-3 rounded-xl border-2 transition-all text-center hover:shadow-md ${
                                selectedTemplate === template.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-xl mb-1">{template.icon}</div>
                              <div className="text-xs font-medium text-gray-700">{template.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Text Input */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="input-text">Content</Label>
                          <Badge variant="outline">{inputText.length} chars</Badge>
                        </div>
                        <Textarea
                          id="input-text"
                          placeholder={currentTemplate.placeholder}
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          rows={4}
                          className="resize-none"
                        />
                      </div>

                      {/* Quick Settings */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Size</Label>
                          <Select value={size.toString()} onValueChange={(v) => setSize(parseInt(v))}>
                            <SelectTrigger>
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
                          <Label>Format</Label>
                          <Select value={outputFormat} onValueChange={(v: 'png' | 'svg' | 'jpeg') => setOutputFormat(v)}>
                            <SelectTrigger>
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

                      {/* Advanced Settings Toggle */}
                      <div className="flex items-center justify-between">
                        <Label htmlFor="advanced-settings">Advanced Settings</Label>
                        <Switch
                          id="advanced-settings"
                          checked={showAdvancedSettings}
                          onCheckedChange={setShowAdvancedSettings}
                        />
                      </div>

                      {/* Advanced Settings */}
                      {showAdvancedSettings && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Error Correction</Label>
                              <Select value={errorCorrectionLevel} onValueChange={(v: 'L' | 'M' | 'Q' | 'H') => setErrorCorrectionLevel(v)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="L">Low (7%)</SelectItem>
                                  <SelectItem value="M">Medium (15%)</SelectItem>
                                  <SelectItem value="Q">Quartile (25%)</SelectItem>
                                  <SelectItem value="H">High (30%)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Margin</Label>
                              <div className="px-2">
                                <Slider
                                  value={[margin]}
                                  onValueChange={([v]) => setMargin(v)}
                                  min={0}
                                  max={10}
                                  step={1}
                                />
                                <div className="text-xs text-gray-500 mt-1">{margin}px</div>
                              </div>
                            </div>
                          </div>

                          {outputFormat !== 'svg' && (
                            <div className="space-y-2">
                              <Label>Quality ({Math.round(quality * 100)}%)</Label>
                              <Slider
                                value={[quality]}
                                onValueChange={([v]) => setQuality(v)}
                                min={0.1}
                                max={1}
                                step={0.01}
                              />
                            </div>
                          )}

                          {/* Color Customization */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>Colors</Label>
                              <Button variant="ghost" size="sm" onClick={resetColors}>
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Reset
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Foreground</Label>
                                <Input
                                  type="color"
                                  value={foregroundColor}
                                  onChange={(e) => setForegroundColor(e.target.value)}
                                  className="h-10 w-full"
                                />
                                <div className="flex gap-1 flex-wrap">
                                  {COLOR_PRESETS.foreground.slice(0, 8).map((color) => (
                                    <button
                                      key={color}
                                      onClick={() => applyColorPreset('foreground', color)}
                                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Background</Label>
                                <Input
                                  type="color"
                                  value={backgroundColor}
                                  onChange={(e) => setBackgroundColor(e.target.value)}
                                  className="h-10 w-full"
                                />
                                <div className="flex gap-1 flex-wrap">
                                  {COLOR_PRESETS.background.slice(0, 8).map((color) => (
                                    <button
                                      key={color}
                                      onClick={() => applyColorPreset('background', color)}
                                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Generate Button */}
                      <Button
                        onClick={generateQRCode}
                        disabled={isGenerating || !inputText.trim()}
                        className="w-full h-12 text-lg font-semibold"
                        size="lg"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : livePreviewUrl ? (
                          <>
                            <Eye className="w-5 h-5 mr-2" />
                            View Full QR Code
                          </>
                        ) : (
                          <>
                            <QrCode className="w-5 h-5 mr-2" />
                            Generate QR Code
                          </>
                        )}
                      </Button>

                      {/* Keyboard shortcuts */}
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="font-medium">Keyboard Shortcuts:</div>
                        <div>Ctrl/Cmd + Enter: Generate • Ctrl/Cmd + S: Download • Ctrl/Cmd + Shift + C: Copy</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Live Preview Section */}
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Live Preview
                        {isLiveGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                      </CardTitle>
                      <CardDescription>
                        Real-time preview as you type
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {livePreviewUrl ? (
                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <div className="relative">
                              <div className="p-6 bg-white rounded-lg border-2 border-gray-200">
                                <Image
                                  src={livePreviewUrl}
                                  alt="Live QR Code Preview"
                                  width={size > 256 ? 256 : size}
                                  height={size > 256 ? 256 : size}
                                  className="w-full h-auto rounded"
                                  unoptimized
                                />
                              </div>
                              {livePreviewUrl && !isLiveGenerating && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
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
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
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
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                          </div>

                          {/* Preview Info */}
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>Size:</span>
                              <span>{size}×{size}px</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Format:</span>
                              <span>{outputFormat.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Error Correction:</span>
                              <span>{errorCorrectionLevel}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                          <QrCode className="w-16 h-16 mb-4" />
                          <p>Enter content to see live preview</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="templates" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>QR Code Templates</CardTitle>
                    <CardDescription>Pre-configured templates for common QR code types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {QR_TEMPLATES.map((template) => (
                        <div
                          key={template.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedTemplate === template.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                           role="button" tabIndex={0}={() => selectTemplate(template.id)}
                        >
                          <div className="text-3xl mb-2">{template.icon}</div>
                          <h3 className="font-semibold mb-1">{template.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{template.placeholder}</p>
                          {recentTemplates.includes(template.id) && (
                            <Badge variant="outline" className="text-xs">Recent</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="batch" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Batch Generation</CardTitle>
                    <CardDescription>Generate multiple QR codes at once</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-gray-500 py-12">
                      <Grid className="w-16 h-16 mx-auto mb-4" />
                      <p>Batch generation feature coming soon...</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Generated</p>
                          <p className="text-2xl font-bold">{performanceStats.totalCodes}</p>
                        </div>
                        <QrCode className="w-8 h-8 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Favorites</p>
                          <p className="text-2xl font-bold">{performanceStats.favorites}</p>
                        </div>
                        <Star className="w-8 h-8 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Avg Generation</p>
                          <p className="text-2xl font-bold">{Math.round(performanceStats.avgGenerationTime)}ms</p>
                        </div>
                        <Zap className="w-8 h-8 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Avg Preview</p>
                          <p className="text-2xl font-bold">{Math.round(performanceStats.avgPreviewTime)}ms</p>
                        </div>
                        <Eye className="w-8 h-8 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Hidden canvas for downloads */}
        <canvas ref={canvasRef} className="hidden" />
        <a ref={downloadLinkRef} className="hidden" />

        {/* QR Code Result Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="bottom" className="h-[80vh]">
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
                      width={300}
                      height={300}
                      className="w-full max-w-xs h-auto"
                      unoptimized
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button onClick={downloadQRCode} size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button onClick={copyToClipboard} variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Button onClick={downloadFromCanvas} variant="outline" size="sm">
                    <FileImage className="w-4 h-4 mr-1" />
                    Canvas
                  </Button>
                  {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                    <Button onClick={shareQRCode} variant="outline" size="sm">
                      <Share className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* History Dialog */}
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                QR Code History
              </DialogTitle>
              <DialogDescription>
                Manage your previously generated QR codes
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto flex-1">
              {savedCodes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedCodes.map((code) => (
                    <Card key={code.id} className="relative">
                      <CardContent className="p-4">
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(code.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Star className={`w-4 h-4 ${code.favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFromHistory(code.id)}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex justify-center mb-3">
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
                            onClick={() => loadFromHistory(code)}
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
                Configure your QR code generator preferences
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Reset all settings</Label>
                <Button variant="outline" onClick={resetSettings}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Performance Metrics</Label>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Generation: {performanceStats.avgGenerationTime.toFixed(1)}ms avg</div>
                  <div>Preview: {performanceStats.avgPreviewTime.toFixed(1)}ms avg</div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </FeaturePageLayout>
  );
}

export default memo(OptimizedQRCodeGeneratorComponent);