"use client";

import { useState, useEffect, useRef, useCallback, memo, ErrorInfo, Component, Suspense, useDeferredValue } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import NextImage from 'next/image';
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
  XCircle,
  User,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { showSuccessToast } from '@/lib/toast-utils';
import { cn } from '@/lib/utils';
import { 
  generateMessageId, 
  generateShareableRoute, 
  parseShareableRoute,
  isSessionExpired,
  getSessionAge,
  getSessionTimeRemaining,
  formatTimeRemaining,
  cleanupExpiredSessions
} from '@/lib/id-utils';
import Link from 'next/link';
import { formatFileSize } from '@/lib/format-file-size';
import { encryptString, decryptString, isEncryptedPayload, EncryptedBlobV1 } from '@/lib/secure-storage';

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
  attachment?: {
    url?: string;
    name: string;
    type: string;
    size: number;
    kind: 'image' | 'file';
  };
}

interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

function parseTokenUsage(value: unknown): TokenUsage | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const candidate = value as Partial<TokenUsage>;
  if (
    typeof candidate.prompt !== 'number' ||
    typeof candidate.completion !== 'number' ||
    typeof candidate.total !== 'number' ||
    !Number.isFinite(candidate.prompt) ||
    !Number.isFinite(candidate.completion) ||
    !Number.isFinite(candidate.total)
  ) {
    return undefined;
  }

  return {
    prompt: candidate.prompt,
    completion: candidate.completion,
    total: candidate.total,
  };
}

interface AIModel {
  id: string;
  name: string;
  displayName: string;
  description: string;
}

interface AssistantApiResponse {
  response?: unknown;
  message?: unknown;
  model?: unknown;
  tokens?: unknown;
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

const AI_MODEL: AIModel = {
  id: 'somleng-ai',
  name: 'Somleng AI',
  displayName: 'Somleng AI',
  description: 'Secure assistant service',
};

// Assistant suggestion chips (monochrome)
const SUGGESTIONS: string[] = [
  'Summarize this text',
  'Brainstorm ideas',
  'Explain this code',
  'Create an outline'
];


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
      case 'java': return <Code2 {...iconProps} />;
      case 'cpp': case 'c++': return <Cpu {...iconProps} />;
      case 'c': return <Code2 {...iconProps} />;
      case 'go': return <Rocket {...iconProps} />;
      case 'rust': return <Cpu {...iconProps} />;
      case 'php': return <Globe {...iconProps} />;
      case 'ruby': return <Code2 {...iconProps} />;
      case 'swift': return <Zap {...iconProps} />;
      case 'kotlin': return <Code2 {...iconProps} />;
      case 'html': return <Globe {...iconProps} />;
      case 'css': return <Sparkles {...iconProps} />;
      case 'sql': return <Database {...iconProps} />;
      case 'bash': case 'shell': return <Terminal {...iconProps} />;
      case 'json': return <FileText {...iconProps} />;
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
      // eslint-disable-next-line no-console
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
 * ChatGPT-style Message Component
 */
const ChatGPTMessageComponent = memo(function ChatGPTMessageComponent({ message, selectedModel, onImageOpen }: MessageComponentProps & { selectedModel: AIModel; onImageOpen?: (src: string, alt: string) => void }) {
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
              {/* User image attachment preview */}
              {isUser && message.attachment?.kind === 'image' && message.attachment.url && (
                <button
                  type="button"
                  onClick={() => onImageOpen?.(message.attachment!.url!, message.attachment!.name)}
                  className="mb-2 cursor-zoom-in focus:outline-none"
                  aria-label="Open image preview"
                >
                  <NextImage 
                    src={message.attachment.url} 
                    alt={message.attachment.name}
                    width={256}
                    height={256}
                    className="rounded-xl object-contain w-auto h-auto max-w-64 max-h-64"
                    unoptimized
                  />
                </button>
              )}
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

function ModelPill({ model }: { model: AIModel }) {
  return (
    <div
      aria-label={`Active model: ${model.displayName}`}
      title={model.description}
      className="inline-flex h-7 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20"
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{model.displayName}</span>
    </div>
  );
}

// Virtualized list (client-only)
const VirtualizedMessageList = dynamic(() => import('@/components/ai-assistant/optimized-message-list').then(mod => ({ default: mod.default })), { ssr: false, loading: () => <div className="center-loading text-gray-500">Loading…</div> });

function AIAssistantPageInternal() {
  const MAX_MESSAGES = 200;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  // Encryption - always enabled with device-based passphrase
  const [passphrase] = useState<string>('ai-assistant-device-key');
  const [lockedBlob, setLockedBlob] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const selectedModel = AI_MODEL;
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [listHeight, setListHeight] = useState(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionAge, setSessionAge] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [uploadPreview, setUploadPreview] = useState<{ name: string; size: number; type: string; url?: string; dataUrl?: string } | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPillRound, setIsPillRound] = useState(true);
  const saveTimerRef = useRef<number | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deferredMessages = useDeferredValue(messages);

  const readAsDataUrl = useCallback((file: File) => new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ''));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  }), []);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitializedRef = useRef(false);
  const attachmentUrlsRef = useRef<Set<string>>(new Set());
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Track tab visibility to pause operations when hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, []);

  // Track scroll position and measure viewport for virtualization
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement | null;
    if (!viewport) return;

    const onScroll = () => {
      const nearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 80;
      setShowScrollToBottom(!nearBottom);
    };
    viewport.addEventListener('scroll', onScroll, { passive: true } as any);
    onScroll();

    // Measure height with ResizeObserver
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setListHeight(Math.floor(entry.contentRect.height));
      }
    });
    ro.observe(viewport);

    return () => {
      viewport.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Focus input on mount and after sending messages
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Refocus input after message is sent and normalize pill shape
  useEffect(() => {
    if (!isLoading && !isTyping) {
      inputRef.current?.focus();
    }
    // Ensure pill shape reflects current height on state changes
    const t = inputRef.current;
    if (t) {
      const h = t.scrollHeight;
      setIsPillRound(h <= 64);
    }
  }, [isLoading, isTyping]);

  // Auto-generate shareable route on page load with timestamp
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;
    
    // Cleanup expired sessions on load
    cleanupExpiredSessions('chat_', SESSION_EXPIRY_MS);

    // Check if current session is expired
    const parsed = parseShareableRoute(pathname);
    if (parsed.id) {
      const updateSessionStatus = () => {
        const expired = isSessionExpired(parsed.id!, SESSION_EXPIRY_MS);
        setSessionExpired(expired);
        setSessionAge(getSessionAge(parsed.id!));
        
        if (!expired) {
          const remaining = getSessionTimeRemaining(parsed.id!, SESSION_EXPIRY_MS);
          if (remaining !== null) {
            setTimeRemaining(formatTimeRemaining(remaining));
          }
        } else {
          setTimeRemaining('Expired');
        }
      };
      
      // Initial check
      updateSessionStatus();
      
      // Update every 10 seconds
      const timer = setInterval(updateSessionStatus, 10000);
      return () => clearInterval(timer);
    }
    
    // Only generate route if we're on base /ai-assistant path
    if (pathname === '/ai-assistant') {
      const { route } = generateShareableRoute('/ai-assistant', { 
        prefix: 'chat',
        includeTimestamp: true // Enable timestamp for expiration
      });
      // Update URL without page reload
      window.history.replaceState(null, '', route);
      setSessionAge('Just now');
      setSessionExpired(false);
      setTimeRemaining(formatTimeRemaining(SESSION_EXPIRY_MS));
    }
  }, [pathname]);

  // Initialize from localStorage or with welcome message (run once)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const loadMessages = async () => {
      try {
        const enc = localStorage.getItem('aiAssistantEncrypted');
        if (isEncryptedPayload(enc)) {
          // Auto-decrypt with device passphrase
          try {
            const blob = JSON.parse(enc!) as EncryptedBlobV1;
            const json = await decryptString(blob, passphrase);
            const parsed = JSON.parse(json);
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
          } catch (e) {
            // Failed to decrypt, remove corrupted data
            try { localStorage.removeItem('aiAssistantEncrypted'); } catch {}
          }
        }
      } catch {}

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
        try { localStorage.removeItem('aiAssistantMessages'); } catch {}
      }

      setMessages([]);
    };

    loadMessages();
  }, [selectedModel.displayName, selectedModel.name, passphrase]);

  // Persist messages (always encrypted) - paused when tab hidden
  useEffect(() => {
    try {
      if (!messages || messages.length === 0) return;
      if (lockedBlob) return; // don't overwrite while locked
      if (!isTabVisible) return; // pause saves when tab is hidden
      
      const serializable = messages
        .slice(-MAX_MESSAGES)
        .filter(m => m && typeof m.content === 'string' && m.content.trim())
        .map(m => ({
          id: m.id || generateMessageId(),
          role: m.role,
          content: String(m.content).trim(),
          timestamp: (m.timestamp instanceof Date ? m.timestamp : new Date()).toISOString(),
          model: m.model || selectedModel.name,
          tokens: m.tokens,
          attachment: m.attachment ? { ...m.attachment, url: undefined } : undefined
        }));
        
      if (serializable.length > 0) {
        const json = JSON.stringify(serializable);
        if (json.length < 5 * 1024 * 1024) {
          const idle = (window as any).requestIdleCallback as undefined | ((cb: () => void, opts?: any) => number);
          if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
          saveTimerRef.current = window.setTimeout(async () => {
            const writer = async () => {
              try {
                const blob = await encryptString(json, passphrase);
                localStorage.setItem('aiAssistantEncrypted', JSON.stringify(blob));
                try { localStorage.removeItem('aiAssistantMessages'); } catch {}
              } catch (e) { /* noop */ }
            };
            if (typeof idle === 'function') { idle(() => { writer(); }, { timeout: 800 }); } else { await writer(); }
          }, 900);
        }
      }
    } catch (error) {
      try { localStorage.removeItem('aiAssistantMessages'); } catch {}
    }
  }, [messages, selectedModel.name, lockedBlob, isTabVisible, passphrase]);

  const sendMessage = useCallback(async () => {
    if ((!input.trim() && !uploadedFile) || isLoading) return;

    let usedAttachmentUrl: string | undefined;
    const attachment: Message['attachment'] | undefined = uploadedFile ? {
      url: uploadPreview?.dataUrl || uploadPreview?.url,
      name: uploadedFile.name,
      type: uploadedFile.type,
      size: uploadedFile.size,
      kind: uploadedFile.type.startsWith('image/') ? 'image' : 'file'
    } : undefined;
    if (attachment?.url) {
      usedAttachmentUrl = attachment.url;
      attachmentUrlsRef.current.add(attachment.url);
    }

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: input.trim() || (uploadPreview ? `Attached file: ${uploadPreview.name} (${uploadPreview.type || 'unknown'}, ${uploadPreview.size} bytes).` : ''),
      timestamp: new Date(),
      attachment
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
      const baseMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // If a file is attached, send multipart/form-data
      let response: Response;
      if (uploadedFile) {
        const form = new FormData();
        form.append('messages', JSON.stringify(baseMessages));
        form.append('file', uploadedFile);
        response = await fetch('/api/ai-assistant', {
          method: 'POST',
          body: form,
          signal: abortControllerRef.current.signal,
        });
      } else {
        const requestData = { messages: baseMessages };
        response = await fetch('/api/ai-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
          signal: abortControllerRef.current.signal,
        });
      }

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

      let data: AssistantApiResponse = {};
      try {
        data = (await response.json()) as AssistantApiResponse;
      } catch {
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
        model:
          typeof data.model === 'string' && data.model.trim()
            ? data.model.trim()
            : selectedModel.name,
        tokens: parseTokenUsage(data.tokens),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
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
          // eslint-disable-next-line no-console
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
        if (prev?.url && prev.url !== usedAttachmentUrl) {
          URL.revokeObjectURL(prev.url);
        }
        return null;
      });
      setUploadedFile(null);
    }
  }, [input, messages, selectedModel, isLoading, uploadedFile, uploadPreview]);

  const clearMessages = useCallback(() => {
    // Revoke any object URLs used for attachments
    attachmentUrlsRef.current.forEach(url => {
      try { URL.revokeObjectURL(url); } catch {}
    });
    attachmentUrlsRef.current.clear();

    setMessages([]);
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isComposing) return;
    const meta = e.metaKey || e.ctrlKey;
    if ((e.key === 'Enter' && !e.shiftKey) || (meta && e.key === 'Enter')) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === 'Escape' && isLoading) {
      e.preventDefault();
      cancelRequest();
    }
  }, [sendMessage, isComposing, isLoading, cancelRequest]);

  // Cleanup on unmount (revoke preview URL, clear timers and attachment URLs)
  useEffect(() => {
    return () => {
      if (uploadPreview?.url) URL.revokeObjectURL(uploadPreview.url);
      attachmentUrlsRef.current.forEach(url => { try { URL.revokeObjectURL(url); } catch {} });
      attachmentUrlsRef.current.clear();
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [uploadPreview?.url]);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] bg-slate-50 dark:bg-slate-950 lg:h-dvh">
      
      {/* Main Content */}
      <div className="flex w-full min-w-0 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-slate-950 dark:text-white">
              AI Assistant
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Ask, create, and explore
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ModelPill model={selectedModel} />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
              onClick={clearMessages}
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Session Expiration Banner */}
        {sessionExpired && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Session Expired
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  This conversation is older than 30 days and may be removed soon. Created {sessionAge}.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const { route } = generateShareableRoute('/ai-assistant', {
                    prefix: 'chat',
                    includeTimestamp: true
                  });
                  window.location.href = route;
                }}
                className="text-yellow-900 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
              >
                Start New
              </Button>
            </div>
          </div>
        )}

        {/* Session Age Indicator with Countdown */}
        {!sessionExpired && sessionAge && sessionAge !== 'Just now' && (
          <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 px-4 py-1">
            <div className="max-w-3xl mx-auto text-xs text-gray-500 dark:text-gray-400 text-center">
              Session created {sessionAge}
              {timeRemaining && (
                <span className="ml-2 text-orange-600 dark:text-orange-400 font-medium">
                  • Expires in {timeRemaining}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="relative flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
          <ScrollArea ref={scrollAreaRef} className="h-full">
            <div className="mx-auto w-full max-w-4xl px-3 sm:px-6" style={{ minWidth: 0, boxSizing: 'border-box' }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-4 py-12">
                  <div className="text-center max-w-md">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                      How can I help you today?
                    </h2>
                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                      I'm your AI assistant powered by {selectedModel.displayName}. Ask me anything!
                    </p>
                  </div>
                </div>
              ) : (
                /* Messages */
                <div className="py-2 sm:py-4 pb-28 sm:pb-32 w-full" style={{ minWidth: 0, maxWidth: '100%' }}>
                  {deferredMessages.length > 40 && listHeight > 0 ? (
                    <Suspense fallback={<div className="center-loading text-gray-500">Loading messages…</div>}>
                      <VirtualizedMessageList messages={deferredMessages} isTyping={isTyping} height={listHeight} />
                    </Suspense>
                  ) : (
                    <>
                      {deferredMessages.map((message) => (
                        <ErrorBoundary key={message.id}>
                          <div className="w-full overflow-hidden" style={{ minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
                            <ChatGPTMessageComponent 
                              message={message} 
                              selectedModel={selectedModel} 
                              onImageOpen={(src, alt) => setLightbox({ src, alt })}
                            />
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
                    </>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Scroll-to-bottom floating button */}
          {showScrollToBottom && (
            <button
              aria-label="Scroll to bottom"
              onClick={scrollToBottom}
              className="absolute bottom-3 right-3 z-10 h-10 w-10 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-500"
            >
              <ChevronDown className="w-5 h-5 mx-auto" />
            </button>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950 sm:p-4">
          <div className="mx-auto max-w-4xl">
            {/* Suggestion chips - only show when no messages */}
            {messages.length === 0 && (
              <div className="mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="flex-shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
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
                  {uploadPreview.url || uploadPreview.dataUrl ? (
                    <NextImage src={uploadPreview.dataUrl || uploadPreview.url!} alt={uploadPreview.name} width={64} height={64} className="w-16 h-16 rounded-xl object-cover" unoptimized />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                      <ImageIcon className="w-7 h-7 text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-700 dark:text-gray-200 text-lg font-medium truncate">{uploadPreview.name}</div>
                    <div className="text-gray-600 dark:text-gray-400">Size: ({formatFileSize(uploadPreview.size)})</div>
                  </div>
                  <button
                    aria-label="Remove file"
                    className="h-8 w-8 rounded-full bg-white/70 dark:bg-black/30 border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-white dark:hover:bg-black"
                    onClick={() => { setUploadPreview(prev => { if (prev?.url) URL.revokeObjectURL(prev.url); return null; }); setUploadedFile(null); }}
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
                ref={fileInputRef}
                onChange={async (e) => {
                  const inputEl = fileInputRef.current as HTMLInputElement | null;
                  const file = (e.target as HTMLInputElement)?.files?.[0] ?? inputEl?.files?.[0];
                  if (!file) return;
                  if (file.size > MAX_FILE_SIZE) { setFileError("File too large (max 10MB)"); return; }
                  setFileError(null);
                  try {
                    const isImage = file.type.startsWith('image/');
                    const isText = /text|json|markdown|javascript|typescript|python|plain/.test(file.type);
                    // Prepare preview and retain file
                    const url = isImage ? URL.createObjectURL(file) : undefined;
                    let dataUrl: string | undefined;
                    if (isImage && file.size <= 2 * 1024 * 1024) {
                      try { dataUrl = await readAsDataUrl(file); } catch {}
                    }
                    setUploadPreview({ name: file.name, size: file.size, type: file.type, url, dataUrl });
                    setUploadedFile(file);
                    // Insert text content only for small text-like files; do NOT inject placeholder text for other files
                    if (isText && file.size <= 100 * 1024) {
                      const text = await file.text();
                      setInput((prev) => (prev ? prev + '\n\n' + text : text));
                    }
                  } finally {
                    try { if (inputEl) inputEl.value = ''; } catch {}
                  }
                }}
              />

              {/* Pill container */}
              <div 
                className={cn(
                  "relative flex-1",
                  isDragging && "outline outline-2 outline-dashed outline-gray-400 rounded-3xl"
                )}
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (!file) return;
                  if (file.size > MAX_FILE_SIZE) { setFileError("File too large (max 10MB)"); return; }
                  const isImage = file.type.startsWith('image/');
                  const url = isImage ? URL.createObjectURL(file) : undefined;
                  let dataUrl: string | undefined;
                  if (isImage && file.size <= 2 * 1024 * 1024) {
                    readAsDataUrl(file).then((d) => setUploadPreview(prev => ({ ...(prev || {} as any), name: file.name, size: file.size, type: file.type, url, dataUrl: d })) ).catch(() => {});
                  }
                  setUploadPreview({ name: file.name, size: file.size, type: file.type, url, dataUrl });
                  setUploadedFile(file);
                }}
              >
                <div className={cn(
                  "w-full border border-slate-300 bg-white py-2.5 pl-5 pr-16 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900",
                  isPillRound ? "rounded-[9999px]" : "rounded-2xl"
                )}>
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    onInput={(e) => {
                      const t = e.currentTarget as HTMLTextAreaElement;
                      t.style.height = '24px';
                      const max = 400;
                      const newH = Math.min(t.scrollHeight, max);
                      t.style.height = newH + 'px';
                      t.style.overflowY = t.scrollHeight > max ? 'auto' : 'hidden';
                      setIsPillRound(newH <= 64);
                    }}
                    onPaste={(e) => {
                      const items = Array.from(e.clipboardData?.files || []);
                      const file = items[0];
                      if (!file) return;
                      if (file.size > MAX_FILE_SIZE) { setFileError("File too large (max 10MB)"); return; }
                      const isImage = file.type.startsWith('image/');
                      const url = isImage ? URL.createObjectURL(file) : undefined;
                      let dataUrl: string | undefined;
                      if (isImage && file.size <= 2 * 1024 * 1024) {
                        readAsDataUrl(file).then((d) => setUploadPreview(prev => ({ ...(prev || {} as any), name: file.name, size: file.size, type: file.type, url, dataUrl: d })) ).catch(() => {});
                      }
                      setUploadPreview({ name: file.name, size: file.size, type: file.type, url, dataUrl });
                      setUploadedFile(file);
                    }}
                    rows={1}
                    placeholder="Type your message…"
                    aria-label="AI Assistant message input"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    disabled={isLoading}
                    className="w-full resize-none bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 min-h-[40px] max-h-[320px] sm:max-h-[400px] no-zoom mobile-input leading-6"
                    style={{
                      fontSize: '16px',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      transform: 'scale(1)',
                      zoom: 1
                    }}
                  />
                </div>
                {fileError && (
                  <div className="mt-1 text-xs text-red-600 dark:text-red-400">{fileError}</div>
                )}
                {/* Inner right upload circle */}
                <button
                  type="button"
                  aria-label="Upload"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <Upload className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* External send circle */}
              <Button
                onClick={(input.trim() || uploadedFile) ? sendMessage : undefined}
                disabled={(!input.trim() && !uploadedFile) || isLoading}
                size="icon"
                aria-label={isLoading ? 'Cancel' : 'Send'}
                className={cn(
                  'h-12 w-12 rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-500',
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
            <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
              AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <NextImage
              src={lightbox.src}
              alt={lightbox.alt}
              width={1200}
              height={1200}
              className="object-contain w-auto h-auto max-w-[90vw] max-h-[90vh] rounded-lg"
              unoptimized
            />
            <button
              aria-label="Close preview"
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full px-3 py-1 text-sm"
              onClick={() => setLightbox(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

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
