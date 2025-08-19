"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
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
  X
} from 'lucide-react';
import {
  showAuthRequiredToast,
  showAIAssistantErrorToast
} from '@/lib/toast-utils';
import { cn } from '@/lib/utils';
import { generateMessageId } from '@/lib/id-utils';
import { motion, AnimatePresence } from 'framer-motion';

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

export function AIAssistantWidget({ className, variant = 'compact' }: AIAssistantWidgetProps) {
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
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 min-h-[48px] min-w-[48px]"
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
          ? "bottom-2 right-2 left-2 sm:bottom-4 sm:right-4 sm:left-auto w-auto sm:w-96 h-[calc(100vh-1rem)] sm:h-[500px]" 
          : "bottom-4 right-4 left-4 sm:bottom-6 sm:right-6 sm:left-auto w-auto sm:w-80 h-80 sm:h-96",
        className
      )}
    >
      <Card className="h-full flex flex-col">
        {/* Header */}
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">AI Assistant</CardTitle>
                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
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
                className="h-8 w-8 p-0"
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
                className="h-8 w-8 p-0"
                title="Open full AI Assistant"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
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
                        <AvatarFallback className="bg-blue-500 text-white text-xs">
                          <User className="w-3 h-3" />
                        </AvatarFallback>
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-xs">
                          <Bot className="w-3 h-3" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    <div className={cn(
                      "flex-1 max-w-[80%]",
                      message.role === 'user' ? 'flex flex-col items-end' : ''
                    )}>
                      <div className={cn(
                        "rounded-lg p-2 text-xs",
                        message.role === 'user'
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      )}>
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
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
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-xs">
                      <Bot className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
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
                className="min-h-[44px] min-w-[44px] sm:h-8 sm:w-8 p-0 rounded-lg"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 sm:w-3 sm:h-3 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 sm:w-3 sm:h-3" />
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
}
