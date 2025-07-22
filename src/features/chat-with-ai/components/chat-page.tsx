
'use client';

import {useState, useEffect, useRef, useMemo, useContext} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {cn} from '@/lib/utils';
import {chat} from '@/ai/flows/chat-flow';
import type {MessageData} from 'genkit';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Bot, Send, User} from 'lucide-react';
import {ThreeDotsLoader} from '@/components/shared/three-dots-loader';
import {LanguageContext} from '@/contexts/language-context';
import {allTranslations} from '@/lib/translations';
import { addMessage, getMessages, type ChatMessage as StoredMessage } from '@/lib/idb';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

function ChatBubble({message}: {message: Message}) {
  const isModel = message.role === 'model';
  return (
    <motion.div
      layout
      initial={{opacity: 0, scale: 0.8, y: 50}}
      animate={{opacity: 1, scale: 1, y: 0}}
      exit={{opacity: 0, scale: 0.8}}
      transition={{opacity: {duration: 0.1}, layout: {type: 'spring', bounce: 0.3, duration: 0.5}}}
      className={cn(
        'flex w-full max-w-[80%] gap-3',
        isModel ? 'justify-start' : 'ml-auto justify-end'
      )}
    >
      {isModel && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <Bot />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'rounded-xl p-3 text-sm shadow-sm',
          isModel
            ? 'bg-muted text-foreground'
            : 'bg-primary text-primary-foreground'
        )}
      >
         <div className="whitespace-pre-wrap leading-relaxed">
            {message.text === '...' ? <ThreeDotsLoader /> : message.text}
        </div>
      </div>
      {!isModel && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const langContext = useContext(LanguageContext);
  if (!langContext) {
    throw new Error('ChatPage must be used within a LanguageProvider');
  }
  const { language } = langContext;
  const t = useMemo(() => allTranslations[language], [language]);

  useEffect(() => {
    const loadHistory = async () => {
        try {
            const history = await getMessages();
            setMessages(history);
        } catch (error) {
            console.error("Failed to load chat history:", error);
        } finally {
            setIsLoadingHistory(false);
        }
    };
    loadHistory();
  }, []);

  function scrollToBottom() {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: StoredMessage = {id: `user-${Date.now()}`, role: 'user', text: input, timestamp: Date.now()};
    addMessage(userMessage);
    
    const modelMessagePlaceholder: Message = {id: `model-${Date.now()}`, role: 'model', text: '...'};

    setMessages(prev => [...prev, userMessage, modelMessagePlaceholder]);
    setInput('');
    setIsStreaming(true);

    const history: MessageData[] = messages.map(m => ({
      role: m.role,
      content: [{text: m.text}],
    }));

    try {
      const stream = await chat([...history, {role: 'user', content: [{text: input}]}]);
      const reader = stream.getReader();
      let streamedResponse = '';
      
      const read = async () => {
        const { done, value } = await reader.read();
        if (done) {
          const finalModelMessage: StoredMessage = {
              id: modelMessagePlaceholder.id,
              role: 'model',
              text: streamedResponse,
              timestamp: Date.now()
          };
          addMessage(finalModelMessage);
          setIsStreaming(false);
          return;
        }
        streamedResponse += value;
        setMessages(prev => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage.role === 'model') {
            lastMessage.text = streamedResponse;
          }
          return updated;
        });
        scrollToBottom();
        read();
      };
      read();
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: StoredMessage = {
          id: modelMessagePlaceholder.id,
          role: 'model',
          text: t.chatError,
          timestamp: Date.now()
      };
      addMessage(errorMessage);
      setMessages(prev => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        if (lastMessage.role === 'model') {
            lastMessage.text = t.chatError;
        }
        return updated;
      });
      setIsStreaming(false);
    }
  };
  
  return (
    <div className="flex h-full flex-col bg-background">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
          <AnimatePresence>
            {isLoadingHistory ? (
                <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center text-center">
                    <ThreeDotsLoader />
                    <p className="mt-4 text-muted-foreground">Loading history...</p>
                </div>
            ) : messages.length > 0 ? (
              <div className="flex flex-col gap-4">
                {messages.map(message => (
                  <ChatBubble key={message.id} message={message} />
                ))}
              </div>
            ) : (
                <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center text-center">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="h-10 w-10 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold">Chat with Ozo</h2>
                  <p className="text-muted-foreground">
                    Ask me anything! Your conversation will be saved locally.
                  </p>
                </div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
      <div className="border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-3xl items-center gap-2">
          <Input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t.askAnything}
            className="flex-1 rounded-full px-5"
            disabled={isStreaming}
          />
          <Button type="submit" size="icon" className="rounded-full" disabled={isStreaming || !input.trim()}>
            <Send />
          </Button>
        </form>
      </div>
    </div>
  );
}
