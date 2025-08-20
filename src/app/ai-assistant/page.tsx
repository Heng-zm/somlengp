"use client";

import { useState, useEffect, useRef } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';
import { cn } from '@/lib/utils';
import { generateMessageId } from '@/lib/id-utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  }
];

export default function AIAssistantPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      // Find the viewport element within the scroll area
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: generateMessageId(),
        role: 'assistant',
        content: `Hello! 👋 I'm your AI Assistant powered by ${selectedModel.displayName}. I'm here to help you with questions, creative tasks, problem-solving, and more. What would you like to discuss today?`,
        timestamp: new Date(),
      }]);
    }
  }, [messages.length, selectedModel.displayName]);

  // Update welcome message when model changes (only when switching models)
  const prevSelectedModelId = useRef(selectedModel.id);
  useEffect(() => {
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

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
      // Get user's Firebase token for authentication
      const token = await user.getIdToken();

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          userId: user.uid,
          model: selectedModel.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
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
  };

  const clearChat = () => {
    setMessages([{
      id: generateMessageId(),
      role: 'assistant',
      content: `Chat cleared! 🧹 I'm ready for a fresh conversation. What can I help you with?`,
      timestamp: new Date(),
    }]);
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showSuccessToast("Copied!", "Message copied to clipboard");
    } catch {
      showErrorToast("Copy Error", "Failed to copy message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goBackToHome = () => {
    router.push('/home');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/30">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/25 bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,white_50%,transparent_100%)]" />
        
        <div className="relative flex flex-col h-screen max-w-6xl mx-auto">
          {/* Header */}
          <header className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-40">
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                {/* Left side - Back button and title */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goBackToHome}
                    className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                    </div>
                    
                    <div>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        AI Assistant
                      </h1>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="text-base">{selectedModel.icon}</span>
                        <span>Powered by {selectedModel.displayName}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Controls */}
                <div className="flex items-center gap-3">
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">
                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                    Online
                  </Badge>
                  
                  {/* Model Selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-10 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <Settings className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">{selectedModel.displayName}</span>
                        <span className="sm:hidden">{selectedModel.icon}</span>
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95">
                      <DropdownMenuLabel className="text-slate-900 dark:text-slate-100">Select AI Model</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {AI_MODELS.map((model) => (
                        <DropdownMenuItem
                          key={model.id}
                          onClick={() => setSelectedModel(model)}
                          className={cn(
                            "flex flex-col items-start p-3 cursor-pointer",
                            selectedModel.id === model.id && "bg-violet-50 dark:bg-violet-950/20"
                          )}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <span className="text-xl">{model.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900 dark:text-slate-100">{model.displayName}</span>
                                {selectedModel.id === model.id && (
                                  <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {model.description}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button
                    variant="outline"
                    onClick={clearChat}
                    className="h-10 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hidden sm:flex"
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
            <ScrollArea className="flex-1 px-4 sm:px-6" ref={scrollAreaRef}>
              <div className="py-6 space-y-6 max-w-4xl mx-auto">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className={cn(
                        "flex gap-4",
                        message.role === 'user' ? 'flex-row-reverse' : ''
                      )}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-900 shadow-lg">
                          {message.role === 'user' ? (
                            <>
                              <AvatarImage src={user?.photoURL || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </>
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                              <Bot className="h-5 w-5" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                      
                      {/* Message Content */}
                      <div className={cn(
                        "flex-1 max-w-[75%]",
                        message.role === 'user' ? 'flex flex-col items-end' : ''
                      )}>
                        <div className="group relative">
                          <div className={cn(
                            "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm relative overflow-hidden",
                            message.role === 'user'
                              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-auto"
                              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                          )}>
                            {message.role === 'assistant' && (
                              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-blue-500/5 dark:from-violet-400/10 dark:to-blue-400/10" />
                            )}
                            
                            <div className="relative whitespace-pre-wrap break-words">
                              {message.content}
                            </div>
                            
                            {/* Copy button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "absolute -top-2 -right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md",
                                message.role === 'user'
                                  ? "bg-blue-400/90 hover:bg-blue-300 text-white backdrop-blur-sm"
                                  : "bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600"
                              )}
                              onClick={() => copyMessage(message.content)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          
                          {/* Timestamp */}
                          <p className={cn(
                            "text-xs text-slate-500 dark:text-slate-400 mt-2 px-1",
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
                    className="flex gap-4"
                  >
                    <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-900 shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" />
                        <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <footer className="border-t border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
              <div className="px-4 py-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="min-h-[52px] pr-12 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 text-base resize-none"
                      />
                    </div>
                    
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      className="h-[52px] w-[52px] rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/25 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={clearChat}
                      className="h-[52px] w-[52px] rounded-2xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 sm:hidden"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="hidden sm:block">Press Enter to send, Shift+Enter for new line</span>
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span>AI Assistant is online</span>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
