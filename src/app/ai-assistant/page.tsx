"use client";

import { useState, useEffect, useRef, useCallback, memo, ErrorInfo, Component, Suspense } from 'react';
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
  Mic2,
  XCircle,
  Target
} from 'lucide-react';
import { showSuccessToast } from '@/lib/toast-utils';
import { cn } from '@/lib/utils';
import { generateMessageId } from '@/lib/id-utils';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

// Monochrome Prism theme to enforce black/gray/white syntax highlighting
const monochromePrism: any = {
  'code[class*="language-"]': {
    color: '#E5E5E5',
    background: 'transparent',
    textShadow: 'none',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '0.85rem',
  },
  'pre[class*="language-"]': {
    color: '#E5E5E5',
    background: 'transparent',
    margin: 0,
    padding: 0,
    overflow: 'auto',
  },
  'token.comment': { color: '#A3A3A3' },
  'token.prolog': { color: '#A3A3A3' },
  'token.doctype': { color: '#A3A3A3' },
  'token.cdata': { color: '#A3A3A3' },
  'token.punctuation': { color: '#D4D4D4' },
  'token.property': { color: '#D4D4D4' },
  'token.tag': { color: '#D4D4D4' },
  'token.boolean': { color: '#D4D4D4' },
  'token.number': { color: '#D4D4D4' },
  'token.constant': { color: '#D4D4D4' },
  'token.symbol': { color: '#D4D4D4' },
  'token.selector': { color: '#FFFFFF' },
  'token.attr-name': { color: '#FFFFFF' },
  'token.string': { color: '#E5E5E5' },
  'token.char': { color: '#E5E5E5' },
  'token.builtin': { color: '#E5E5E5' },
  'token.inserted': { color: '#E5E5E5' },
  'token.operator': { color: '#D4D4D4' },
  'token.entity': { color: '#D4D4D4', cursor: 'help' },
  'token.url': { color: '#D4D4D4' },
  'token.atrule': { color: '#FFFFFF' },
  'token.keyword': { color: '#FFFFFF' },
  'token.function': { color: '#FFFFFF' },
  'token.deleted': { color: '#BFBFBF' },
  'token.regex': { color: '#BFBFBF' },
  'token.important': { color: '#FFFFFF', fontWeight: 'bold' },
  'token.bold': { fontWeight: 'bold' },
  'token.italic': { fontStyle: 'italic' },
};

/**
 * Skeleton loader for code blocks
 */
const CodeSkeleton = memo(function CodeSkeleton({ lines = 5 }: { lines?: number }) {
  return (
    <div className="animate-pulse bg-gray-800 rounded p-4">
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <div 
            key={`skeleton-line-${i}`}
            className={`h-4 bg-gray-700 rounded ${
              i === 0 ? 'w-3/4' : 
              i === 1 ? 'w-1/2' : 
              i === lines - 1 ? 'w-2/3' :
              'w-5/6'
            }`}
          />
        ))}
      </div>
    </div>
  );
});

/**
 * Lazy loading wrapper for syntax highlighter with loading skeleton
 */
const LazyCodeHighlighter = memo(function LazyCodeHighlighter({
  language,
  children,
  customStyle
}: LazyCodeHighlighterProps) {
  const lineCount = children.split('\n').length;
  
  return (
    <Suspense fallback={<CodeSkeleton lines={Math.min(lineCount, 10)} />}>
      <SyntaxHighlighter
        style={monochromePrism}
        language={language}
        PreTag="div"
        customStyle={customStyle}
      >
        {children}
      </SyntaxHighlighter>
    </Suspense>
  );
});

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

interface LazyCodeHighlighterProps {
  language: string;
  children: string;
  customStyle: React.CSSProperties;
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
    displayName: 'Gemini 2.0 Flash (Experimental)',
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
            <pre className="p-3 text-gray-100 font-mono text-xs leading-tight m-0">
              <LazyCodeHighlighter
                language={language}
                customStyle={{
                  margin: 0,
                  padding: 0,
                  background: 'transparent',
                  fontSize: '11px',
                  lineHeight: '1.3'
                }}
              >
                {codeString}
              </LazyCodeHighlighter>
            </pre>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
});

/**
 * Message Component with markdown rendering and copy functionality
 */
const MessageComponent = memo(function MessageComponent({ message }: MessageComponentProps) {
  const isUser = message.role === 'user';

  return (
    <div className="mb-4 sm:mb-8 px-2 sm:px-4">
      <div className={cn(
        "flex items-start gap-2 sm:gap-4",
        isUser ? "justify-end" : "justify-start"
      )}>
        {/* AI Avatar - Enhanced */}
        {!isUser && (
          <div className="relative flex-shrink-0 mt-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
          </div>
        )}
        
      <div className={cn(
        "max-w-[90%] sm:max-w-[80%] md:max-w-[42rem] flex flex-col",
        isUser ? "items-end self-end" : "items-start self-start"
      )}>
          {/* Enhanced Message bubble */}
          <div className={cn(
              "px-3 sm:px-4 py-2 sm:py-3 rounded-2xl break-words overflow-hidden border shadow-sm relative group mobile-message-bubble",
              isUser 
                ? "bg-gray-900 text-white border-gray-800" 
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700"
            )}>
            <ReactMarkdown
              components={{
                code: ({ inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const codeString = String(children).replace(/\n$/, '');
                  
                  if (!inline && match) {
                    return (
                      <div className="my-2 rounded-lg overflow-hidden bg-gray-900 border border-gray-600 w-full">
                        <div className="flex items-center justify-between bg-gray-800 px-3 py-1.5 text-xs">
                          <span className="text-gray-300 font-mono">{language}</span>
                          <button 
                            className="text-gray-400 hover:text-white transition-colors"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(codeString);
                              } catch (error) {
                                // Fallback for older browsers
                                const textArea = document.createElement('textarea');
                                textArea.value = codeString;
                                document.body.appendChild(textArea);
                                textArea.select();
                                document.execCommand('copy');
                                document.body.removeChild(textArea);
                              }
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <pre className="p-3 text-sm text-gray-100 font-mono leading-relaxed whitespace-pre">
                            <code>{codeString}</code>
                          </pre>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <code
                      className={cn(
                        "px-1 py-0.5 rounded text-sm font-mono",
                        isUser 
                          ? "bg-white/20 text-white" 
                          : "bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="ml-0 break-words">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            {/* Copy entire assistant message */}
            {!isUser && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-lg bg-gray-100/60 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-600"
                  aria-label="Copy message"
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
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Enhanced timestamp and metadata */}
          <div className={cn(
              "mt-2 sm:mt-3 flex items-center gap-2 text-xs",
              isUser ? "justify-end" : "justify-start"
            )}>
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
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

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]); // This will be Gemini 2.5 Flash
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
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
      if (raw) {
        const parsed = JSON.parse(raw) as Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
        const revived: Message[] = parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
        setMessages(revived);
        return;
      }
    } catch (e) {
      // ignore and fall back to welcome
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
      if (messages.length === 0) return;
      const serializable = messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() }));
      localStorage.setItem('aiAssistantMessages', JSON.stringify(serializable));
    } catch {
      // ignore storage errors
    }
  }, [messages]);

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
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to get response`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: data.response || data.message || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
        model: selectedModel.name,
        tokens: data.tokens,
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
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Mobile-optimized Header */}
      <header className="flex-shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm sticky top-0 z-50">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left section - Back button and title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-r from-gray-700 to-gray-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    AI Assistant
                  </h1>
                </div>
              </div>
            </div>
            
            {/* Right section - Model selector and clear button */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 touch-manipulation"
                  >
                    {renderModelIcon(selectedModel.icon)}
                    <span className="ml-1 sm:ml-2 hidden sm:inline text-xs sm:text-sm truncate max-w-20">
                      {selectedModel.name.replace('gemini-', '')}
                    </span>
                    <ChevronDown className="w-3 h-3 ml-0.5 sm:ml-1 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 sm:w-72">
                  <DropdownMenuLabel>Select Model</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {AI_MODELS.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => setSelectedModel(model)}
                      className="touch-manipulation"
                    >
                      <div className="flex items-center gap-2 w-full">
                        {renderModelIcon(model.icon)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{model.displayName}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">{model.description}</div>
                        </div>
                        {selectedModel.id === model.id && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={clearMessages} 
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors touch-manipulation"
                aria-label="Clear messages"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile-optimized Messages Area */}
      <div className="flex-1 overflow-hidden bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
            {/* Date header */}
            <div className="flex justify-center mb-4 sm:mb-8">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                Today
              </div>
            </div>
            
            {/* Messages with mobile-optimized spacing */}
            <div className="space-y-3 sm:space-y-6 max-w-4xl mx-auto">
              {messages.map((message) => (
                <ErrorBoundary key={message.id}>
                  <MessageComponent message={message} />
                </ErrorBoundary>
              ))}
              {isTyping && (
                <ErrorBoundary>
                  <TypingIndicator />
                </ErrorBoundary>
              )}
            </div>
            
            {/* Bottom spacing for mobile input area */}
            <div className="h-4 sm:h-6"></div>
          </div>
        </ScrollArea>

        {/* Mobile-optimized Scroll to bottom button */}
        {showScrollToBottom && (
          <div className="fixed right-3 sm:right-6 bottom-24 sm:bottom-28 md:bottom-24 z-40">
            <Button
              size="icon"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg touch-manipulation bg-primary hover:bg-primary/90"
              aria-label="Scroll to bottom"
              onClick={scrollToBottom}
            >
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Mobile-optimized Input Area */}
      <div className="flex-none bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-700/80 shadow-lg pb-[env(safe-area-inset-bottom)] safe-area-bottom">
        <div className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-200 focus-within:shadow-2xl focus-within:border-gray-500 dark:focus-within:border-gray-400">
              {/* Mobile-optimized suggestion chips */}
              <div className="px-2 sm:px-3 pt-2 sm:pt-3 pb-1 sm:pb-2">
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Suggestion prompts">
                  {SUGGESTIONS.map((s, index) => (
                    <button
                      key={s}
                      type="button"
                      className="shrink-0 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-colors touch-manipulation"
                      onClick={() => setInput(s)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowRight' && index < SUGGESTIONS.length - 1) {
                          const nextButton = e.currentTarget.nextElementSibling as HTMLButtonElement;
                          nextButton?.focus();
                        } else if (e.key === 'ArrowLeft' && index > 0) {
                          const prevButton = e.currentTarget.previousElementSibling as HTMLButtonElement;
                          prevButton?.focus();
                        }
                      }}
                      aria-label={`Use suggestion: ${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={(e) => {
                  const t = e.currentTarget;
                  const minHeight = window.innerWidth < 640 ? 48 : 56; // Smaller on mobile
                  const maxHeight = window.innerWidth < 640 ? 120 : 200; // Smaller on mobile
                  t.style.height = minHeight + 'px';
                  t.style.height = Math.min(t.scrollHeight, maxHeight) + 'px';
                }}
                rows={1}
                placeholder={isLoading ? "AI is crafting a response..." : "Ask me anything..."}
                disabled={isLoading}
                aria-label="Chat message input"
                aria-describedby={input.length > 0 ? "char-count" : undefined}
                className="min-h-[48px] sm:min-h-[56px] max-h-[120px] sm:max-h-[200px] px-3 sm:px-5 pr-20 sm:pr-24 text-sm sm:text-base bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none touch-manipulation"
              />
              
              {/* Mobile-optimized Input actions */}
              <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
                {isLoading && (
                  <Button
                    onClick={cancelRequest}
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl touch-manipulation"
                    aria-label="Stop generating"
                  >
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                )}
                {input.trim() ? (
                  <div className="transition-all duration-200">
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading}
                      size="icon"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
                      aria-label="Send message"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="transition-all duration-200">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
                      aria-label="Voice message"
                    >
                      <Mic2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Mobile-optimized bottom indicator */}
            <div className="flex items-center justify-end mt-2 sm:mt-3 px-1">
              {input.length > 0 && (
                <div
                  id="char-count"
                  className="text-xs text-gray-400 dark:text-gray-500 transition-opacity duration-200"
                  aria-live="polite"
                >
                  {input.length} character{input.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}