import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { showErrorToast } from '@/lib/toast-utils';
import { ChatMessage, AIResponse, AIAssistantConfig, DEFAULT_AI_CONFIG } from '@/lib/ai-types';
import { debug } from '@/lib/debug';

interface UseAIAssistantReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  sendMessage: (content: string, config?: Partial<AIAssistantConfig>) => Promise<void>;
  clearMessages: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  retryLastMessage: () => Promise<void>;
}

export function useAIAssistant(initialMessages: ChatMessage[] = []): UseAIAssistantReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');

  const sendMessage = useCallback(async (
    content: string, 
    config: Partial<AIAssistantConfig> = {}
  ) => {
    if (!content.trim() || isLoading || !user) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLastUserMessage(content.trim());
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Get user's Firebase token for authentication
      const token = await user.getIdToken();

      const requestBody = {
        messages: [...messages, userMessage].map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        userId: user.uid,
        config: { ...DEFAULT_AI_CONFIG, ...config },
      };

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to get response`);
      }

      const data: AIResponse = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        model: data.model,
        tokens: data.tokens,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: unknown) {
      debug.error('Error sending message:', error);
      
      // Show user-friendly error message
      let errorMessage = "I apologize, but I encountered an error. Please try again.";
      const errorObj = error as { message?: string };
      
      if (errorObj.message?.includes('Authentication required')) {
        errorMessage = "Please sign in to use the AI Assistant.";
      } else if (errorObj.message?.includes('quota exceeded')) {
        errorMessage = "API quota exceeded. Please try again later.";
      } else if (errorObj.message?.includes('safety')) {
        errorMessage = "Your message was filtered for safety. Please rephrase your request.";
      }
      
      showErrorToast("AI Assistant Error", errorMessage);
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [messages, user, isLoading]);

  const retryLastMessage = useCallback(async () => {
    if (lastUserMessage && !isLoading) {
      // Remove the last assistant message if it was an error
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role === 'assistant' && lastMsg.content.includes('error')) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      
      await sendMessage(lastUserMessage);
    }
  }, [lastUserMessage, isLoading, sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastUserMessage('');
  }, []);

  return {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    clearMessages,
    setMessages,
    retryLastMessage,
  };
}
