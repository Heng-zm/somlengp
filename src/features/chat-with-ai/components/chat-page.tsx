
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
  const isMounted = useRef(true);

  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('ChatPage must be used within a LanguageProvider');
  }
  const {language} = langContext;
  const t = useMemo(() => allTranslations[language], [language]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newUserMessage: Message = {role: 'user', content: input};
    const newMessages = [...messages, newUserMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    
    const historyForApi = newMessages.map(msg => ({
      role: msg.role,
      content: [{text: msg.content}],
    }));

    (async () => {
      try {
        const stream = await chat({ history: historyForApi });
        if (!isMounted.current) return;

        let streamedResponse = '';
        setMessages(prev => [...prev, {role: 'model', content: ''}]);

        for await (const chunk of stream) {
            if (!isMounted.current) return;
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
        if (!isMounted.current) return;
        
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
        
        // Remove the empty model message placeholder on error
        setMessages(prev => prev.filter(m => m.role !== 'model' || m.content !== ''));

      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    })();
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
          {isLoading && messages[messages.length - 1]?.role !== 'model' && (
             <div className="flex items-start gap-3 justify-start">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div className="p-3 rounded-lg bg-muted">
                    <div className="h-2 w-2 bg-foreground rounded-full animate-bounce-dot [animation-delay:-0.3s]"></div>
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
