
'use client';

import {useState, useRef, useEffect, useContext, useMemo} from 'react';
import {SendHorizontal, Bot, User, Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {chat} from '@/ai/flows/chat-flow';
import {cn} from '@/lib/utils';
import {useToast} from '@/hooks/use-toast';
import {allTranslations} from '@/lib/translations';
import {LanguageContext} from '@/contexts/language-context';
import {ThreeDotsLoader} from '@/components/shared/three-dots-loader';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import { AnimatePresence, motion } from 'framer-motion';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

function ChatBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';
    const Icon = isUser ? User : Bot;
    
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
                'flex w-full max-w-lg items-start gap-3',
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
        >
            <Avatar className={cn("h-8 w-8", isUser ? 'bg-primary/10 text-primary' : 'bg-muted')}>
                <AvatarFallback>
                    <Icon className="h-5 w-5" />
                </AvatarFallback>
            </Avatar>
            <div className={cn(
                "rounded-xl p-3 shadow-sm",
                isUser ? 'rounded-br-none bg-primary text-primary-foreground' : 'rounded-bl-none bg-muted'
            )}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content === '...' ? <ThreeDotsLoader /> : message.content}
                </p>
            </div>
        </motion.div>
    );
}

function EmptyState({ t }: { t: any }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                <Sparkles className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold">AI Assistant</h2>
            <p className="mt-2 max-w-md text-muted-foreground">{t.chatWithAiDescription}</p>
        </div>
    );
}


export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {toast} = useToast();
  const viewportRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('ChatPage must be used within a LanguageProvider');
  }
  const {language} = langContext;
  const t = useMemo(() => allTranslations[language], [language]);

  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTo({
            top: viewportRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const modelMessageId = `model-${Date.now()}`;

    const newUserMessage: Message = {id: userMessageId, role: 'user', content: input};
    setMessages(prev => [...prev, newUserMessage]);
    
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
        let streamedResponse = '';
        setMessages(prev => [...prev, {id: modelMessageId, role: 'model', content: '...'}]);

        const stream = await chat(currentInput);
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            
            streamedResponse += decoder.decode(value, { stream: true });
            
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === modelMessageId
                        ? { ...msg, content: streamedResponse || '...' }
                        : msg
                )
            );
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
        
        // Revert the UI by removing the optimistic messages
        setMessages(prev => prev.filter(msg => msg.id !== userMessageId && msg.id !== modelMessageId));

      } finally {
        setIsLoading(false);
      }
  };

  return (
    <div className="flex h-full flex-col bg-background">
        <ScrollArea className="flex-1" ref={viewportRef}>
            <AnimatePresence>
                <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8 space-y-4">
                    {messages.length > 0 ? (
                        messages.map((message) => (
                            <ChatBubble key={message.id} message={message} />
                        ))
                    ) : (
                        <EmptyState t={t} />
                    )}
                </div>
            </AnimatePresence>
        </ScrollArea>
        <div className="border-t bg-background px-4 py-3">
            <div className="mx-auto w-full max-w-3xl">
                <form
                    ref={formRef}
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2"
                >
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={t.askAnything}
                        className="flex-grow rounded-full"
                        disabled={isLoading}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                formRef.current?.requestSubmit();
                            }
                        }}
                    />
                    <Button type="submit" size="icon" className="rounded-full" disabled={isLoading || !input.trim()}>
                        <SendHorizontal className="h-5 w-5" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </div>
        </div>
    </div>
  );
}
