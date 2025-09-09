"use client";

import { useState, useRef } from 'react';
import { Copy, Check, Upload, Download, Trash2, BarChart3, TrendingUp, FileText, AlertCircle, Loader2, Star, Zap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TextStats } from '../utils/text-processors';

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}

export function CopyButton({ text, className, size = 'default' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size={size}
          onClick={copyToClipboard}
          className={cn("h-9 w-9 p-0", className)}
          disabled={!text}
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {copied ? 'Copied!' : 'Copy to clipboard'}
      </TooltipContent>
    </Tooltip>
  );
}

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
  className?: string;
  minHeight?: string;
  showStats?: boolean;
  stats?: TextStats;
  readOnly?: boolean;
  maxFileSize?: number; // in MB
  supportedFormats?: string[];
}

export function TextInputArea({
  value,
  onChange,
  placeholder = "Enter your text here...",
  title = "Input",
  className,
  minHeight = "200px",
  showStats = false,
  stats,
  readOnly = false,
  maxFileSize = 10, // 10MB default
  supportedFormats = ['.txt', '.csv', '.json', '.md', '.log', '.xml', '.html', '.css', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.sql', '.yml', '.yaml', '.toml', '.ini', '.cfg', '.conf', '.properties', '.env']
}: TextInputAreaProps) {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Enhanced file validation
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file size (convert MB to bytes)
    const maxSizeBytes = maxFileSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the maximum limit of ${maxFileSize}MB`
      };
    }

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isTextFile = supportedFormats.includes(fileExtension) || 
                      file.type.startsWith('text/') || 
                      ['application/json', 'application/xml', 'application/javascript'].includes(file.type);
    
    if (!isTextFile) {
      return {
        isValid: false,
        error: `Unsupported file type. Supported formats: ${supportedFormats.join(', ')}`
      };
    }

    return { isValid: true };
  };

  const handleFileUpload = async (file: File) => {
    setUploadStatus('uploading');
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const reader = new FileReader();
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      };

      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          onChange(text);
          setUploadStatus('success');
          setTimeout(() => {
            setUploadStatus('idle');
            setUploadProgress(0);
          }, 2000);
        } else {
          throw new Error('Failed to read file content');
        }
      };

      reader.onerror = () => {
        throw new Error('Failed to read the file. The file might be corrupted.');
      };

      // Read file as text
      reader.readAsText(file, 'UTF-8');
      
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Unknown error occurred');
      setUploadStatus('error');
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadError(null);
        setUploadProgress(0);
      }, 5000);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value to allow uploading the same file again
    event.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      handleFileUpload(file);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const downloadText = () => {
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(' ', '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={cn(
      "w-full bg-gradient-to-br from-white via-gray-50/50 to-gray-100/20 backdrop-blur-md border border-gray-200/40 rounded-2xl",
      "shadow-lg shadow-gray-200/30 hover:shadow-xl hover:shadow-gray-500/10 hover:border-gray-300/40 transition-all duration-300",
      "ring-1 ring-white/60",
      isDragOver && "border-gray-400 bg-gray-50/30 shadow-gray-500/20"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-700 bg-clip-text text-transparent",
            "flex items-center gap-3"
          )}>
            <div className="p-1.5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
            {title}
            {value && (
              <Badge variant="outline" className="text-xs font-medium bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200/60 px-2.5 py-0.5">
                {value.length} chars
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={supportedFormats.join(',')}
                  onChange={handleFileInputChange}
                  className="hidden"
                  id={`file-upload-${title}`}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadStatus === 'uploading'}
                      className={cn(
                        "h-9 w-9 p-0 rounded-xl transition-all duration-300 backdrop-blur-sm ring-1 ring-white/40",
                        uploadStatus === 'success' && "bg-green-50 border-green-300/60 text-green-700 hover:bg-green-100",
                        uploadStatus === 'error' && "bg-red-50 border-red-300/60 text-red-700 hover:bg-red-100",
                        uploadStatus === 'uploading' && "bg-blue-50 border-blue-300/60 text-blue-700",
                        uploadStatus === 'idle' && "bg-white/80 border-slate-200/60 hover:bg-blue-50 hover:border-blue-300/60 hover:text-blue-700 hover:shadow-md hover:shadow-blue-500/10"
                      )}
                    >
                      {uploadStatus === 'uploading' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : uploadStatus === 'success' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : uploadStatus === 'error' ? (
                        <AlertCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p>{uploadStatus === 'uploading' ? 'Uploading...' : uploadStatus === 'success' ? 'Upload successful!' : uploadStatus === 'error' ? 'Upload failed' : 'Upload text files'}</p>
                      {uploadStatus === 'idle' && (
                        <>
                          <p>Max: {maxFileSize}MB</p>
                          <p className="text-slate-400 mt-1">Supported: {supportedFormats.slice(0, 3).join(', ')} and more</p>
                        </>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            {value && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadText}
                      className={cn(
                        "h-9 w-9 p-0 rounded-xl",
                        "bg-white/80 border-slate-200/60 hover:bg-green-50 hover:border-green-300/60",
                        "hover:text-green-700 hover:shadow-md hover:shadow-green-500/10 transition-all duration-300",
                        "backdrop-blur-sm ring-1 ring-white/40"
                      )}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Download as text file
                  </TooltipContent>
                </Tooltip>
                {!readOnly && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClear}
                        className={cn(
                          "h-9 w-9 p-0 rounded-xl",
                          "bg-white/80 border-slate-200/60 hover:bg-red-50 hover:border-red-300/60",
                          "hover:text-red-700 hover:shadow-md hover:shadow-red-500/10 transition-all duration-300",
                          "backdrop-blur-sm ring-1 ring-white/40"
                        )}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Clear all text
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            )}
          </div>
        </div>
        
        {showStats && stats && (
          <div className="mt-4 p-5 bg-gradient-to-br from-slate-50/90 via-blue-50/40 to-indigo-50/30 rounded-xl border border-slate-200/40 backdrop-blur-sm">
            <div className="flex flex-wrap gap-2.5 mb-4">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200">
                {stats.words} words
              </Badge>
              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200">
                {stats.characters} chars
              </Badge>
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200">
                {stats.lines} lines
              </Badge>
              {stats.readingTime > 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200">
                  {stats.readingTime} min read
                </Badge>
              )}
              <Badge 
                className={cn(
                  stats.complexity === 'Simple' && "bg-green-100 text-green-700 border-green-200",
                  stats.complexity === 'Medium' && "bg-yellow-100 text-yellow-700 border-yellow-200",
                  stats.complexity === 'Complex' && "bg-red-100 text-red-700 border-red-200"
                )}
              >
                {stats.complexity}
              </Badge>
            </div>
            
            {stats.words > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <div className="p-1 bg-blue-100 rounded">
                    <BarChart3 className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="font-medium">Unique: {stats.uniqueWords}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <div className="p-1 bg-indigo-100 rounded">
                    <TrendingUp className="w-3 h-3 text-indigo-600" />
                  </div>
                  <span className="font-medium">Score: {stats.readabilityScore}</span>
                </div>
                <div className="text-slate-600 font-medium">Lang: {stats.languageDetection}</div>
                <div className="text-slate-600 font-medium">Avg W/S: {stats.averageWordsPerSentence}</div>
                <div className="text-slate-600 font-medium">Avg C/W: {stats.averageCharactersPerWord}</div>
                {stats.mostCommonWords.length > 0 && (
                  <div className="col-span-2 md:col-span-3 text-slate-600">
                    <span className="font-medium">Common: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {stats.mostCommonWords.slice(0, 3).map((item, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-white/50">
                          {item.word} ({item.count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Upload Progress */}
        {uploadStatus === 'uploading' && (
          <div className="mb-4 p-3 bg-blue-50/80 rounded-xl border border-blue-200/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-blue-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Uploading file...</span>
              </div>
              <span className="text-xs text-blue-600">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Upload Error */}
        {uploadError && uploadStatus === 'error' && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 text-sm">
              {uploadError}
            </AlertDescription>
          </Alert>
        )}

        <div 
          ref={dropZoneRef}
          className={cn(
            "relative transition-all duration-200",
            !readOnly && "cursor-text",
            isDragOver && !readOnly && "transform scale-[0.98]"
          )}
          onDragOver={!readOnly ? handleDragOver : undefined}
          onDragLeave={!readOnly ? handleDragLeave : undefined}
          onDrop={!readOnly ? handleDrop : undefined}
        >
          {/* Drag overlay */}
          {isDragOver && !readOnly && (
            <div className="absolute inset-0 bg-blue-100/90 backdrop-blur-sm border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center z-10">
              <div className="text-center">
                <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-blue-700 font-medium">Drop your file here</p>
                <p className="text-blue-600 text-sm">Max {maxFileSize}MB • {supportedFormats.slice(0, 3).join(', ')} and more</p>
              </div>
            </div>
          )}

          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={!readOnly ? `${placeholder}\n\nTip: You can also drag and drop text files here to upload` : placeholder}
            className={cn(
              "w-full resize-y border-slate-200/40 rounded-xl",
              "bg-white/95 backdrop-blur-md placeholder:text-slate-400",
              "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/60",
              "hover:border-slate-300/60 transition-all duration-300 text-slate-700",
              "shadow-sm focus:shadow-lg focus:shadow-blue-500/10",
              isDragOver && !readOnly && "border-blue-300 bg-blue-50/30",
              className
            )}
            style={{ minHeight }}
            readOnly={readOnly}
          />
          
          {/* Character count overlay */}
          {value && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-slate-100/80 backdrop-blur-sm rounded text-xs text-slate-500 font-mono">
              {value.length}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TextOutputAreaProps extends Omit<TextInputAreaProps, 'onChange'> {
  showCopyButton?: boolean;
}

export function TextOutputArea({
  value,
  placeholder = "Output will appear here...",
  title = "Output",
  className,
  minHeight = "200px",
  showStats = false,
  stats,
  showCopyButton = true
}: TextOutputAreaProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <Card className={cn(
      "w-full bg-gradient-to-br from-white via-gray-50/40 to-gray-100/30 backdrop-blur-md border border-gray-200/30 rounded-2xl",
      "shadow-lg shadow-gray-200/20 hover:shadow-xl hover:shadow-gray-500/10 hover:border-gray-300/40 transition-all duration-300",
      "ring-1 ring-white/60"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-700 bg-clip-text text-transparent",
            "flex items-center gap-3"
          )}>
            <div className="p-1.5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
            {title}
            {value && (
              <Badge variant="outline" className="text-xs font-medium bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200/60 px-2.5 py-0.5">
                {value.length} chars
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {value && showCopyButton && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className={cn(
                      "h-9 w-9 p-0 rounded-xl transition-all duration-300 backdrop-blur-sm ring-1 ring-white/40",
                      copied 
                        ? "bg-green-50 border-green-300/60 text-green-700 hover:bg-green-100 hover:shadow-md hover:shadow-green-500/10"
                        : "bg-white/80 border-slate-200/60 hover:bg-blue-50 hover:border-blue-300/60 hover:text-blue-700 hover:shadow-md hover:shadow-blue-500/10"
                    )}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {copied ? 'Copied!' : 'Copy to clipboard'}
                </TooltipContent>
              </Tooltip>
            )}
            {value && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([value], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${title.toLowerCase().replace(' ', '_')}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className={cn(
                      "h-9 w-9 p-0 rounded-xl",
                      "bg-white/80 border-slate-200/60 hover:bg-green-50 hover:border-green-300/60",
                      "hover:text-green-700 hover:shadow-md hover:shadow-green-500/10 transition-all duration-300",
                      "backdrop-blur-sm ring-1 ring-white/40"
                    )}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Download as text file
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        
        {showStats && stats && (
          <div className="mt-4 p-5 bg-gradient-to-br from-emerald-50/90 via-green-50/40 to-blue-50/30 rounded-xl border border-emerald-200/40 backdrop-blur-sm">
            <div className="flex flex-wrap gap-2.5 mb-4">
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200">
                {stats.words} words
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200">
                {stats.characters} chars
              </Badge>
              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200">
                {stats.lines} lines
              </Badge>
              {stats.readingTime > 0 && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200">
                  {stats.readingTime} min read
                </Badge>
              )}
              <Badge 
                className={cn(
                  stats.complexity === 'Simple' && "bg-green-100 text-green-700 border-green-200",
                  stats.complexity === 'Medium' && "bg-yellow-100 text-yellow-700 border-yellow-200",
                  stats.complexity === 'Complex' && "bg-red-100 text-red-700 border-red-200"
                )}
              >
                {stats.complexity}
              </Badge>
            </div>
            
            {stats.words > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <div className="p-1 bg-emerald-100 rounded">
                    <BarChart3 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="font-medium">Unique: {stats.uniqueWords}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <div className="p-1 bg-blue-100 rounded">
                    <TrendingUp className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="font-medium">Score: {stats.readabilityScore}</span>
                </div>
                <div className="text-slate-600 font-medium">Lang: {stats.languageDetection}</div>
                <div className="text-slate-600 font-medium">Avg W/S: {stats.averageWordsPerSentence}</div>
                <div className="text-slate-600 font-medium">Avg C/W: {stats.averageCharactersPerWord}</div>
                {stats.mostCommonWords.length > 0 && (
                  <div className="col-span-2 md:col-span-3 text-slate-600">
                    <span className="font-medium">Common: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {stats.mostCommonWords.slice(0, 3).map((item, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-white/50">
                          {item.word} ({item.count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="relative">
          <Textarea
            value={value}
            placeholder={placeholder}
            className={cn(
              "w-full resize-y border-emerald-200/40 rounded-xl",
              "bg-white/95 backdrop-blur-md placeholder:text-slate-400",
              "focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400/60",
              "hover:border-emerald-300/60 transition-all duration-300 text-slate-700",
              "shadow-sm focus:shadow-lg focus:shadow-emerald-500/10",
              className
            )}
            style={{ minHeight }}
            readOnly
          />
          
          {/* Character count overlay */}
          {value && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-emerald-100/80 backdrop-blur-sm rounded text-xs text-emerald-700 font-mono">
              {value.length}
            </div>
          )}
          
          {/* Empty state */}
          {!value && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-slate-400">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm">Output will appear here</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface UtilityActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  disabled?: boolean;
  badge?: string;
  className?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  category?: string;
}

export function UtilityActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  disabled = false,
  badge,
  className,
  isFavorite = false,
  onToggleFavorite,
  category
}: UtilityActionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setIsClicked(true);
    onClick();
    setTimeout(() => setIsClicked(false), 200);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.();
  };

  const getCategoryStyles = () => {
    switch (category) {
      case 'case': 
        return {
          iconBg: 'bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200/50',
          iconColor: 'text-gray-700',
          hoverGradient: 'from-gray-500/10 to-gray-600/10',
          shadowColor: 'shadow-gray-500/20',
          borderColor: 'border-gray-200/30'
        };
      case 'cleaning': 
        return {
          iconBg: 'bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200/50',
          iconColor: 'text-gray-700',
          hoverGradient: 'from-gray-500/10 to-gray-600/10',
          shadowColor: 'shadow-gray-500/20',
          borderColor: 'border-gray-200/30'
        };
      case 'encoding': 
        return {
          iconBg: 'bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200/50',
          iconColor: 'text-gray-700',
          hoverGradient: 'from-gray-500/10 to-gray-600/10',
          shadowColor: 'shadow-gray-500/20',
          borderColor: 'border-gray-200/30'
        };
      case 'json': 
        return {
          iconBg: 'bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200/50',
          iconColor: 'text-gray-700',
          hoverGradient: 'from-gray-500/10 to-gray-600/10',
          shadowColor: 'shadow-gray-500/20',
          borderColor: 'border-gray-200/30'
        };
      default: 
        return {
          iconBg: 'bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200/50',
          iconColor: 'text-gray-600',
          hoverGradient: 'from-gray-500/10 to-gray-600/10',
          shadowColor: 'shadow-gray-500/20',
          borderColor: 'border-gray-200/30'
        };
    }
  };

  const categoryStyles = getCategoryStyles();

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Card 
          className={cn(
            "cursor-pointer transition-all duration-300 group relative overflow-hidden",
            "bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl",
            "hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-1 hover:bg-white",
            "hover:border-slate-300/60",
            disabled && "opacity-50 cursor-not-allowed hover:shadow-none hover:translate-y-0 hover:bg-white/80",
            isClicked && "scale-95",
            isFavorite && "ring-2 ring-yellow-400/30 bg-gradient-to-br from-yellow-50/80 to-orange-50/60 border-yellow-300/40",
            className
          )}
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
      {/* Animated background shimmer */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 transition-all duration-500",
        "group-hover:opacity-100",
        categoryStyles.hoverGradient
      )} />
      
      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] bg-noise" />
      
      <CardContent className="p-5 relative z-10">
        <div className="flex items-start gap-4">
          <div className={cn(
            "relative p-2.5 rounded-xl transition-all duration-300",
            "group-hover:scale-110 group-hover:rotate-3",
            categoryStyles.iconBg
          )}>
            <Icon className={cn(
              "w-5 h-5 transition-all duration-300",
              categoryStyles.iconColor,
              "group-hover:scale-110"
            )} />
            
            {/* Subtle glow effect */}
            <div className={cn(
              "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
              "group-hover:opacity-30 blur-sm -z-10",
              categoryStyles.iconBg
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <h3 className={cn(
                  "font-semibold text-sm transition-colors duration-200",
                  "text-slate-800 group-hover:text-slate-900"
                )}>
                  {title}
                </h3>
                {badge && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs px-2 py-0.5 font-medium transition-all duration-200",
                      "bg-slate-100/80 text-slate-600 border border-slate-200/50",
                      "group-hover:bg-slate-200/80 group-hover:text-slate-700",
                      "group-hover:scale-105"
                    )}
                  >
                    {badge}
                  </Badge>
                )}
              </div>
              
              {onToggleFavorite && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 w-7 p-0 rounded-lg transition-all duration-200",
                    "opacity-0 group-hover:opacity-100 hover:bg-slate-100",
                    isFavorite && "opacity-100 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                  )}
                  onClick={handleFavoriteClick}
                >
                  <Star className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200 hover:scale-110",
                    isFavorite && "fill-current"
                  )} />
                </Button>
              )}
            </div>
            
            <p className={cn(
              "text-xs leading-relaxed line-clamp-2 transition-colors duration-200",
              "text-slate-500 group-hover:text-slate-600"
            )}>
              {description}
            </p>
            
            {/* Enhanced processing indicator */}
            {!disabled && isHovered && (
              <div className={cn(
                "flex items-center gap-1.5 mt-3 px-2 py-1 rounded-md",
                "bg-slate-100/70 backdrop-blur-sm border border-slate-200/50",
                "text-xs font-medium transition-all duration-200",
                categoryStyles.iconColor
              )}>
                <Zap className="w-3 h-3 animate-pulse" />
                <span>Click to apply</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Bottom border accent */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300",
        "opacity-0 group-hover:opacity-100",
        categoryStyles.iconBg.split(' ')[1] // Extract gradient classes
      )} />
    </Card>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="max-w-xs px-3 py-2 text-sm bg-slate-900 text-white border-slate-800 shadow-xl"
        sideOffset={8}
      >
        <div className="space-y-1">
          <div className="font-medium">{title}</div>
          <div className="text-slate-300 text-xs leading-relaxed">{description}</div>
          {badge && (
            <div className="flex items-center gap-1 mt-1">
              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
              <span className="text-xs text-slate-400">{badge}</span>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface ComparisonViewProps {
  leftTitle: string;
  rightTitle: string;
  leftContent: string;
  rightContent: string;
  diffs?: Array<{ operation: 'equal' | 'delete' | 'insert'; text: string }>;
  showDiffView?: boolean;
}

export function ComparisonView({
  leftTitle,
  rightTitle,
  leftContent,
  rightContent,
  diffs,
  showDiffView = false
}: ComparisonViewProps) {
  const [showDiff, setShowDiff] = useState(showDiffView);

  if (showDiff && diffs) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Text Differences</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiff(false)}
            >
              <EyeOff className="w-4 h-4 mr-1" />
              Hide Diff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 font-mono text-sm">
            {diffs.map((diff, index) => (
              <span
                key={index}
                className={cn(
                  "px-1",
                  diff.operation === 'insert' && "bg-green-100 text-green-800",
                  diff.operation === 'delete' && "bg-red-100 text-red-800 line-through",
                  diff.operation === 'equal' && "text-gray-700"
                )}
              >
                {diff.text}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TextOutputArea
        title={leftTitle}
        value={leftContent}
        showCopyButton={true}
      />
      <div className="space-y-4">
        <TextOutputArea
          title={rightTitle}
          value={rightContent}
          showCopyButton={true}
        />
        {diffs && diffs.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowDiff(true)}
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            Show Differences
          </Button>
        )}
      </div>
    </div>
  );
}
