"use client";

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Maximize2,
  Minimize2,
  RefreshCw,
  X,
  Copy
} from 'lucide-react';
import {
  showAuthRequiredToast,
  showAIAssistantErrorToast,
  showSuccessToast,
  showErrorToast
} from '@/lib/toast-utils';
import { cn } from '@/lib/utils';
import { generateMessageId } from '@/lib/id-utils';
import { getUserId, getAccessToken } from '@/lib/supabase-user-utils';
import { motion, AnimatePresence } from 'framer-motion' // TODO: Consider lazy loading animations for better initial load;
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

// Performance optimization needed: Consider memoizing inline event handlers
// Use useMemo for objects/arrays and useCallback for functions


interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantWidgetProps {
  className?: string;
  variant?: 'compact' | 'expanded';
}

export const AIAssistantWidget = memo(function AIAssistantWidget({ className, variant = 'compact' }: AIAssistantWidgetProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(variant === 'expanded');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
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

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: generateMessageId(),
        role: 'assistant',
        content: `Hi! 👋 I'm your AI assistant. I can help with questions, creative tasks, and more. What can I do for you today?`,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, messages.length]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    if (!user) {
      showAuthRequiredToast("the AI Assistant");
      return;
    }

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
      const token = await getAccessToken();

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
          userId: getUserId(user),
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
      showAIAssistantErrorToast(errorMessage, !!user);
      
      const errorChatMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again or use the full AI Assistant page.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [user, messages, input, isLoading]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const openFullAssistant = useCallback(() => {
    router.push('/ai-assistant');
  }, [router]);

  const copyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showSuccessToast("Copied!", "Message copied to clipboard");
    } catch {
      showErrorToast("Copy Error", "Failed to copy message");
    }
  }, []);

  // Compact floating button
  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={cn("fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50", className)}
      >
        <Button
          size="lg"
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-r from-gray-700 via-gray-800 to-black hover:from-gray-600 hover:via-gray-700 hover:to-gray-900 active:from-gray-800 active:via-gray-900 active:to-black shadow-lg shadow-gray-500/30 hover:shadow-xl hover:shadow-gray-500/40 transition-all duration-300 min-h-[48px] min-w-[48px] transform hover:scale-110 active:scale-95 backdrop-blur-sm border border-gray-400/20 hover:border-gray-300/30"
          title="Open AI Assistant"
          aria-label="Open AI Assistant chat"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </Button>
      </motion.div>
    );
  }

  // Expanded widget
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={cn(
        "fixed z-50 bg-background border rounded-lg shadow-2xl",
        isExpanded 
          ? "bottom-2 right-2 left-2 sm:bottom-4 sm:right-4 sm:left-auto w-auto sm:w-96 h-[calc(100vh-1rem)] sm:h-[500px] max-h-[calc(100vh-1rem)]" 
          : "bottom-4 right-4 left-4 sm:bottom-6 sm:right-6 sm:left-auto w-auto sm:w-80 h-80 sm:h-96 max-h-[calc(100vh-8rem)]",
        className
      )}
    >
      <Card className="h-full flex flex-col">
        {/* Header */}
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-black rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">AI Assistant</CardTitle>
                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700">
                    Online
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 hover:scale-105 active:scale-95"
                title={isExpanded ? "Minimize window" : "Maximize window"}
                aria-label={isExpanded ? "Minimize window" : "Maximize window"}
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={openFullAssistant}
                className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 hover:scale-105 active:scale-95"
                title="Open full AI Assistant page"
                aria-label="Open full AI Assistant page"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 hover:scale-105 active:scale-95"
                title="Close AI Assistant"
                aria-label="Close AI Assistant"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <Separator />

        {/* Messages */}
        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
          <ScrollArea 
            className="flex-1 p-3" 
            ref={scrollAreaRef}
          >
            <div className="space-y-3">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex items-start space-x-2",
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    )}
                  >
                    <Avatar className="w-6 h-6 flex-shrink-0 ring-1 ring-white/20">
                      {message.role === 'user' ? (
                        <AvatarFallback className="bg-gray-600 text-white text-xs">
                          <User className="w-3 h-3" />
                        </AvatarFallback>
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-gray-700 to-black text-white text-xs">
                          <Bot className="w-3 h-3" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    <div className={cn(
                      "flex-1 max-w-[80%]",
                      message.role === 'user' ? 'flex flex-col items-end' : ''
                    )}>
                      <div className="group relative">
                        <div className={cn(
                          "rounded-lg p-2 text-xs relative",
                          message.role === 'user'
                            ? "bg-gray-700 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        )}>
                          <div className="whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                          
                          {/* Copy button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "absolute -top-1.5 -right-1.5 h-6 w-6 p-0 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95",
                              // Visibility states - always visible on mobile, hover on desktop
                              "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
                              // Styling based on message role
                              message.role === 'user'
                                ? "bg-gray-700/90 hover:bg-gray-600/95 text-white shadow-sm shadow-gray-500/30 border border-gray-400/30"
                                : "bg-white/95 dark:bg-gray-700/90 hover:bg-gray-50 dark:hover:bg-gray-600/90 text-gray-600 dark:text-gray-300 shadow-sm shadow-gray-500/15 border border-gray-200/70 dark:border-gray-600/70"
                            )}
                            onClick={() => copyMessage(message.content)}
                            title="Copy message"
                            aria-label="Copy message to clipboard"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <p className={cn(
                          "text-xs text-gray-500 dark:text-gray-400 mt-1",
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start space-x-2"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-gradient-to-br from-gray-700 to-black text-white text-xs">
                      <Bot className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          <Separator />
          
          {/* Input Area */}
          <div className="p-3">
            <div className="flex items-center space-x-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 text-sm min-h-[44px] sm:h-8 border-2 rounded-lg"
              />
              <Button
                size="sm"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="min-h-[44px] min-w-[44px] sm:h-8 sm:w-8 p-0 rounded-lg bg-gradient-to-r from-gray-700 to-black hover:from-gray-600 hover:to-gray-900 active:from-gray-800 active:to-black shadow-sm shadow-gray-500/25 hover:shadow-md hover:shadow-gray-500/30 transition-all duration-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 backdrop-blur-sm border border-gray-400/20 hover:border-gray-300/30"
                title={isLoading ? "Sending message..." : "Send message"}
                aria-label={isLoading ? "Sending message..." : "Send message"}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 sm:w-3 sm:h-3 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4 sm:w-3 sm:h-3 text-white" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center hidden sm:block">
              Press Enter to send
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
