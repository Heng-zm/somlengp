"use client";

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AIModel } from '@/components/shared/model-selector';
import {
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Trash2, 
  Copy, 
  RefreshCw,
  ArrowLeft,
  Settings,
  ChevronDown,
  FileText,
  Paperclip,
  X,
  Image,
  File
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';
import { cn } from '@/lib/utils';
import { generateMessageId } from '@/lib/id-utils';
import { motion, AnimatePresence } from 'framer-motion';
// TODO: Consider lazy loading framer-motion for better initial load performance
import { AIFormat, formatAIResponse } from '@/lib/ai-formatter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Performance optimization needed: Consider memoizing inline styles, inline event handlers
// Use useMemo for objects/arrays and useCallback for functions


interface FileAttachment {
  name: string;
  type: string;
  size: number;
  content: string; // base64 encoded content
  url?: string; // preview URL for images
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  format?: AIFormat; // format used for assistant messages
  attachments?: FileAttachment[]; // file attachments
}


const AI_MODELS: AIModel[] = [
  {
    id: 'gemini-1.5-flash',
    name: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    description: 'Fast and efficient for most tasks',
    icon: '⚡'
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'gemini-2.0-flash-exp',
    displayName: 'Gemini 2.0 Flash (Experimental)',
    description: 'Latest experimental model with enhanced capabilities',
    icon: '✨'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    description: 'Next-generation model with improved performance and capabilities',
    icon: '🚀'
  }
];

const AIAssistantPageComponent = function AIAssistantPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);
  const [responseFormat, setResponseFormat] = useState<AIFormat>('markdown');
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  // Text styling options
  const [enableBold] = useState<boolean>(true);
  const [enableItalic] = useState<boolean>(true);
  const [enableInlineCode] = useState<boolean>(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      // Find the viewport element within the scroll area
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Initialize with welcome message
  const initializeWelcomeMessage = useCallback(() => {
    if (messages.length === 0) {
      setMessages([{
        id: generateMessageId(),
        role: 'assistant',
        content: `Hello! 👋 I'm your AI Assistant powered by ${selectedModel.displayName}. I'm here to help you with questions, creative tasks, problem-solving, and more. What would you like to discuss today?`,
        timestamp: new Date(),
      }]);
    }
  }, [messages.length, selectedModel.displayName]);

  useEffect(() => {
    initializeWelcomeMessage();
  }, [initializeWelcomeMessage]);

  // Update welcome message when model changes (only when switching models)
  const prevSelectedModelId = useRef(selectedModel.id);
  const updateWelcomeMessageOnModelChange = useCallback(() => {
    if (messages.length > 0 && prevSelectedModelId.current !== selectedModel.id) {
      setMessages([{
        id: generateMessageId(),
        role: 'assistant',
        content: `Model switched to ${selectedModel.displayName}! ${selectedModel.icon} ${selectedModel.description}. How can I assist you today?`,
        timestamp: new Date(),
      }]);
      prevSelectedModelId.current = selectedModel.id;
    }
  }, [selectedModel.id, selectedModel.displayName, selectedModel.icon, selectedModel.description, messages.length]);
  
  useEffect(() => {
    updateWelcomeMessageOnModelChange();
  }, [updateWelcomeMessageOnModelChange]);

  const sendMessage = useCallback(async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isLoading || !user) return;

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: input.trim() || (attachedFiles.length > 0 ? `[Uploaded ${attachedFiles.length} file${attachedFiles.length > 1 ? 's' : ''}]` : ''),
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Get user's Firebase token for authentication
      const token = await user.getIdToken();

      // Prepare the request data
      const requestData = {
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content,
          attachments: msg.attachments || []
        })),
        userId: user.uid,
        model: selectedModel.name,
      };

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      const formattedContent = formatAIResponse(data.response, { 
        format: responseFormat,
        enableBold,
        enableItalic,
        enableInlineCode
      });

      const assistantMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: formattedContent,
        timestamp: new Date(),
        format: responseFormat,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send message. Please try again.";
      showErrorToast("AI Assistant Error", errorMessage);
      
      // Add error message to chat
      const errorChatMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again or contact support if the problem persists.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [input, isLoading, user, messages, selectedModel.name, responseFormat, attachedFiles, enableBold, enableItalic, enableInlineCode]);

  const clearChat = useCallback(() => {
    setMessages([{
      id: generateMessageId(),
      role: 'assistant',
      content: `Chat cleared! 🧹 I'm ready for a fresh conversation. What can I help you with?`,
      timestamp: new Date(),
    }]);
    setAttachedFiles([]);
  }, []);

  const copyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showSuccessToast("Copied!", "Message copied to clipboard");
    } catch {
      showErrorToast("Copy Error", "Failed to copy message");
    }
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const goBackToHome = useCallback(() => {
    router.push('/home');
  }, [router]);

  // File handling functions
  const handleFileUpload = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    const supportedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'text/plain', 'text/csv',
      'application/pdf',
      'application/json'
    ];

    fileArray.forEach(file => {
      if (file.size > maxFileSize) {
        showErrorToast('File too large', `${file.name} exceeds 10MB limit`);
        return;
      }

      if (!supportedTypes.includes(file.type)) {
        showErrorToast('Unsupported file type', `${file.type} is not supported`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const base64Content = content.split(',')[1]; // Remove data URL prefix
        
        const newAttachment: FileAttachment = {
          name: file.name,
          type: file.type,
          size: file.size,
          content: base64Content,
          url: file.type.startsWith('image/') ? content : undefined
        };

        setAttachedFiles(prev => [...prev, newAttachment]);
        showSuccessToast('File attached', `${file.name} attached successfully`);
      };

      reader.onerror = () => {
        showErrorToast('File read error', `Failed to read ${file.name}`);
      };

      reader.readAsDataURL(file);
    });
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
    // Reset input value to allow same file upload again
    e.target.value = '';
  }, [handleFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getFileIcon = useCallback((type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-gray-200/30 dark:bg-grid-gray-700/20 bg-[size:20px_20px] sm:bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,white_50%,transparent_100%)]" />
        
        <div className="relative flex flex-col h-screen max-w-7xl mx-auto">
          {/* Header */}
          <header className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-b border-gray-200/60 dark:border-gray-700/60 sticky top-0 z-40">
            <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                {/* Left side - Back button and title */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goBackToHome}
                    className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-white/50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-700 transition-all duration-200 flex-shrink-0 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md active:scale-95"
                    aria-label="Go back to home"
                    title="Back to Home"
                  >
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-200" />
                  </Button>
                  
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-600 via-gray-700 to-black flex items-center justify-center shadow-md sm:shadow-lg shadow-gray-500/25">
                        <Sparkles className="h-3 w-3 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 h-3 w-3 sm:h-4 sm:w-4 bg-gray-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-black to-gray-800 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
                        AI Assistant
                      </h1>
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-sm sm:text-base flex-shrink-0">{selectedModel.icon}</span>
                        <span className="truncate">
                          <span className="hidden sm:inline">Powered by </span>
                          {selectedModel.displayName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Controls */}
                <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
                  <Badge className="hidden sm:flex bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700 text-xs">
                    <div className="h-1.5 w-1.5 bg-gray-500 rounded-full mr-1.5 animate-pulse" />
                    Online
                  </Badge>
                  
                  {/* Model Selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="h-8 w-8 sm:h-10 sm:w-auto rounded-xl bg-white/50 hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-700 border border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-500/50 transition-all duration-200 p-0 sm:px-3 backdrop-blur-sm shadow-sm hover:shadow-md active:scale-95 text-gray-700 dark:text-gray-200"
                        title="Select AI Model"
                        aria-label="Select AI Model"
                      >
                        <Settings className="h-4 w-4 sm:mr-2 text-gray-600 dark:text-gray-300" />
                        <span className="hidden md:inline max-w-24 lg:max-w-none truncate font-medium">{selectedModel.displayName}</span>
                        <span className="hidden sm:inline md:hidden text-base">{selectedModel.icon}</span>
                        <ChevronDown className="h-4 w-4 hidden sm:inline sm:ml-2 text-gray-500 dark:text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[90vw] max-w-sm sm:w-72 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 mx-2 sm:mx-0">
                      <DropdownMenuLabel className="text-gray-900 dark:text-gray-100 px-3 py-2">Select AI Model</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {AI_MODELS.map((model) => (
                        <DropdownMenuItem
                          key={model.id}
                          onClick={() => setSelectedModel(model)}
                          className={cn(
                            "flex flex-col items-start p-3 cursor-pointer min-h-[60px]",
                            selectedModel.id === model.id && "bg-gray-50 dark:bg-gray-800/50"
                          )}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <span className="text-lg sm:text-xl flex-shrink-0">{model.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">{model.displayName}</span>
                                {selectedModel.id === model.id && (
                                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 flex-shrink-0">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                {model.description}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Response format selector */}
                  <Select value={responseFormat} onValueChange={(v) => setResponseFormat(v as AIFormat)}>
                    <SelectTrigger className="h-8 sm:h-10 w-[120px] rounded-xl">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plain">Plain</SelectItem>
                      <SelectItem value="markdown">Markdown</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="code">Code</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    onClick={clearChat}
                    className="h-10 rounded-xl bg-white/50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 border border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-500/50 text-gray-700 hover:text-gray-800 dark:text-gray-200 dark:hover:text-gray-100 transition-all duration-200 hidden sm:flex backdrop-blur-sm shadow-sm hover:shadow-md active:scale-95"
                    title="Clear chat history"
                    aria-label="Clear chat history"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Chat Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <ScrollArea className="flex-1 px-3 sm:px-4 md:px-6" ref={scrollAreaRef}>
              <div className="py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className={cn(
                        "flex gap-2 sm:gap-3 md:gap-4",
                        message.role === 'user' ? 'flex-row-reverse' : ''
                      )}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 ring-2 ring-white dark:ring-gray-900 shadow-md sm:shadow-lg">
                          {message.role === 'user' ? (
                            <>
                              <AvatarImage src={user?.photoURL || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-gray-600 to-gray-800 text-white">
                                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                              </AvatarFallback>
                            </>
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-gray-700 to-black text-white">
                              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                      
                      {/* Message Content */}
                      <div className={cn(
                        "flex-1 max-w-[85%] sm:max-w-[80%] md:max-w-[75%]",
                        message.role === 'user' ? 'flex flex-col items-end' : ''
                      )}>
                        <div className="group relative">
                          <div className={cn(
                            "rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base leading-relaxed shadow-sm relative overflow-hidden",
                            message.role === 'user'
                              ? "bg-gradient-to-br from-gray-700 to-gray-800 text-white ml-auto"
                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                          )}>
                            {message.role === 'assistant' && (
                              <div className="absolute inset-0 bg-gradient-to-br from-gray-200/10 to-gray-300/10 dark:from-gray-600/10 dark:to-gray-500/10" />
                            )}
                            
                            {/* File attachments in message */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mb-3">
                                <div className="flex flex-wrap gap-2">
                                  {message.attachments.map((attachment, index) => (
                                    <div
                                      key={index}
                                      className={cn(
                                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs",
                                        message.role === 'user'
                                          ? "bg-gray-600/50 text-gray-100"
                                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                      )}
                                    >
                                      {attachment.url && attachment.type.startsWith('image/') ? (
                              <img 
                                src={attachment.url} 
                                alt={`Attachment: ${attachment.name}`}
                                className="w-5 h-5 rounded object-cover" 
                              />
                                      ) : (
                                        <div className={cn(
                                          "text-current",
                                          message.role === 'user' ? "text-gray-200" : "text-gray-500 dark:text-gray-400"
                                        )}>
                                          {getFileIcon(attachment.type)}
                                        </div>
                                      )}
                                      <span className="truncate max-w-24">
                                        {attachment.name}
                                      </span>
                                      <span className={cn(
                                        "text-xs",
                                        message.role === 'user' ? "text-gray-300" : "text-gray-500 dark:text-gray-400"
                                      )}>
                                        {formatFileSize(attachment.size)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="relative whitespace-pre-wrap break-words word-break">
                              {message.role === 'assistant' && message.format === 'html' ? (
                                <div dangerouslySetInnerHTML={{ __html: message.content }} />
                              ) : (
                                message.content
                              )}
                            </div>
                            
                            {/* Copy button */}
                            <div className={cn(
                              "absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 flex gap-1 transition-all duration-300",
                              // Visibility states - Always visible on mobile, hover on desktop
                              "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                            )}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 touch-manipulation",
                                  // User message styling (gray theme)
                                  message.role === 'user'
                                    ? "bg-gray-700/90 hover:bg-gray-600/95 active:bg-gray-800/90 text-white shadow-lg shadow-gray-500/30 hover:shadow-gray-400/40 backdrop-blur-sm border border-gray-400/30 hover:border-gray-300/50"
                                    : "bg-white/95 dark:bg-gray-700/90 hover:bg-gray-50 dark:hover:bg-gray-600/90 active:bg-gray-100 dark:active:bg-gray-500/90 text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 shadow-lg shadow-gray-500/15 hover:shadow-gray-400/20 border border-gray-200/70 dark:border-gray-600/70 hover:border-gray-300/80 dark:hover:border-gray-500/80 backdrop-blur-sm"
                                )}
                                onClick={() => copyMessage(message.content)}
                                title="Copy message"
                                aria-label="Copy message to clipboard"
                              >
                                <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Timestamp */}
                          <p className={cn(
                            "text-xs text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2 px-1",
                            message.role === 'user' ? 'text-right' : 'text-left'
                          )}>
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Typing indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 sm:gap-3 md:gap-4"
                  >
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 ring-2 ring-white dark:ring-gray-900 shadow-md sm:shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-gray-700 to-black text-white">
                        <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm">
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <footer 
              className={cn(
                "border-t border-gray-200/60 dark:border-gray-700/60 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 relative",
                isDragOver && "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {isDragOver && (
                <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10">
                  <div className="text-center">
                    <Paperclip className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-blue-600 dark:text-blue-400 font-medium">Drop files here to attach</p>
                  </div>
                </div>
              )}
              
              <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6">
                <div className="max-w-4xl mx-auto">
                  {/* File attachments preview */}
                  {attachedFiles.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {attachedFiles.map((file, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                          >
                            {file.url && file.type.startsWith('image/') ? (
                              <img 
                                src={file.url} 
                                alt={`File preview: ${file.name}`}
                                className="w-6 h-6 rounded object-cover" 
                              />
                            ) : (
                              <div className="text-gray-500 dark:text-gray-400">
                                {getFileIcon(file.type)}
                              </div>
                            )}
                            <span className="text-gray-700 dark:text-gray-300 truncate max-w-32">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.size)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                              onClick={() => removeAttachment(index)}
                              title="Remove attachment"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-end gap-2 sm:gap-3">
                    <div className="flex-1 relative">
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="min-h-[48px] sm:min-h-[52px] pr-12 sm:pr-14 rounded-xl sm:rounded-2xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base resize-none touch-manipulation"
                      />
                      
                      {/* File upload button inside input */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Attach file"
                        aria-label="Attach file"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button
                      onClick={sendMessage}
                      disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                      className="h-[48px] w-[48px] sm:h-[52px] sm:w-[52px] rounded-xl sm:rounded-2xl bg-gradient-to-r from-gray-700 via-gray-800 to-black hover:from-gray-600 hover:via-gray-700 hover:to-gray-900 active:from-gray-800 active:via-gray-900 active:to-black shadow-lg shadow-gray-500/25 hover:shadow-xl hover:shadow-gray-500/30 transition-all duration-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed touch-manipulation transform hover:scale-105 active:scale-95 backdrop-blur-sm border border-gray-400/20 hover:border-gray-300/30"
                      title={isLoading ? "Sending message..." : "Send message"}
                      aria-label={isLoading ? "Sending message..." : "Send message"}
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-white" />
                      ) : (
                        <Send className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={clearChat}
                      className="h-[48px] w-[48px] sm:h-[52px] sm:w-[52px] rounded-xl sm:rounded-2xl bg-white/50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 border border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-500/50 text-gray-700 hover:text-gray-800 dark:text-gray-200 dark:hover:text-gray-100 transition-all duration-200 sm:hidden touch-manipulation backdrop-blur-sm shadow-sm hover:shadow-md active:scale-95"
                      title="Clear chat history"
                      aria-label="Clear chat history"
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 sm:mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="hidden sm:block">Press Enter to send, Shift+Enter for new line</span>
                    <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                      <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-gray-500 rounded-full animate-pulse" />
                      <span className="text-xs">AI Assistant is online</span>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </main>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.csv,.json"
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Upload files"
          />
        </div>
      </div>
    </AuthGuard>
  );
}


export default memo(AIAssistantPageComponent);