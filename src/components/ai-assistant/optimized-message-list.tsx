'use client';

import { memo, useRef, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
}

interface VirtualizedMessageListProps {
  messages: Message[];
  isTyping: boolean;
  height: number;
}

// Lightweight message component for virtualization
const MessageItem = memo(function MessageItem({ 
  index, 
  style, 
  data 
}: { 
  index: number;
  style: React.CSSProperties;
  data: { messages: Message[]; isTyping: boolean };
}) {
  const message = data.messages[index];
  const isUser = message.role === 'user';

  return (
    <div style={style}>
      <div className="px-4 mb-4">
        <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500 flex items-center justify-center shadow-lg flex-shrink-0 mt-1">
              <span className="text-white text-sm">AI</span>
            </div>
          )}
          
          <div className={`max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`
              px-4 py-3 rounded-2xl break-words overflow-hidden border shadow-sm
              ${isUser 
                ? 'bg-gray-900 text-white border-gray-800' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700'
              }
            `}>
              <div className="whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const OptimizedMessageList = memo(function OptimizedMessageList({
  messages,
  isTyping,
  height
}: VirtualizedMessageListProps) {
  const listRef = useRef<List>(null);
  const [itemSize] = useState(120); // Estimated height per message

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length, isTyping]);

  const itemCount = messages.length + (isTyping ? 1 : 0);
  const itemData = { messages, isTyping };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>No messages yet. Start a conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <List
        ref={listRef}
        height={height}
        itemCount={itemCount}
        itemSize={itemSize}
        itemData={itemData}
        overscanCount={5}
      >
        {({ index, style }) => (
          <ErrorBoundary key={index}>
            {index < messages.length ? (
              <MessageItem index={index} style={style} data={itemData} />
            ) : (
              <div style={style}>
                <div className="px-4 mb-4">
                  <div className="flex items-start gap-4 justify-start">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500 flex items-center justify-center shadow-lg flex-shrink-0 mt-1">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ErrorBoundary>
        )}
      </List>
    </ErrorBoundary>
  );
});