"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Type, 
  Hash, 
  Code2, 
  FileText, 
  Search, 
  ArrowUpDown,
  GitCompare,
  Lock,
  Unlock,
  Mail,
  Link,
  Phone,
  Trash2,
  SortAsc,
  SortDesc,
  RotateCcw,
  Copy,
  Layers,
  Tag,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Star,
  Clock,
  Zap,
  Keyboard,
  HelpCircle,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  TextInputArea, 
  TextOutputArea, 
  UtilityActionCard, 
  ComparisonView 
} from './text-utility-components';
import { 
  calculateTextStats,
  toUpperCase,
  toLowerCase,
  toTitleCase,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  toSentenceCase,
  reverseText,
  removeExtraSpaces,
  removeEmptyLines,
  sortLines,
  removeDuplicateLines,
  addLineNumbers,
  encodeBase64,
  decodeBase64,
  encodeURL,
  decodeURL,
  formatJSON,
  minifyJSON,
  calculateTextDifference,
  stripHTML,
  escapeHTML,
  unescapeHTML,
  generateHash,
  extractEmails,
  extractURLs,
  extractPhoneNumbers,
  TextStats,
  TextDiff
} from '../utils/text-processors';

export function TextToolsPage() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [inputText2, setInputText2] = useState('');
  const [textStats, setTextStats] = useState<TextStats | null>(null);
  const [outputStats, setOutputStats] = useState<TextStats | null>(null);
  const [textDiffs, setTextDiffs] = useState<TextDiff[]>([]);
  const [hashResult, setHashResult] = useState('');
  const [extractedData, setExtractedData] = useState<{
    emails: string[];
    urls: string[];
    phones: string[];
  }>({ emails: [], urls: [], phones: [] });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>({
    case: true,
    cleaning: true,
    encoding: true,
    json: true
  });
  const [focusedToolIndex, setFocusedToolIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('tools');
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Update stats when input changes
  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
    setError('');
  }, []);

  // Debounced extraction to improve performance
  useEffect(() => {
    if (!inputText) {
      setTextStats(null);
      setExtractedData({ emails: [], urls: [], phones: [] });
      return;
    }

    const timeoutId = setTimeout(() => {
      const stats = calculateTextStats(inputText);
      setTextStats(stats);
      
      // Auto-extract data
      setExtractedData({
        emails: extractEmails(inputText),
        urls: extractURLs(inputText),
        phones: extractPhoneNumbers(inputText)
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputText]);

  const handleOutputChange = useCallback((text: string) => {
    setOutputText(text);
  }, []);

  // Update output stats with debouncing
  useEffect(() => {
    if (!outputText) {
      setOutputStats(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      const stats = calculateTextStats(outputText);
      setOutputStats(stats);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [outputText]);

  const handleInput2Change = useCallback((text: string) => {
    setInputText2(text);
  }, []);

  // Debounced diff calculation
  useEffect(() => {
    if (!inputText2 || !inputText) {
      setTextDiffs([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      const diffs = calculateTextDifference(inputText, inputText2);
      setTextDiffs(diffs);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inputText, inputText2]);

  // Text transformation functions
  const applyTransformation = useCallback((transformFn: (text: string) => string, errorMsg?: string) => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    setError('');
    
    // Use setTimeout to prevent UI blocking
    setTimeout(() => {
      try {
        const result = transformFn(inputText);
        setOutputText(result);
      } catch (err) {
        setError(errorMsg || 'Transformation failed');
      } finally {
        setIsProcessing(false);
      }
    }, 0);
  }, [inputText]);

  const applyAsyncTransformation = useCallback(async (transformFn: (text: string) => Promise<string>, errorMsg?: string) => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      const result = await transformFn(inputText);
      setHashResult(result);
    } catch (err) {
      setError(errorMsg || 'Transformation failed');
    } finally {
      setIsProcessing(false);
    }
  }, [inputText]);

  // Tool categories
  const caseConversionTools = [
    {
      title: 'UPPERCASE',
      description: 'Convert all text to uppercase letters',
      icon: Type,
      onClick: () => applyTransformation(toUpperCase),
      badge: 'A→A'
    },
    {
      title: 'lowercase',
      description: 'Convert all text to lowercase letters',
      icon: Type,
      onClick: () => applyTransformation(toLowerCase),
      badge: 'A→a'
    },
    {
      title: 'Title Case',
      description: 'Capitalize the first letter of each word',
      icon: Type,
      onClick: () => applyTransformation(toTitleCase),
      badge: 'Title'
    },
    {
      title: 'camelCase',
      description: 'Convert to camelCase format',
      icon: Code2,
      onClick: () => applyTransformation(toCamelCase),
      badge: 'camel'
    },
    {
      title: 'PascalCase',
      description: 'Convert to PascalCase format',
      icon: Code2,
      onClick: () => applyTransformation(toPascalCase),
      badge: 'Pascal'
    },
    {
      title: 'snake_case',
      description: 'Convert to snake_case format',
      icon: Code2,
      onClick: () => applyTransformation(toSnakeCase),
      badge: 'snake'
    },
    {
      title: 'kebab-case',
      description: 'Convert to kebab-case format',
      icon: Code2,
      onClick: () => applyTransformation(toKebabCase),
      badge: 'kebab'
    },
    {
      title: 'Sentence case',
      description: 'Capitalize only the first letter',
      icon: Type,
      onClick: () => applyTransformation(toSentenceCase),
      badge: 'Sent.'
    }
  ];

  const textCleaningTools = [
    {
      title: 'Remove Extra Spaces',
      description: 'Remove duplicate spaces and trim whitespace',
      icon: ArrowUpDown,
      onClick: () => applyTransformation(removeExtraSpaces)
    },
    {
      title: 'Remove Empty Lines',
      description: 'Remove all blank lines from text',
      icon: Trash2,
      onClick: () => applyTransformation(removeEmptyLines)
    },
    {
      title: 'Sort Lines A-Z',
      description: 'Sort all lines alphabetically (ascending)',
      icon: SortAsc,
      onClick: () => applyTransformation((text) => sortLines(text, true))
    },
    {
      title: 'Sort Lines Z-A',
      description: 'Sort all lines alphabetically (descending)',
      icon: SortDesc,
      onClick: () => applyTransformation((text) => sortLines(text, false))
    },
    {
      title: 'Remove Duplicates',
      description: 'Remove duplicate lines from text',
      icon: Copy,
      onClick: () => applyTransformation(removeDuplicateLines)
    },
    {
      title: 'Add Line Numbers',
      description: 'Add line numbers to each line',
      icon: Hash,
      onClick: () => applyTransformation(addLineNumbers)
    },
    {
      title: 'Reverse Text',
      description: 'Reverse the entire text character by character',
      icon: RotateCcw,
      onClick: () => applyTransformation(reverseText)
    },
    {
      title: 'Strip HTML',
      description: 'Remove all HTML tags from text',
      icon: Tag,
      onClick: () => applyTransformation(stripHTML)
    }
  ];

  const encodingTools = [
    {
      title: 'Encode Base64',
      description: 'Encode text to Base64 format',
      icon: Lock,
      onClick: () => applyTransformation(encodeBase64, 'Failed to encode to Base64')
    },
    {
      title: 'Decode Base64',
      description: 'Decode Base64 encoded text',
      icon: Unlock,
      onClick: () => applyTransformation(decodeBase64, 'Invalid Base64 format')
    },
    {
      title: 'URL Encode',
      description: 'Encode text for URL use',
      icon: Link,
      onClick: () => applyTransformation(encodeURL)
    },
    {
      title: 'URL Decode',
      description: 'Decode URL encoded text',
      icon: Link,
      onClick: () => applyTransformation(decodeURL, 'Invalid URL encoding')
    },
    {
      title: 'Escape HTML',
      description: 'Escape HTML special characters',
      icon: Code2,
      onClick: () => applyTransformation(escapeHTML)
    },
    {
      title: 'Unescape HTML',
      description: 'Unescape HTML entities',
      icon: Code2,
      onClick: () => applyTransformation(unescapeHTML)
    },
    {
      title: 'Generate Hash',
      description: 'Generate SHA-256 hash of the text',
      icon: Hash,
      onClick: () => applyAsyncTransformation(generateHash, 'Failed to generate hash')
    }
  ];

  const jsonTools = [
    {
      title: 'Format JSON',
      description: 'Format and prettify JSON with proper indentation',
      icon: FileText,
      onClick: () => applyTransformation(formatJSON, 'Invalid JSON format')
    },
    {
      title: 'Minify JSON',
      description: 'Compress JSON by removing whitespace',
      icon: Layers,
      onClick: () => applyTransformation(minifyJSON, 'Invalid JSON format')
    }
  ];

  // Memoized tool categories with optimized callbacks
  const memoizedCaseTools = useMemo(() => 
    caseConversionTools.map(tool => ({ 
      ...tool, 
      category: 'case',
      onClick: () => applyTransformation(tool.onClick as any)
    })), [applyTransformation]
  );

  const memoizedCleaningTools = useMemo(() => 
    textCleaningTools.map(tool => ({ 
      ...tool, 
      category: 'cleaning',
      onClick: () => applyTransformation(tool.onClick as any)
    })), [applyTransformation]
  );

  const memoizedEncodingTools = useMemo(() => 
    encodingTools.map(tool => ({ 
      ...tool, 
      category: 'encoding',
      onClick: tool.title === 'Generate Hash' 
        ? () => applyAsyncTransformation(generateHash, 'Failed to generate hash')
        : () => applyTransformation(tool.onClick as any)
    })), [applyTransformation, applyAsyncTransformation]
  );

  const memoizedJsonTools = useMemo(() => 
    jsonTools.map(tool => ({ 
      ...tool, 
      category: 'json',
      onClick: () => applyTransformation(tool.onClick as any)
    })), [applyTransformation]
  );

  // Search and filter functionality
  const allTools = useMemo(() => [
    ...memoizedCaseTools,
    ...memoizedCleaningTools,
    ...memoizedEncodingTools,
    ...memoizedJsonTools
  ], [memoizedCaseTools, memoizedCleaningTools, memoizedEncodingTools, memoizedJsonTools]);

  const filteredTools = useMemo(() => {
    if (!searchTerm.trim()) return allTools;
    const lowercaseSearch = searchTerm.toLowerCase();
    return allTools.filter(tool => 
      tool.title.toLowerCase().includes(lowercaseSearch) ||
      tool.description.toLowerCase().includes(lowercaseSearch)
    );
  }, [allTools, searchTerm]);

  const toggleFavorite = useCallback((toolTitle: string) => {
    setFavorites(prev => 
      prev.includes(toolTitle) 
        ? prev.filter(f => f !== toolTitle)
        : [...prev, toolTitle]
    );
  }, []);

  const toggleSection = useCallback((section: string) => {
    setSectionStates(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const handleProcessingTransformation = async (transformFn: (text: string) => string | Promise<string>, errorMsg?: string) => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      const result = await Promise.resolve(transformFn(inputText));
      if (typeof result === 'string') {
        setOutputText(result);
        handleOutputChange(result);
      } else {
        setHashResult(result);
      }
    } catch (err) {
      setError(errorMsg || 'Transformation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Keyboard shortcuts
  const handleKeyboardShortcuts = useCallback((event: KeyboardEvent) => {
    // Prevent shortcuts when typing in input areas
    if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) {
      return;
    }

    const key = event.key.toLowerCase();
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;

    if (isCtrlOrCmd) {
      switch (key) {
        case '1':
          event.preventDefault();
          setActiveTab('tools');
          break;
        case '2':
          event.preventDefault();
          setActiveTab('compare');
          break;
        case '3':
          event.preventDefault();
          setActiveTab('extract');
          break;
        case '4':
          event.preventDefault();
          setActiveTab('hash');
          break;
        case 'u':
          event.preventDefault();
          applyTransformation(toUpperCase);
          break;
        case 'l':
          event.preventDefault();
          applyTransformation(toLowerCase);
          break;
        case 't':
          event.preventDefault();
          applyTransformation(toTitleCase);
          break;
        case 'f':
          event.preventDefault();
          document.getElementById('search-input')?.focus();
          break;
        case '?':
          event.preventDefault();
          setShowKeyboardHelp(true);
          break;
      }
    }

    // Arrow key navigation for tools
    if (key === 'arrowdown' || key === 'arrowup') {
      event.preventDefault();
      const visibleTools = searchTerm ? filteredTools : allTools;
      if (key === 'arrowdown') {
        setFocusedToolIndex(prev => (prev + 1) % visibleTools.length);
      } else {
        setFocusedToolIndex(prev => prev <= 0 ? visibleTools.length - 1 : prev - 1);
      }
    }

    // Enter to activate focused tool
    if (key === 'enter' && focusedToolIndex >= 0) {
      event.preventDefault();
      const visibleTools = searchTerm ? filteredTools : allTools;
      const tool = visibleTools[focusedToolIndex];
      if (tool && inputText.trim()) {
        tool.onClick();
      }
    }
  }, [inputText, searchTerm, filteredTools, allTools, focusedToolIndex, applyTransformation]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  // Reset focused tool when search changes
  useEffect(() => {
    setFocusedToolIndex(-1);
  }, [searchTerm]);

  // Initialize component
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Debounced search to improve performance
  const debouncedSearchTerm = useMemo(() => {
    const timeoutId = setTimeout(() => searchTerm, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Memoize expensive calculations
  const memoizedTextStats = useMemo(() => {
    if (!inputText) return null;
    return calculateTextStats(inputText);
  }, [inputText]);

  const memoizedOutputStats = useMemo(() => {
    if (!outputText) return null;
    return calculateTextStats(outputText);
  }, [outputText]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-white relative">
        <div className="container mx-auto p-4 max-w-6xl relative z-10">
          <Dialog open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="group flex items-center gap-2 bg-white/80 backdrop-blur-sm border-slate-200/60 hover:bg-white hover:border-gray-400/60 hover:text-gray-800 hover:shadow-lg hover:shadow-gray-500/10 transition-all duration-300 rounded-xl px-4 py-2.5 fixed top-6 right-6 z-50"
              >
                <div className="p-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg group-hover:from-gray-200 group-hover:to-gray-300 transition-all duration-300">
                  <Keyboard className="w-4 h-4 text-gray-700" />
                </div>
                <span className="font-medium">Shortcuts</span>
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-pulse" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg">
                    <Keyboard className="w-5 h-5 text-white" />
                  </div>
                  Keyboard Shortcuts
                </DialogTitle>
                <DialogDescription>
                  Master these keyboard shortcuts to work faster and more efficiently with Text Tools.
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Navigation Shortcuts */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-gray-200 rounded-md">
                              <Zap className="w-4 h-4 text-gray-700" />
                            </div>
                        <h3 className="font-semibold text-base text-slate-800">Navigation</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <span className="text-sm text-gray-700">Switch to Tools tab</span>
                          <kbd className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-mono shadow-sm">Ctrl+1</kbd>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <span className="text-sm text-slate-700">Switch to Compare tab</span>
                          <kbd className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono shadow-sm">Ctrl+2</kbd>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <span className="text-sm text-slate-700">Switch to Extract tab</span>
                          <kbd className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono shadow-sm">Ctrl+3</kbd>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <span className="text-sm text-slate-700">Switch to Hash tab</span>
                          <kbd className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono shadow-sm">Ctrl+4</kbd>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <span className="text-sm text-slate-700">Focus search box</span>
                          <kbd className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono shadow-sm">Ctrl+F</kbd>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-green-100 rounded-md">
                          <Type className="w-4 h-4 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-base text-slate-800">Quick Actions</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <span className="text-sm text-slate-700">Convert to UPPERCASE</span>
                          <kbd className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono shadow-sm">Ctrl+U</kbd>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <span className="text-sm text-slate-700">Convert to lowercase</span>
                          <kbd className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono shadow-sm">Ctrl+L</kbd>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <span className="text-sm text-slate-700">Convert to Title Case</span>
                          <kbd className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono shadow-sm">Ctrl+T</kbd>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <span className="text-sm text-slate-700">Show shortcuts</span>
                          <kbd className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono shadow-sm">Ctrl+?</kbd>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tool Navigation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-purple-100 rounded-md">
                        <Hash className="w-4 h-4 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-base text-slate-800">Tool Navigation</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <span className="text-sm text-slate-700">Navigate tools up</span>
                        <kbd className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono shadow-sm">↑</kbd>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <span className="text-sm text-slate-700">Navigate tools down</span>
                        <kbd className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono shadow-sm">↓</kbd>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <span className="text-sm text-slate-700">Apply focused tool</span>
                        <kbd className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono shadow-sm">Enter</kbd>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tips Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-amber-100 rounded-md">
                        <HelpCircle className="w-4 h-4 text-amber-600" />
                      </div>
                      <h3 className="font-semibold text-base text-slate-800">Pro Tips</h3>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span>Keyboard shortcuts work when not typing in text areas</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span>Use arrow keys to navigate through visible tools</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span>Star tools to add them to your favorites list</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span>Search filters all available tools instantly</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="relative mb-6">
            <TabsList className={cn(
              "grid w-full grid-cols-4 h-12 sm:h-16 p-1 sm:p-1.5 bg-white border border-gray-200 rounded-xl sm:rounded-3xl shadow-lg"
            )}>
            <TabsTrigger 
              value="tools" 
              className={cn(
                "relative h-12 rounded-xl font-medium transition-all duration-300",
                "data-[state=active]:bg-white data-[state=active]:shadow-md",
                "data-[state=active]:text-slate-900 text-slate-600",
                "hover:bg-white/70 hover:text-slate-800",
                "flex items-center justify-center gap-2"
              )}
            >
              <Zap className="w-4 h-4" />
              Tools
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse opacity-0 data-[state=active]:opacity-100" />
            </TabsTrigger>
            <TabsTrigger 
              value="compare" 
              className={cn(
                "relative h-12 rounded-xl font-medium transition-all duration-300",
                "data-[state=active]:bg-white data-[state=active]:shadow-md",
                "data-[state=active]:text-slate-900 text-slate-600",
                "hover:bg-white/70 hover:text-slate-800",
                "flex items-center justify-center gap-2"
              )}
            >
              <GitCompare className="w-4 h-4" />
              Compare
            </TabsTrigger>
            <TabsTrigger 
              value="extract" 
              className={cn(
                "relative h-12 rounded-xl font-medium transition-all duration-300",
                "data-[state=active]:bg-white data-[state=active]:shadow-md",
                "data-[state=active]:text-slate-900 text-slate-600",
                "hover:bg-white/70 hover:text-slate-800",
                "flex items-center justify-center gap-2"
              )}
            >
              <Search className="w-4 h-4" />
              Extract
              {(extractedData.emails.length > 0 || extractedData.urls.length > 0 || extractedData.phones.length > 0) && (
                <Badge className="ml-1 h-5 px-1.5 text-xs bg-emerald-500 text-white border-0">
                  {extractedData.emails.length + extractedData.urls.length + extractedData.phones.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="hash" 
              className={cn(
                "relative h-12 rounded-xl font-medium transition-all duration-300",
                "data-[state=active]:bg-white data-[state=active]:shadow-md",
                "data-[state=active]:text-slate-900 text-slate-600",
                "hover:bg-white/70 hover:text-slate-800",
                "flex items-center justify-center gap-2"
              )}
            >
              <Hash className="w-4 h-4" />
              Hash
              {hashResult && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tools" className="space-y-6">
          {/* Search and Quick Actions */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search-input"
                  placeholder="Search tools (e.g., uppercase, json, base64)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 bg-white border-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              
              {/* Quick Access Tools */}
              <div className="flex flex-wrap gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyTransformation(toUpperCase)}
                      disabled={!inputText.trim()}
                      className="h-8 px-3 text-xs font-medium"
                    >
                      <Type className="w-3 h-3 mr-1" />
                      UPPER
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Convert to UPPERCASE (Ctrl+U)</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyTransformation(toLowerCase)}
                      disabled={!inputText.trim()}
                      className="h-8 px-3 text-xs font-medium"
                    >
                      <Type className="w-3 h-3 mr-1" />
                      lower
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Convert to lowercase (Ctrl+L)</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyTransformation(toTitleCase)}
                      disabled={!inputText.trim()}
                      className="h-8 px-3 text-xs font-medium"
                    >
                      <Type className="w-3 h-3 mr-1" />
                      Title
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Convert to Title Case (Ctrl+T)</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyTransformation(removeExtraSpaces)}
                      disabled={!inputText.trim()}
                      className="h-8 px-3 text-xs font-medium"
                    >
                      <ArrowUpDown className="w-3 h-3 mr-1" />
                      Trim
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove extra spaces</TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            {/* Live Stats */}
            {inputText && (
              <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-1.5">
                  <Type className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">
                    {textStats?.words || 0} words
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">
                    {textStats?.characters || 0} characters
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">
                    {textStats?.readingTime || 0} min read
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">
                    {textStats?.lines || 0} lines
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <TextInputArea
                value={inputText}
                onChange={handleInputChange}
                title="Input Text"
                placeholder="Enter your text here to transform..."
                showStats={true}
                stats={textStats || undefined}
                minHeight="350px"
              />
              {isProcessing && (
                <div className="flex items-center justify-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/60 backdrop-blur-sm animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200"></div>
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-transparent border-t-blue-600 absolute inset-0"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-blue-700 font-medium">Processing text...</span>
                      <span className="text-blue-500 text-xs">Using optimized algorithms</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <TextOutputArea
                value={outputText}
                title="Transformed Text"
                placeholder="Transformed text will appear here..."
                showStats={true}
                stats={outputStats || undefined}
                minHeight="350px"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 shadow-sm animate-slideInDown">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError('')}
                    className="h-8 w-8 p-0 hover:bg-red-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {/* Favorites Section */}
            {favorites.length > 0 && (
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <Star className="w-5 h-5" />
                    Favorite Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {allTools.filter(tool => favorites.includes(tool.title)).map((tool, index) => (
                      <UtilityActionCard
                        key={`favorite-${index}`}
                        {...tool}
                        disabled={!inputText.trim()}
                        isFavorite={true}
                        onToggleFavorite={() => toggleFavorite(tool.title)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Case Conversion */}
            <Collapsible open={sectionStates.case} onOpenChange={() => toggleSection('case')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Type className="w-5 h-5 text-blue-600" />
                    Case Conversion
                    <Badge variant="outline" className="ml-2">{caseConversionTools.length}</Badge>
                  </h3>
                  {sectionStates.case ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(searchTerm ? filteredTools.filter(t => t.category === 'case') : caseConversionTools).map((tool, index) => (
                    <UtilityActionCard
                      key={`case-${index}`}
                      {...tool}
                      disabled={!inputText.trim()}
                      isFavorite={favorites.includes(tool.title)}
                      onToggleFavorite={() => toggleFavorite(tool.title)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator className="my-6" />

            {/* Text Cleaning */}
            <Collapsible open={sectionStates.cleaning} onOpenChange={() => toggleSection('cleaning')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <ArrowUpDown className="w-5 h-5 text-green-600" />
                    Text Cleaning & Formatting
                    <Badge variant="outline" className="ml-2">{textCleaningTools.length}</Badge>
                  </h3>
                  {sectionStates.cleaning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(searchTerm ? filteredTools.filter(t => t.category === 'cleaning') : textCleaningTools).map((tool, index) => (
                    <UtilityActionCard
                      key={`cleaning-${index}`}
                      {...tool}
                      disabled={!inputText.trim()}
                      isFavorite={favorites.includes(tool.title)}
                      onToggleFavorite={() => toggleFavorite(tool.title)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator className="my-6" />

            {/* Encoding/Decoding */}
            <Collapsible open={sectionStates.encoding} onOpenChange={() => toggleSection('encoding')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-purple-600" />
                    Encoding & Decoding
                    <Badge variant="outline" className="ml-2">{encodingTools.length}</Badge>
                  </h3>
                  {sectionStates.encoding ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(searchTerm ? filteredTools.filter(t => t.category === 'encoding') : encodingTools).map((tool, index) => (
                    <UtilityActionCard
                      key={`encoding-${index}`}
                      {...tool}
                      disabled={!inputText.trim()}
                      isFavorite={favorites.includes(tool.title)}
                      onToggleFavorite={() => toggleFavorite(tool.title)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator className="my-6" />

            {/* JSON Tools */}
            <Collapsible open={sectionStates.json} onOpenChange={() => toggleSection('json')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    JSON Tools
                    <Badge variant="outline" className="ml-2">{jsonTools.length}</Badge>
                  </h3>
                  {sectionStates.json ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(searchTerm ? filteredTools.filter(t => t.category === 'json') : jsonTools).map((tool, index) => (
                    <UtilityActionCard
                      key={`json-${index}`}
                      {...tool}
                      disabled={!inputText.trim()}
                      isFavorite={favorites.includes(tool.title)}
                      onToggleFavorite={() => toggleFavorite(tool.title)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </TabsContent>

        <TabsContent value="compare" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TextInputArea
              value={inputText}
              onChange={handleInputChange}
              title="Text 1"
              placeholder="Enter first text to compare..."
              minHeight="300px"
            />
            <TextInputArea
              value={inputText2}
              onChange={handleInput2Change}
              title="Text 2"
              placeholder="Enter second text to compare..."
              minHeight="300px"
            />
          </div>
          
          {textDiffs.length > 0 && (
            <ComparisonView
              leftTitle="Text 1"
              rightTitle="Text 2"
              leftContent={inputText}
              rightContent={inputText2}
              diffs={textDiffs}
            />
          )}
        </TabsContent>

        <TabsContent value="extract" className="space-y-6">
          <TextInputArea
            value={inputText}
            onChange={handleInputChange}
            title="Input Text"
            placeholder="Enter text to extract emails, URLs, and phone numbers..."
            minHeight="300px"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Addresses
                  <Badge variant="secondary">{extractedData.emails.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {extractedData.emails.length > 0 ? (
                  <div className="space-y-2">
                    {extractedData.emails.map((email, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-sm font-mono">
                        {email}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No email addresses found</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  URLs
                  <Badge variant="secondary">{extractedData.urls.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {extractedData.urls.length > 0 ? (
                  <div className="space-y-2">
                    {extractedData.urls.map((url, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-sm font-mono break-all">
                        {url}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No URLs found</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Phone Numbers
                  <Badge variant="secondary">{extractedData.phones.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {extractedData.phones.length > 0 ? (
                  <div className="space-y-2">
                    {extractedData.phones.map((phone, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-sm font-mono">
                        {phone}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No phone numbers found</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hash" className="space-y-6">
          <TextInputArea
            value={inputText}
            onChange={handleInputChange}
            title="Input Text"
            placeholder="Enter text to generate hash..."
            minHeight="200px"
          />

          <div className="flex gap-4">
            <Button 
              onClick={() => applyAsyncTransformation(generateHash, 'Failed to generate hash')}
              disabled={!inputText.trim()}
              className="flex items-center gap-2"
            >
              <Hash className="w-4 h-4" />
              Generate SHA-256 Hash
            </Button>
          </div>

          {hashResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  SHA-256 Hash
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-gray-50 rounded font-mono text-sm break-all">
                  {hashResult}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}
