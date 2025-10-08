"use client";

import { useState, useEffect, useRef, useCallback, memo, ErrorInfo, Component, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Send, 
  User, 
  Sparkles, 
  Trash2, 
  Copy, 
  ArrowLeft,
  ChevronDown,
  MessageSquare,
  Zap,
  Rocket,
  Clock,
  Hash,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Brain,
  Lightbulb,
  Target,
  MessageCircle,
  FileText,
  Code2,
  ChevronLeft,
  ChevronRight,
  Code,
  Database,
  Terminal,
  Globe,
  Cpu,
  Wrench,
  Diamond,
  Coffee,
  Package
} from 'lucide-react';
import { showSuccessToast } from '@/lib/toast-utils';
import { cn } from '@/lib/utils';
import { generateMessageId } from '@/lib/id-utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={customStyle}
      >
        {children}
      </SyntaxHighlighter>
    </Suspense>
  );
});
import './ai-assistant.css';

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
        <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Something went wrong</h3>
            <p className="text-xs text-red-600 dark:text-red-400">
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
      <div className="not-prose my-2 sm:my-4 rounded-lg overflow-hidden border border-gray-700 group" style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', position: 'relative' }}>
        <div className="flex items-center justify-between bg-gray-800 px-2 sm:px-3 py-2 border-b border-gray-700" style={{ minWidth: 0 }}>
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <span className="text-sm sm:text-base flex-shrink-0">{overview.icon}</span>
            <span className="text-xs text-gray-300 font-mono truncate" style={{ maxWidth: '100px' }}>
              {language}
            </span>
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs px-1.5 sm:px-2 py-0 h-4 sm:h-5 flex-shrink-0",
                overview.complexity === 'Complex' ? "bg-red-900/30 text-red-300 border-red-700" :
                overview.complexity === 'Moderate' ? "bg-yellow-900/30 text-yellow-300 border-yellow-700" :
                "bg-green-900/30 text-green-300 border-green-700"
              )}
            >
              {overview.complexity}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 sm:h-7 sm:w-auto sm:px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700 active:bg-gray-600 transition-colors flex-shrink-0 min-w-[2rem] touch-manipulation"
            onClick={copyCode}
            aria-label="Copy code to clipboard"
          >
            <Copy className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
            <span className="sr-only">Copy</span>
          </Button>
        </div>
      
      {showOverview && (
        <div className="code-overview-section px-2 sm:px-3 py-2">
          <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-400 min-w-0 flex-1">
            <FileText className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{overview.lines} lines • {overview.features}</span>
          </div>
        </div>
      )}
      
      {/* Always show code - no expand/collapse */}
      <div className="relative" style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <div 
            ref={scrollRef}
            className="overflow-x-auto bg-gray-900 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
            style={{
              maxWidth: '100%',
              width: '100%',
              fontSize: '12px',
              lineHeight: '1.4',
              boxSizing: 'border-box'
            }}
            role="region"
            aria-label={`Code block in ${language}`}
            tabIndex={0}
          >
            <pre 
              className="p-3 sm:p-4 text-gray-100 font-mono text-sm leading-relaxed"
              style={{
                margin: 0,
                whiteSpace: 'pre',
                overflowWrap: 'normal',
                wordBreak: 'normal',
                fontSize: '12px',
                lineHeight: '1.4',
                maxWidth: '100%',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <LazyCodeHighlighter
                language={language}
                customStyle={{
                  margin: 0,
                  padding: 0,
                  background: 'transparent',
                  fontSize: 'inherit',
                  lineHeight: 'inherit'
                }}
              >
                {codeString}
              </LazyCodeHighlighter>
            </pre>
          </div>
          
          {/* Scroll Navigation Buttons */}
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 sm:h-7 sm:w-7 p-0 bg-gray-800/90 hover:bg-gray-700 active:bg-gray-600 text-gray-300 hover:text-white border border-gray-600 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/50 rounded-md transition-colors touch-manipulation"
              onClick={() => {
                const scrollContainer = scrollRef.current;
                if (scrollContainer) {
                  scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
                }
              }}
              onKeyDown={(e) => handleKeyNavigation(e, 'left')}
              title="Scroll left"
              aria-label="Scroll code left"
            >
              <ChevronLeft className="w-4 h-4 sm:w-3 sm:h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 sm:h-7 sm:w-7 p-0 bg-gray-800/90 hover:bg-gray-700 active:bg-gray-600 text-gray-300 hover:text-white border border-gray-600 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/50 rounded-md transition-colors touch-manipulation"
              onClick={() => {
                const scrollContainer = scrollRef.current;
                if (scrollContainer) {
                  scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
                }
              }}
              onKeyDown={(e) => handleKeyNavigation(e, 'right')}
              title="Scroll right"
              aria-label="Scroll code right"
            >
              <ChevronRight className="w-4 h-4 sm:w-3 sm:h-3" />
            </Button>
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
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      showSuccessToast("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = message.content;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        showSuccessToast("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to copy message:', fallbackError);
        }
        showSuccessToast("Failed to copy message");
      }
    }
  }, [message.content]);

  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "flex gap-3 sm:gap-4 px-2 py-3 sm:px-3 sm:py-4 w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-200/20">
            <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col gap-2 w-full min-w-0 message-container",
        isUser 
          ? "user-message items-end" 
          : "ai-message items-start"
      )}>
        <div 
          className={cn(
            "px-4 py-4 sm:px-5 sm:py-4 rounded-2xl relative group shadow-sm border overflow-hidden w-full min-w-0 message-bubble",
            isUser 
              ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-600/20 shadow-blue-500/10" 
              : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200/50 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700/50 shadow-gray-900/5"
          )}
          style={{ maxWidth: '100%', width: '100%', minWidth: 0, boxSizing: 'border-box' }}
        >
          <div className="prose prose-sm max-w-none dark:prose-invert break-words w-full" style={{ minWidth: 0, maxWidth: '100%', wordWrap: 'break-word', overflowWrap: 'anywhere', boxSizing: 'border-box' }}>
            <ReactMarkdown
              components={{
                code: ({ inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const codeString = String(children).replace(/\n$/, '');
                  
                  if (!inline && match) {
                    return (
                      <CodeBlock 
                        codeString={codeString} 
                        language={language} 
                        isUser={isUser}
                      />
                    );
                  }
                  
                  return (
                    <code
                      className={cn(
                        "px-1.5 py-0.5 rounded-md text-sm font-mono",
                        isUser 
                          ? "bg-white/20 text-white" 
                          : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
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
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="ml-2">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className={cn(
                    "border-l-4 pl-4 py-2 my-2 italic",
                    isUser 
                      ? "border-white/30 bg-white/10" 
                      : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800"
                  )}>
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic">{children}</em>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "underline hover:no-underline transition-colors",
                      isUser 
                        ? "text-white hover:text-white/80" 
                        : "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    )}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          
          {/* Copy button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 sm:opacity-0 transition-opacity touch-manipulation",
              "w-8 h-8 sm:w-6 sm:h-6 p-0 bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
            onClick={copyToClipboard}
            aria-label="Copy message to clipboard"
          >
            {copied ? (
              <Badge variant="secondary" className="text-xs">Copied!</Badge>
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </div>
        
        {/* Message metadata */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 px-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 opacity-60" />
            <span className="opacity-80">{message.timestamp.toLocaleTimeString()}</span>
          </div>
          {message.model && (
            <>
              <span className="opacity-40">•</span>
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3 opacity-60" />
                <span className="opacity-80">{message.model}</span>
              </div>
            </>
          )}
          {message.tokens && (
            <>
              <span className="opacity-40">•</span>
              <div className="flex items-center gap-1">
                <Hash className="w-3 h-3 opacity-60" />
                <span className="opacity-80">{message.tokens.total} tokens</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {isUser && (
        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-200/20">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
});

/**
 * Message Skeleton Loader
 */
const MessageSkeleton = memo(function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 p-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
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
          isUser ? "bg-blue-200 dark:bg-blue-800" : "bg-gray-200 dark:bg-gray-700"
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
    </motion.div>
  );
});

/**
 * Typing indicator with animation
 */
const TypingIndicator = memo(function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex gap-3 sm:gap-4 px-2 py-3 sm:px-3 sm:py-4 w-full justify-start"
    >
      <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-200/20">
          <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 animate-pulse" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/50 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700/50 rounded-2xl shadow-sm backdrop-filter backdrop-blur-sm">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-blue-500/70 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-blue-500/70 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-blue-500/70 rounded-full animate-bounce"></div>
        </div>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-blue-500 animate-pulse" />
          <span className="text-sm text-muted-foreground font-medium">AI is thinking...</span>
        </div>
      </div>
    </motion.div>
  );
});

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]); // This will be Gemini 2.5 Flash
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
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

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: generateMessageId(),
        role: 'assistant',
        content: `Hello! 👋 I'm your AI Assistant powered by ${selectedModel.displayName}. I'm here to help you with questions, creative tasks, problem-solving, and more. What would you like to discuss today?`,
        timestamp: new Date(),
        model: selectedModel.name,
      }]);
    }
  }, [messages.length, selectedModel.displayName, selectedModel.name]);

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

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
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

    } catch (error: unknown) {
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
    } finally {
      setIsLoading(false);
      setIsTyping(false);
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm min-h-[60px] sm:min-h-[64px]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Link href="/" className="flex-shrink-0">
            <Button variant="ghost" size="icon" className="w-9 h-9 sm:w-10 sm:h-10 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate leading-tight">AI Assistant</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block leading-tight">Powered by advanced AI</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Model Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1 sm:gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl border-gray-200 dark:border-gray-700 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 min-w-0">
                {renderModelIcon(selectedModel.icon)}
                <span className="hidden md:inline font-medium truncate max-w-[100px]">{selectedModel.displayName}</span>
                <span className="md:hidden text-xs truncate max-w-[50px]">{selectedModel.name.split('-')[0]}</span>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 opacity-50 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-xl border-gray-200 dark:border-gray-700 shadow-lg">
              <DropdownMenuLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Target className="w-4 h-4" />
                AI Model Selection
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
              {AI_MODELS.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={cn(
                    "cursor-pointer rounded-lg m-1 p-3 transition-colors",
                    selectedModel.id === model.id 
                      ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      selectedModel.id === model.id 
                        ? "bg-blue-100 dark:bg-blue-800" 
                        : "bg-gray-100 dark:bg-gray-700"
                    )}>
                      {renderModelIcon(model.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{model.displayName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{model.description}</div>
                    </div>
                    {selectedModel.id === model.id && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Active</Badge>
                      </div>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={clearMessages}
            className="w-8 h-8 sm:w-9 sm:h-9 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:border-red-700 dark:hover:text-red-400 rounded-xl transition-colors flex-shrink-0"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 min-h-0"
      >
        <div className="max-w-5xl xl:max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="space-y-3 sm:space-y-4">
            <AnimatePresence>
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
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-4 sm:px-6 sm:py-5 border-t bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg input-container">
        <div className="max-w-5xl xl:max-w-6xl mx-auto px-2 sm:px-3">
          <div className="flex items-end gap-3 sm:gap-4">
            <div className="relative flex-1 min-w-0">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoading ? "AI is responding..." : "Ask me anything..."}
                disabled={isLoading}
                className="h-12 sm:h-14 pr-12 sm:pr-14 rounded-2xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base resize-none"
              />
              <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
            </div>
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl font-medium transition-all transform hover:scale-105 active:scale-95 shadow-md flex-shrink-0 touch-manipulation",
                !input.trim() || isLoading
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed hover:scale-100"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white shadow-blue-500/30 hover:shadow-blue-500/50"
              )}
              aria-label={isLoading ? "Sending message..." : "Send message"}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </Button>
          </div>
          
          {/* Token counter or status */}
          <div className="flex items-center justify-between mt-3 sm:mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-shrink-0 opacity-70">{renderModelIcon(selectedModel.icon)}</div>
              <span className="truncate text-xs opacity-80">
                <span className="hidden sm:inline">Powered by </span>
                <span className="hidden md:inline">{selectedModel.displayName}</span>
                <span className="md:hidden">{selectedModel.name.split('-')[0]}</span>
              </span>
            </div>
            {messages.length > 1 && (
              <div className="flex items-center gap-1 flex-shrink-0 opacity-70">
                <MessageSquare className="w-3 h-3" />
                <span className="hidden sm:inline text-xs">{messages.length - 1} messages</span>
                <span className="sm:hidden text-xs">{messages.length - 1}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}