'use client';

import {useState, useRef, useEffect, useContext, useMemo} from 'react';
import {SendHorizontal, Bot, User} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {chat} from '@/ai/flows/chat-flow';
import {cn} from '@/lib/utils';
import {useToast} from '@/hooks/use-toast';
import {allTranslations} from '@/lib/translations';
import {LanguageContext} from '@/contexts/language-context';
import { ThreeDotsLoader } from '@/components/shared/three-dots-loader';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {toast} = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('ChatPage must be used within a LanguageProvider');
  }
  const {language} = langContext;
  const t = useMemo(() => allTranslations[language], [language]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newUserMessage: Message = {role: 'user', content: input};
    setMessages(prev => [...prev, newUserMessage]);
    
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
        let streamedResponse = '';
        setMessages(prev => [...prev, {role: 'model', content: ''}]);

        const stream = chat(currentInput);

        for await (const chunk of stream) {
            streamedResponse += chunk;
            setMessages(prev => {
                const updatedMessages = [...prev];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                if (lastMessage.role === 'model') {
                    lastMessage.content = streamedResponse;
                }
                return updatedMessages;
            });
        }
      } catch (error: any) {
        console.error('Chat error:', error);
        const errorMessage =
          error.message?.toLowerCase() || 'an unknown error occurred.';
        let title = t.chatError;
        let description = error.message;

        if (errorMessage.includes('rate limit')) {
          title = t.rateLimitExceeded;
          description = t.rateLimitMessage;
        } else if (error.message) {
            description = error.message;
        }

        toast({
          title,
          description,
          variant: 'destructive',
        });
        
        // Revert the UI by removing the optimistic user message and any pending model message
        setMessages(prev => prev.filter(msg => msg.content !== currentInput && (msg.role !== 'model' || msg.content !== '')));

      } finally {
        setIsLoading(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="flex flex-col gap-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'model' && (
                <div className="p-2 bg-primary/10 rounded-full">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'p-3 rounded-lg max-w-sm',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="whitespace-pre-wrap">{message.content || '...'}</p>
              </div>
              {message.role === 'user' && (
                <div className="p-2 bg-muted rounded-full">
                  <User className="w-6 h-6 text-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
             <div className="flex items-start gap-3 justify-start">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div className="p-3 rounded-lg bg-muted flex items-center">
                  <ThreeDotsLoader />
                </div>
             </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t.askAnything}
            className="flex-grow"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <SendHorizontal className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
