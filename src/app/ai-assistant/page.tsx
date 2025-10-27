"use client";

import { useState, useEffect, useRef, useCallback, memo, ErrorInfo, Component, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Optimized icon imports - only load what's actually used
import {
  Send, 
  Sparkles, 
  Trash2, 
  Copy, 
  ArrowLeft,
  ChevronDown,
  Zap,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Brain,
  FileText,
  Code2,
  Code,
  Database,
  Terminal,
  Globe,
  Cpu,
  Wrench,
  Diamond,
  Coffee,
  Package,
  XCircle,
  Target,
  User,
  MoreHorizontal,
  Upload,
  Image,
  X
} from 'lucide-react';
import { showSuccessToast } from '@/lib/toast-utils';
import { cn } from '@/lib/utils';
import { generateMessageId } from '@/lib/id-utils';
import Link from 'next/link';
import { formatFileSize } from '@/lib/format-file-size';

// Lazy load heavy components
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-4 rounded" />
});

const AdvancedLazyCodeHighlighter = dynamic(
  () => import('@/components/shared/advanced-lazy-loader').then(mod => ({ default: mod.AdvancedLazyCodeHighlighter })),
  { loading: () => <div className="animate-pulse bg-gray-800 h-24 rounded" /> }
);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: TokenUsage;
}

interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

interface AIModel {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
}

interface CodeOverview {
  lines: number;
  functions: number;
  classes: number;
  loops: number;
  complexity: 'Simple' | 'Moderate' | 'Complex';
  features: string;
  language: string;
  icon: React.ReactNode;
}

interface CodeBlockProps {
  codeString: string;
  language: string;
  isUser: boolean;
}

interface MessageComponentProps {
  message: Message;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

const AI_MODELS: AIModel[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    description: 'Next-generation model with improved performance',
    icon: 'Rocket'
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'gemini-2.0-flash-exp',
    displayName: 'Gemini 2.0 Flash',
    description: 'Currently the primary available model with enhanced capabilities',
    icon: 'Sparkles'
  },
  {
    id: 'gemini-1.5-flash',
    name: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    description: 'Fast and efficient for most tasks',
    icon: 'Zap'
  }
];

// Gemini-like suggestion chips (monochrome)
const SUGGESTIONS: string[] = [
  'Summarize this text',
  'Brainstorm ideas',
  'Explain this code',
  'Create an outline'
];

// Helper function to render AI model icons
const renderModelIcon = (iconName: string) => {
  const iconProps = { className: "w-4 h-4" };
  switch (iconName) {
    case 'Zap':
      return <Zap {...iconProps} />;
    case 'Sparkles':
      return <Sparkles {...iconProps} />;
    case 'Rocket':
      return <Rocket {...iconProps} />;
    default:
      return <Brain {...iconProps} />;
  }
};

/**
 * Generates code overview statistics and complexity analysis
 * @param code - The code string to analyze
 * @param language - The programming language of the code
 * @returns CodeOverview object with analysis results
 */
const generateCodeOverview = (code: string, language: string): CodeOverview => {
  const lines = code.trim().split('\n').length;
  const functions = (code.match(/def\s+\w+|function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=/g) || []).length;
  const classes = (code.match(/class\s+\w+|interface\s+\w+|type\s+\w+/g) || []).length;
  const imports = (code.match(/import\s+|from\s+|#include|require\(/g) || []).length;
  const loops = (code.match(/for\s*\(|while\s*\(|for\s+\w+\s+in|forEach/g) || []).length;
  
  const features = [];
  if (functions > 0) features.push(`${functions} function${functions > 1 ? 's' : ''}`);
  if (classes > 0) features.push(`${classes} class${classes > 1 ? 'es' : ''}`);
  if (imports > 0) features.push(`${imports} import${imports > 1 ? 's' : ''}`);
  if (loops > 0) features.push(`${loops} loop${loops > 1 ? 's' : ''}`);
  
  // Estimate complexity
  let complexity: 'Simple' | 'Moderate' | 'Complex' = 'Simple';
  const complexityScore = (functions * 2) + (classes * 3) + (loops * 2) + (lines * 0.1);
  if (complexityScore > 50) complexity = 'Complex';
  else if (complexityScore > 20) complexity = 'Moderate';
  
  // Language-specific insights
  const getLanguageIcon = (lang: string) => {
    const iconProps = { className: "w-4 h-4" };
    switch (lang.toLowerCase()) {
      case 'python': return <Code2 {...iconProps} />;
      case 'javascript': return <Zap {...iconProps} />;
      case 'typescript': return <Code {...iconProps} />;
      case 'java': return <Coffee {...iconProps} />;
      case 'cpp': case 'c++': return <Cpu {...iconProps} />;
      case 'c': return <Wrench {...iconProps} />;
      case 'go': return <Rocket {...iconProps} />;
      case 'rust': return <Cpu {...iconProps} />;
      case 'php': return <Globe {...iconProps} />;
      case 'ruby': return <Diamond {...iconProps} />;
      case 'swift': return <Zap {...iconProps} />;
      case 'kotlin': return <Target {...iconProps} />;
      case 'html': return <Globe {...iconProps} />;
      case 'css': return <Sparkles {...iconProps} />;
      case 'sql': return <Database {...iconProps} />;
      case 'bash': case 'shell': return <Terminal {...iconProps} />;
      case 'json': return <Package {...iconProps} />;
      default: return <FileText {...iconProps} />;
    }
  };
  
  return {
    lines,
    functions,
    classes,
    loops,
    complexity,
    features: features.length > 0 ? features.join(', ') : 'Code snippet',
    language: language || 'text',
    icon: getLanguageIcon(language)
  };
};

/**
 * Error Boundary Component to catch and handle React errors gracefully
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Error is already handled in state, no need for console logging in production
    // Development logging can be handled by React DevTools
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error boundary caught an error:', error.message, errorInfo.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} />;
      }
      
      return (
        <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-1">Something went wrong</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 text-xs"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Enhanced Code Block Component with syntax highlighting, overview, and navigation
 */
const CodeBlock = memo(function CodeBlock({ 
  codeString, 
  language, 
  isUser 
}: CodeBlockProps) {
  const overview = generateCodeOverview(codeString, language);
  const [showOverview, setShowOverview] = useState(codeString.split('\n').length > 10);
  const [isExpanded, setIsExpanded] = useState(true); // Always expanded
  
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      showSuccessToast("Code copied to clipboard");
    } catch (error) {
      // Fallback for older browsers or when clipboard API is not available
      const textArea = document.createElement('textarea');
      textArea.value = codeString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showSuccessToast("Code copied to clipboard");
    }
  }, [codeString]);

  const scrollRef = useRef<HTMLDivElement>(null);
  
  const handleKeyNavigation = useCallback((e: React.KeyboardEvent, direction: 'left' | 'right') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const scrollContainer = scrollRef.current;
      if (scrollContainer) {
        scrollContainer.scrollBy({ 
          left: direction === 'left' ? -200 : 200, 
          behavior: 'smooth' 
        });
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <div className="my-2 rounded-lg overflow-hidden bg-gray-900 border border-gray-700 w-full max-w-full">
        {/* Simplified header */}
        <div className="flex items-center justify-between bg-gray-800 px-3 py-1.5 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300 font-mono">{language}</span>
            <Badge 
              variant="secondary" 
              className="text-xs px-1.5 py-0 h-4 bg-gray-800/30 text-gray-300 border-gray-600"
            >
              {overview.lines} lines
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-xs text-gray-300 hover:text-white hover:bg-gray-700"
            onClick={copyCode}
            aria-label="Copy code"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
        
        {/* Code content */}
        <div className="relative">
          <div 
            ref={scrollRef}
            className="overflow-x-auto bg-gray-900 max-w-full"
            style={{ maxHeight: '300px' }}
          >
            <AdvancedLazyCodeHighlighter
              language={language}
              customStyle={{
                margin: 0,
                padding: '12px',
                background: 'transparent',
                fontSize: '11px',
                lineHeight: '1.3'
              }}
            >
              {codeString}
            </AdvancedLazyCodeHighlighter>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
});

/**
 * ChatGPT-style Message Component
 */
const ChatGPTMessageComponent = memo(function ChatGPTMessageComponent({ message, selectedModel }: MessageComponentProps & { selectedModel: AIModel }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "group relative w-full",
      isUser ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-black"
    )}>
      <div className="max-w-3xl mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 w-full" style={{ minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
        <div className="flex items-start gap-2 sm:gap-3 md:gap-4 w-full" style={{ minWidth: 0 }}>
          {/* Avatar - Monochrome with responsive sizing */}
          <div className="flex-shrink-0">
            {isUser ? (
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-black dark:bg-white rounded-sm flex items-center justify-center">
                <User className="w-3 h-3 sm:w-5 sm:h-5 text-white dark:text-black" />
              </div>
            ) : (
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-600 dark:bg-gray-300 rounded-sm flex items-center justify-center">
                <Sparkles className="w-3 h-3 sm:w-5 sm:h-5 text-white dark:text-black" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 overflow-hidden" style={{ maxWidth: '100%' }}>
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <span className="font-semibold text-black dark:text-white text-xs sm:text-sm md:text-base">
                {isUser ? 'You' : selectedModel.displayName}
              </span>
            </div>
            
            <div className="prose prose-gray dark:prose-invert max-w-none w-full overflow-hidden" style={{ minWidth: 0 }}>
              <div className="w-full overflow-x-auto" style={{ minWidth: 0, maxWidth: '100%' }}>
              <ErrorBoundary>
                <ReactMarkdown
                  components={{
                    code: ({ inline, className, children, ...props }: any) => {
                      try {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const codeString = String(children || '').replace(/\n$/, '');
                        
                        if (!inline && match && codeString.trim()) {
                          return (
                            <AdvancedLazyCodeHighlighter
                              language={language}
                              customStyle={{
                                fontSize: 'clamp(9px, 2.5vw, 14px)',
                                lineHeight: '1.2',
                                padding: '8px 12px'
                              }}
                            >
                              {codeString}
                            </AdvancedLazyCodeHighlighter>
                          );
                        }
                        
                        return (
                          <code
                            className="px-1 sm:px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded text-xs sm:text-sm font-mono break-words"
                            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      } catch (error) {
                        // Fallback for code rendering errors
                        return (
                          <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded text-xs font-mono">
                            {String(children || '')}
                          </code>
                        );
                      }
                    },
                  p: ({ children }) => (
                    <p className="mb-3 sm:mb-4 last:mb-0 leading-6 sm:leading-7 text-black dark:text-white text-sm sm:text-base" style={{ wordBreak: 'break-word' }}>{children || ''}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-3 sm:mb-4 space-y-1 sm:space-y-2 text-black dark:text-white text-sm sm:text-base pl-2 sm:pl-0">{children || ''}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-3 sm:mb-4 space-y-1 sm:space-y-2 text-black dark:text-white text-sm sm:text-base pl-2 sm:pl-0">{children || ''}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-black dark:text-white text-sm sm:text-base" style={{ wordBreak: 'break-word' }}>{children || ''}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-black dark:text-white">{children || ''}</strong>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-black dark:text-white" style={{ wordBreak: 'break-word' }}>{children || ''}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 text-black dark:text-white" style={{ wordBreak: 'break-word' }}>{children || ''}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 text-black dark:text-white" style={{ wordBreak: 'break-word' }}>{children || ''}</h3>
                  ),
                  // Add error boundary for unhandled component types
                  div: ({ children, ...props }) => (
                    <div {...props}>{children}</div>
                  ),
                  span: ({ children, ...props }) => (
                    <span {...props}>{children}</span>
                  )
                }}
                skipHtml={true}
                disallowedElements={['script', 'iframe', 'object', 'embed']}
              >
                {message.content || ''}
              </ReactMarkdown>
              </ErrorBoundary>
              </div>
            </div>
            
            {/* Copy button - show on hover */}
            {!isUser && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(message.content);
                      showSuccessToast('Message copied');
                    } catch {
                      const ta = document.createElement('textarea');
                      ta.value = message.content;
                      document.body.appendChild(ta);
                      ta.select();
                      document.execCommand('copy');
                      document.body.removeChild(ta);
                      showSuccessToast('Message copied');
                    }
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * ChatGPT-style Typing Indicator
 */
const ChatGPTTypingIndicator = memo(function ChatGPTTypingIndicator({ selectedModel }: { selectedModel: AIModel }) {
  return (
    <div className="bg-white dark:bg-black w-full">
      <div className="max-w-3xl mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 w-full" style={{ minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
        <div className="flex items-start gap-2 sm:gap-3 md:gap-4 w-full" style={{ minWidth: 0 }}>
          <div className="flex-shrink-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-600 dark:bg-gray-300 rounded-sm flex items-center justify-center">
              <Sparkles className="w-3 h-3 sm:w-5 sm:h-5 text-white dark:text-black" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0 overflow-hidden" style={{ maxWidth: '100%' }}>
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <span className="font-semibold text-black dark:text-white text-xs sm:text-sm md:text-base">
                {selectedModel.displayName}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}} />
              <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Message Skeleton Loader
 */
const MessageSkeleton = memo(function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={cn(
        "flex gap-3 p-4",
        isUser ? "justify-end" : "justify-start"
      )}>
      {!isUser && (
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0" />
      )}
      
      <div className={cn(
        "flex flex-col gap-2 message-container",
        isUser 
          ? "user-message items-end" 
          : "ai-message items-start"
      )}>
        <div className={cn(
          "px-3 sm:px-4 py-3 rounded-2xl animate-pulse",
          isUser ? "bg-gray-300 dark:bg-gray-700" : "bg-gray-200 dark:bg-gray-700"
        )}>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6" />
          </div>
        </div>
      </div>
      
      {isUser && (
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0" />
      )}
    </div>
  );
});

/**
 * Typing indicator with animation
 */
const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="mb-4 sm:mb-8 px-2 sm:px-4">
      <div className="flex items-start gap-2 sm:gap-4 justify-start">
        {/* Enhanced AI Avatar */}
        <div className="relative flex-shrink-0 mt-1 animate-pulse">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500 flex items-center justify-center shadow-lg">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
        </div>
        
        <div className="max-w-[85%] flex flex-col items-start">
          <div className="px-3 sm:px-5 py-2 sm:py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">AI is thinking...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Hydration-safe model select rendered only on client to avoid dev mismatch warnings
function ModelSelectPill({ selectedModel, setSelectedModel }: { selectedModel: AIModel; setSelectedModel: (m: AIModel) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Model Select"
          className="group relative flex items-center rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 pl-3 pr-2 h-8 sm:h-9"
        >
          <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-semibold">Model Select</span>
          <span className="ml-2 h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 flex items-center justify-center shadow-sm">
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-700 dark:text-gray-300" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-white dark:bg-black border-gray-200 dark:border-gray-700">
        <DropdownMenuLabel className="text-gray-600 dark:text-gray-400">Select Model</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
        {AI_MODELS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => setSelectedModel(model)}
            className={cn(
              "flex items-center gap-3 p-3 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
              selectedModel.id === model.id && "bg-gray-100 dark:bg-gray-800"
            )}
          >
            <div className="flex-1">
              <div className="font-medium text-black dark:text-white">{model.displayName}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{model.description}</div>
            </div>
            {selectedModel.id === model.id && <CheckCircle2 className="w-4 h-4 text-black dark:text-white" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const ClientModelSelectPill = dynamic(async () => ModelSelectPill, { ssr: false });

function AIAssistantPageInternal() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<{ name: string; size: number; type: string; url?: string } | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitializedRef = useRef(false);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, []);

  // Track scroll position to show a floating "scroll to bottom" button
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    if (!viewport) return;
    const onScroll = () => {
      const nearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 80;
      setShowScrollToBottom(!nearBottom);
    };
    viewport.addEventListener('scroll', onScroll, { passive: true } as any);
    onScroll();
    return () => viewport.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Focus input on mount and after sending messages
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Refocus input after message is sent
  useEffect(() => {
    if (!isLoading && !isTyping) {
      inputRef.current?.focus();
    }
  }, [isLoading, isTyping]);

  // Initialize from localStorage or with welcome message (run once)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    try {
      const raw = localStorage.getItem('aiAssistantMessages');
      if (raw && typeof raw === 'string' && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const revived: Message[] = parsed
            .filter(m => m && typeof m === 'object' && typeof m.content === 'string')
            .map(m => ({
              id: m.id || generateMessageId(),
              role: (m.role === 'user' || m.role === 'assistant') ? m.role : 'assistant',
              content: String(m.content || '').trim() || 'Message content unavailable',
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
              model: m.model || selectedModel.name,
              tokens: m.tokens || undefined
            }));
          
          if (revived.length > 0) {
            setMessages(revived);
            return;
          }
        }
      }
    } catch (error) {
      // Clear corrupted localStorage and fall back to welcome
      try {
        localStorage.removeItem('aiAssistantMessages');
      } catch {
        // Ignore localStorage clearing errors
      }
    }
    setMessages([{
      id: generateMessageId(),
      role: 'assistant',
      content: `Hello! 👋 I'm your AI Assistant powered by ${selectedModel.displayName}. I'm here to help you with questions, creative tasks, problem-solving, and more. What would you like to discuss today?`,
      timestamp: new Date(),
      model: selectedModel.name,
    }]);
  }, [selectedModel.displayName, selectedModel.name]);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      if (!messages || messages.length === 0) return;
      
      // Sanitize messages before storing
      const serializable = messages
        .filter(m => m && typeof m.content === 'string' && m.content.trim())
        .map(m => ({
          id: m.id || generateMessageId(),
          role: m.role,
          content: String(m.content).trim(),
          timestamp: (m.timestamp instanceof Date ? m.timestamp : new Date()).toISOString(),
          model: m.model || selectedModel.name,
          tokens: m.tokens
        }));
        
      if (serializable.length > 0) {
        const json = JSON.stringify(serializable);
        // Check if JSON is reasonable size (< 5MB)
        if (json.length < 5 * 1024 * 1024) {
          localStorage.setItem('aiAssistantMessages', json);
        }
      }
    } catch (error) {
      // If storage fails, try to clear old data
      try {
        localStorage.removeItem('aiAssistantMessages');
      } catch {
        // Ignore clearing errors
      }
    }
  }, [messages, selectedModel.name]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    // reset textarea height after sending
    if (inputRef.current) {
      inputRef.current.style.height = '56px';
    }
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Prepare the request data
      const requestData = {
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        model: selectedModel.name,
      };

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: Failed to get response`;
        try {
          const errorData = await response.json();
          if (typeof errorData.error === 'string' && errorData.error.trim()) {
            errorMessage = errorData.error.trim();
          }
        } catch {
          // Use default error message if JSON parsing fails
        }
        throw new Error(errorMessage);
      }

      let data: any = {};
      try {
        data = await response.json();
      } catch (error) {
        throw new Error('Failed to parse response data');
      }

      // Safely extract response content with fallbacks
      const content = (() => {
        try {
          if (typeof data.response === 'string' && data.response.trim()) {
            return data.response.trim();
          }
          if (typeof data.message === 'string' && data.message.trim()) {
            return data.message.trim();
          }
          return 'Sorry, I could not generate a response.';
        } catch {
          return 'Sorry, I could not generate a response.';
        }
      })();

      const assistantMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content,
        timestamp: new Date(),
        model: selectedModel.name,
        tokens: data.tokens || undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      if (error?.name === 'AbortError') {
        const canceledMessage: Message = {
          id: generateMessageId(),
          role: 'assistant',
          content: '⛔ Generation canceled.',
          timestamp: new Date(),
          model: selectedModel.name,
        };
        setMessages(prev => [...prev, canceledMessage]);
      } else {
        // Only log errors in development mode
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error sending message:', error);
        }
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : "I apologize, but I encountered an error. Please try again.";
        
        const errorChatMessage: Message = {
          id: generateMessageId(),
          role: 'assistant',
          content: `⚠️ ${errorMessage}`,
          timestamp: new Date(),
          model: selectedModel.name,
        };
        
        setMessages(prev => [...prev, errorChatMessage]);
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      abortControllerRef.current = null;
      // Clear any upload preview after sending/cancel
      setUploadPreview(prev => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return null;
      });
    }
  }, [input, messages, selectedModel, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([{
      id: generateMessageId(),
      role: 'assistant',
      content: `Hello! 👋 I'm your AI Assistant powered by ${selectedModel.displayName}. I'm here to help you with questions, creative tasks, problem-solving, and more. What would you like to discuss today?`,
      timestamp: new Date(),
      model: selectedModel.name,
    }]);
  }, [selectedModel.displayName, selectedModel.name]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  return (
    <div className="flex h-screen bg-white dark:bg-black">
      
      {/* Main Content */}
      <div className="w-full flex flex-col min-w-0" style={{ maxWidth: '100vw', boxSizing: 'border-box' }}>
        {/* Monochrome Header matching provided UI */}
        <header className="relative px-2 sm:px-3 py-2 sm:py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-black" style={{ minWidth: 0, maxWidth: '100%' }}>
          {/* Left action */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 h-10 w-10"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Right action */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 h-8 w-8 sm:h-10 sm:w-10"
              onClick={clearMessages}
              aria-label="Clear conversation"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          {/* Center title and model select */}
          <div className="flex flex-col items-center text-center">
            <h1 className="text-base sm:text-lg font-semibold text-black dark:text-white">Ai Assistant</h1>
            <div className="mt-1">
              <ClientModelSelectPill selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
            </div>
          </div>
        </header>

        {/* Monochrome Messages Area */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-black">
          <ScrollArea ref={scrollAreaRef} className="h-full">
            <div className="w-full max-w-3xl mx-auto px-2 sm:px-4" style={{ minWidth: 0, maxWidth: '100vw', boxSizing: 'border-box' }}>
              {messages.length === 0 ? (
                /* Welcome Screen - Monochrome */
                <div className="flex flex-col items-center justify-center h-full px-4 py-12">
                  <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    </div>
                    <h1 className="text-2xl font-semibold text-black dark:text-white mb-2">
                      How can I help you today?
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      I'm your AI assistant powered by {selectedModel.displayName}. Ask me anything!
                    </p>
                  </div>
                </div>
              ) : (
                /* Messages */
                <div className="py-2 sm:py-4 w-full" style={{ minWidth: 0, maxWidth: '100%' }}>
                  {messages.map((message) => (
                    <ErrorBoundary key={message.id}>
                      <div className="w-full overflow-hidden" style={{ minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
                        <ChatGPTMessageComponent message={message} selectedModel={selectedModel} />
                      </div>
                    </ErrorBoundary>
                  ))}
                  {isTyping && (
                    <ErrorBoundary>
                      <div className="w-full overflow-hidden" style={{ minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
                        <ChatGPTTypingIndicator selectedModel={selectedModel} />
                      </div>
                    </ErrorBoundary>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Monochrome Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-black">
          <div className="max-w-3xl mx-auto">
            {/* Suggestion chips - only show when no messages */}
            {messages.length === 0 && (
              <div className="mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="flex-shrink-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* File preview card */}
            {uploadPreview && (
              <div className="mb-3">
                <div className="flex items-center gap-3 p-3 rounded-3xl bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                  {uploadPreview.url ? (
                    <img src={uploadPreview.url} alt={uploadPreview.name} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                      <Image className="w-7 h-7 text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-700 dark:text-gray-200 text-lg font-medium truncate">{uploadPreview.name}</div>
                    <div className="text-gray-600 dark:text-gray-400">Size: ({formatFileSize(uploadPreview.size)})</div>
                  </div>
                  <button
                    aria-label="Remove file"
                    className="h-8 w-8 rounded-full bg-white/70 dark:bg-black/30 border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-white dark:hover:bg-black"
                    onClick={() => setUploadPreview(prev => { if (prev?.url) URL.revokeObjectURL(prev.url); return null; })}
                  >
                    <X className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            )}
            {/* Input Container - split pill with right inner upload and external send */}
            <div className="flex items-center gap-3">
              {/* Hidden file input for uploads */}
              <input
                id="ai-upload-input"
                type="file"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const isImage = file.type.startsWith('image/');
                    const isText = /text|json|markdown|javascript|typescript|python|plain/.test(file.type);
                    // Prepare preview
                    const url = isImage ? URL.createObjectURL(file) : undefined;
                    setUploadPreview({ name: file.name, size: file.size, type: file.type, url });
                    // Insert text content only for small text-like files; do NOT inject placeholder text for other files
                    if (isText && file.size <= 100 * 1024) {
                      const text = await file.text();
                      setInput((prev) => (prev ? prev + '\n\n' + text : text));
                    }
                  } finally {
                    e.currentTarget.value = '';
                  }
                }}
              />

              {/* Pill container */}
              <div className="relative flex-1">
                <div className="w-full rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 pr-14 pl-5 py-2.5">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onInput={(e) => {
                      const t = e.currentTarget as HTMLTextAreaElement;
                      t.style.height = '24px';
                      t.style.height = Math.min(t.scrollHeight, 200) + 'px';
                    }}
                    rows={1}
                    placeholder="Message"
                    disabled={isLoading}
                    className="w-full resize-none bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 min-h-[40px] max-h-[200px] no-zoom mobile-input"
                    style={{
                      fontSize: '18px',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      transform: 'scale(1)',
                      zoom: 1
                    }}
                  />
                </div>
                {/* Inner right upload circle */}
                <button
                  type="button"
                  aria-label="Upload"
                  onClick={() => document.getElementById('ai-upload-input')?.click()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white dark:bg-black border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center shadow-sm"
                >
                  <Upload className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* External send circle */}
              <Button
                onClick={input.trim() ? sendMessage : undefined}
                disabled={!input.trim() || isLoading}
                size="icon"
                aria-label={isLoading ? 'Cancel' : 'Send'}
                className={cn(
                  'h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700',
                  'border border-gray-300 dark:border-gray-700',
                  (!input.trim() || isLoading) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <XCircle className="w-5 h-5" onClick={cancelRequest} />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            
            {/* Footer */}
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-2">
              AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component wrapped with error boundary
export default function AIAssistantPage() {
  return (
    <ErrorBoundary 
      fallback={({ error }) => (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                AI Assistant Error
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The AI Assistant encountered an error. Please refresh the page to try again.
              </p>
              {process.env.NODE_ENV === 'development' && error && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {error.message}
                </p>
              )}
              <div className="flex gap-3 justify-center">
                <Button onClick={() => window.location.reload()}>
                  <Loader2 className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Home
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    >
      <AIAssistantPageInternal />
    </ErrorBoundary>
  );
}
