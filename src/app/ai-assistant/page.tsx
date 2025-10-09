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
  Package,
  Mic2
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
      <div className="my-2 rounded-lg overflow-hidden bg-gray-900 border border-gray-700 w-full max-w-full">
        {/* Simplified header */}
        <div className="flex items-center justify-between bg-gray-800 px-3 py-1.5 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300 font-mono">{language}</span>
            <Badge 
              variant="secondary" 
              className="text-xs px-1.5 py-0 h-4 bg-green-900/30 text-green-300 border-green-700"
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
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mb-8 px-4"
    >
      <div className={cn(
        "flex items-start gap-4",
        isUser ? "justify-end" : "justify-start"
      )}>
        {/* AI Avatar - Enhanced */}
        {!isUser && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3, ease: "backOut" }}
            className="relative flex-shrink-0 mt-1"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
          </motion.div>
        )}
        
        <div className={cn(
          "max-w-[85%] flex flex-col",
          isUser ? "items-end" : "items-start"
        )}>
          {/* Enhanced Message bubble */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className={cn(
              "px-5 py-4 rounded-3xl break-words overflow-hidden shadow-lg border backdrop-blur-sm relative group",
              isUser 
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-400/30 shadow-blue-500/25" 
                : "bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 border-gray-200/50 dark:border-gray-700/50 shadow-gray-900/10"
            )}
          >
            <ReactMarkdown
              components={{
                code: ({ inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const codeString = String(children).replace(/\n$/, '');
                  
                  if (!inline && match) {
                    return (
                      <div className="my-2 -mx-4 rounded-lg overflow-hidden bg-gray-900 border border-gray-600">
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
          </motion.div>
          
          {/* Enhanced timestamp and metadata */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className={cn(
              "mt-3 flex items-center gap-2 text-xs",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {message.model && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-blue-500" />
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{message.model}</span>
                  </div>
                </>
              )}
              {message.tokens && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-green-500" />
                    <span className="text-green-600 dark:text-green-400 font-medium">{message.tokens.total}</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8 px-4"
    >
      <div className="flex items-start gap-4 justify-start">
        {/* Enhanced AI Avatar */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex-shrink-0 mt-1"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Brain className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
        </motion.div>
        
        <div className="max-w-[85%] flex flex-col items-start">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <motion.div 
                  className="w-2 h-2 bg-blue-500 rounded-full"
                  animate={{ y: [-2, 2, -2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.div 
                  className="w-2 h-2 bg-purple-500 rounded-full"
                  animate={{ y: [-2, 2, -2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div 
                  className="w-2 h-2 bg-pink-500 rounded-full"
                  animate={{ y: [-2, 2, -2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">AI is thinking...</span>
            </div>
          </motion.div>
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
    <motion.div 
      className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header */}
      <motion.header 
        className="flex-shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Online • Ready to help</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800">
                    {renderModelIcon(selectedModel.icon)}
                    <span className="ml-2 hidden sm:inline text-sm">{selectedModel.name}</span>
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Select Model</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {AI_MODELS.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => setSelectedModel(model)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {renderModelIcon(model.icon)}
                        <div className="flex-1">
                          <div className="font-medium">{model.displayName}</div>
                          <div className="text-xs text-muted-foreground">{model.description}</div>
                        </div>
                        {selectedModel.id === model.id && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" size="icon" onClick={clearMessages} className="w-9 h-9 rounded-xl border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Messages */}
      <motion.div 
        className="flex-1 overflow-hidden bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Date header */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                Today
              </div>
            </div>
            
            {/* Messages */}
            <div className="space-y-6">
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
            
            {/* Bottom spacing to prevent messages from being hidden behind input */}
            <div className="h-4"></div>
          </div>
        </ScrollArea>
      </motion.div>

      {/* Input Area */}
      <motion.div 
        className="flex-none bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-700/80 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="max-w-3xl mx-auto p-4">
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-200 hover:shadow-2xl focus-within:shadow-2xl focus-within:border-blue-400 dark:focus-within:border-blue-500">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoading ? "AI is crafting a response..." : "Ask me anything..."}
                disabled={isLoading}
                className="h-14 px-5 pr-16 text-base bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
              />
              
              {/* Input actions */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {input.trim() ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading}
                      size="icon"
                      className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                      aria-label="Send message"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-all duration-200 hover:scale-105 active:scale-95"
                      aria-label="Voice message"
                    >
                      <Mic2 className="w-5 h-5" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
            
            {/* Bottom indicator */}
            <div className="flex items-center justify-between mt-3 px-1">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span>Gemini 2.5 Flash</span>
                </div>
              </div>
              
              {input.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-gray-400 dark:text-gray-500"
                >
                  {input.length} characters
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}