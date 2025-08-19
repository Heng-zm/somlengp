"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
      <div className="flex flex-col h-[100vh] sm:h-[calc(100vh-2rem)] max-w-4xl mx-auto p-2 sm:p-4 ai-assistant-container">
        {/* Back to Home Button */}
        <div className="mb-2 sm:mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBackToHome}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors min-h-[44px] min-w-[44px]"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Header */}
        <Card className="mb-2 sm:mb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    AI Assistant
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="text-sm sm:text-lg">{selectedModel.icon}</span>
                    <span className="hidden sm:inline">Powered by</span> {selectedModel.displayName}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end space-x-2 overflow-x-auto">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800 flex-shrink-0 text-xs">
                  Online
                </Badge>
                
                {/* AI Model Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex min-h-[44px] text-xs sm:text-sm flex-shrink-0"
                    >
                      <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{selectedModel.displayName}</span>
                      <span className="sm:hidden">{selectedModel.icon}</span>
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Select AI Model</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {AI_MODELS.map((model) => (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => setSelectedModel(model)}
                        className={cn(
                          "flex flex-col items-start space-y-1 cursor-pointer min-h-[44px]",
                          selectedModel.id === model.id && "bg-blue-50 dark:bg-blue-950/20"
                        )}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{model.icon}</span>
                          <span className="font-medium">{model.displayName}</span>
                          {selectedModel.id === model.id && (
                            <Badge variant="secondary" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {model.description}
                        </p>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearChat}
                  className="min-h-[44px] text-xs sm:text-sm hidden sm:flex flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Clear Chat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="p-0 h-full flex flex-col">
            <ScrollArea 
              className="flex-1 p-2 sm:p-4 custom-scrollbar" 
              ref={scrollAreaRef}
            >
              <div className="space-y-3 sm:space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "flex items-start gap-2 sm:gap-3",
                        message.role === 'user' ? 'flex-row-reverse' : ''
                      )}
                    >
                      <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 ring-1 ring-white/20 shadow-sm">
                        {message.role === 'user' ? (
                          <>
                            <AvatarImage 
                              src={user?.photoURL || undefined} 
                              className="avatar-image"
                            />
                            <AvatarFallback className="bg-blue-500 text-white">
                              <User className="w-3 h-3 sm:w-4 sm:h-4" />
                            </AvatarFallback>
                          </>
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                            <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      <div className={cn(
                        "flex-1 max-w-[calc(100%-3rem)] sm:max-w-[80%]",
                        message.role === 'user' ? 'flex flex-col items-end' : ''
                      )}>
                        <div className={cn(
                          "rounded-lg p-2.5 sm:p-3 text-sm relative group",
                          message.role === 'user'
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        )}>
                          <div className="whitespace-pre-wrap break-words leading-relaxed">
                            {message.content}
                          </div>
                          
                          {/* Copy button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "absolute -top-1 -right-1 sm:-top-2 sm:-right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 sm:w-7 sm:h-7 p-0 min-h-[44px] sm:min-h-0",
                              message.role === 'user' 
                                ? "bg-blue-400 hover:bg-blue-300 text-white" 
                                : "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                            )}
                            onClick={() => copyMessage(message.content)}
                          >
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
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
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Typing indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-3"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            <Separator />
            
            {/* Input Area */}
            <div className="p-3 sm:p-4 bg-white dark:bg-gray-900">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="resize-none min-h-[48px] text-base sm:text-sm border-2 focus:border-blue-500 rounded-xl"
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="min-h-[48px] min-w-[48px] px-3 sm:px-4 rounded-xl bg-blue-500 hover:bg-blue-600"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearChat}
                  className="min-h-[48px] min-w-[48px] rounded-xl sm:hidden border-2"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center hidden sm:block">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
