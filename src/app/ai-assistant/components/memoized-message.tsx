"use client";

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bot, User, Copy, Image, File, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  content: string;
  url?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  format?: string;
  attachments?: FileAttachment[];
}

interface MemoizedMessageProps {
  message: Message;
  userPhotoURL?: string | null;
  onCopyMessage: (content: string) => void;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (type === 'application/pdf') return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const MemoizedMessage = memo<MemoizedMessageProps>(function MemoizedMessage({
  message,
  userPhotoURL,
  onCopyMessage
}) {
  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex gap-2 sm:gap-3 md:gap-4",
        message.role === 'user' ? 'flex-row-reverse' : ''
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 ring-2 ring-white dark:ring-gray-900 shadow-md sm:shadow-lg">
          {message.role === 'user' ? (
            <>
              <AvatarImage src={userPhotoURL || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-gray-600 to-gray-800 text-white">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
              </AvatarFallback>
            </>
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-gray-700 to-black text-white">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
            </AvatarFallback>
          )}
        </Avatar>
      </div>
      
      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-[85%] sm:max-w-[80%] md:max-w-[75%]",
        message.role === 'user' ? 'flex flex-col items-end' : ''
      )}>
        <div className="group relative">
          <div className={cn(
            "rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base leading-relaxed shadow-sm relative overflow-hidden",
            message.role === 'user'
              ? "bg-gradient-to-br from-gray-700 to-gray-800 text-white ml-auto"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
          )}>
            {message.role === 'assistant' && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200/10 to-gray-300/10 dark:from-gray-600/10 dark:to-gray-500/10" />
            )}
            
            {/* File attachments in message */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {message.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs",
                        message.role === 'user'
                          ? "bg-gray-600/50 text-gray-100"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      )}
                    >
                      {attachment.url && attachment.type.startsWith('image/') ? (
                        <img 
                          src={attachment.url} 
                          alt={`Attachment: ${attachment.name}`}
                          className="w-5 h-5 rounded object-cover" 
                        />
                      ) : (
                        <div className={cn(
                          "text-current",
                          message.role === 'user' ? "text-gray-200" : "text-gray-500 dark:text-gray-400"
                        )}>
                          {getFileIcon(attachment.type)}
                        </div>
                      )}
                      <span className="truncate max-w-24">
                        {attachment.name}
                      </span>
                      <span className={cn(
                        "text-xs",
                        message.role === 'user' ? "text-gray-300" : "text-gray-500 dark:text-gray-400"
                      )}>
                        {formatFileSize(attachment.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="relative whitespace-pre-wrap break-words word-break">
              {message.role === 'assistant' && message.format === 'html' ? (
                <div dangerouslySetInnerHTML={{ __html: message.content }} />
              ) : (
                message.content
              )}
            </div>
            
            {/* Copy button */}
            <div className={cn(
              "absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 flex gap-1 transition-all duration-300",
              // Visibility states - Always visible on mobile, hover on desktop
              "opacity-100 md:opacity-0 md:group-hover:opacity-100"
            )}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 touch-manipulation",
                  // User message styling (gray theme)
                  message.role === 'user'
                    ? "bg-gray-700/90 hover:bg-gray-600/95 active:bg-gray-800/90 text-white shadow-lg shadow-gray-500/30 hover:shadow-gray-400/40 backdrop-blur-sm border border-gray-400/30 hover:border-gray-300/50"
                    : "bg-white/95 dark:bg-gray-700/90 hover:bg-gray-50 dark:hover:bg-gray-600/90 active:bg-gray-100 dark:active:bg-gray-500/90 text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 shadow-lg shadow-gray-500/15 hover:shadow-gray-400/20 border border-gray-200/70 dark:border-gray-600/70 hover:border-gray-300/80 dark:hover:border-gray-500/80 backdrop-blur-sm"
                )}
                onClick={() => onCopyMessage(message.content)}
                title="Copy message"
                aria-label="Copy message to clipboard"
              >
                <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
          
          {/* Timestamp */}
          <p className={cn(
            "text-xs text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2 px-1",
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
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.userPhotoURL === nextProps.userPhotoURL &&
    prevProps.message.timestamp.getTime() === nextProps.message.timestamp.getTime()
  );
});
