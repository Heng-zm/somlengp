'use client';

import { useState, useRef, useCallback, memo } from 'react';
import { Bold, Italic, Underline, Link, Paperclip, Smile, AtSign } from 'lucide-react' // TODO: Consider importing icons individually for better tree shaking;
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CommentFormattingOption } from '@/types/comment-types';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function


interface CommentEditorProps {
  placeholder?: string;
  onSubmit: (content: string, parentId?: string) => void;
  parentId?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  submitText?: string;
}

export const CommentEditor = memo(function CommentEditor({
  placeholder = "Add comment...",
  onSubmit,
  parentId,
  disabled = false,
  loading = false,
  className,
  submitText = "Submit"
}: CommentEditorProps) {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formattingOptions: CommentFormattingOption[] = [
    {
      type: 'bold',
      icon: Bold,
      action: () => applyFormatting('**', '**')
    },
    {
      type: 'italic',
      icon: Italic,
      action: () => applyFormatting('*', '*')
    },
    {
      type: 'underline',
      icon: Underline,
      action: () => applyFormatting('<u>', '</u>')
    },
    {
      type: 'link',
      icon: Link,
      action: () => applyFormatting('[', '](url)')
    },
    {
      type: 'attachment',
      icon: Paperclip,
      action: () => {} // Placeholder for file attachment
    },
    {
      type: 'emoji',
      icon: Smile,
      action: () => {} // Placeholder for emoji picker
    },
    {
      type: 'mention',
      icon: AtSign,
      action: () => applyFormatting('@', '')
    }
  ];

  const applyFormatting = useCallback((before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      before + selectedText + after + 
      content.substring(end);
    
    setContent(newContent);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content]);

  const handleSubmit = useCallback(() => {
    if (!content.trim() || disabled || loading) return;
    
    onSubmit(content.trim(), parentId);
    setContent('');
    setIsFocused(false);
  }, [content, disabled, loading, onSubmit, parentId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700",
      "transition-all duration-200 ease-in-out",
      isFocused && "ring-2 ring-blue-500/20 border-blue-300 dark:border-blue-600",
      className
    )}>
      <div className="p-3 sm:p-4">
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          className={cn(
            "min-h-[60px] sm:min-h-[80px] resize-none border-0 bg-transparent p-0",
            "focus:ring-0 focus:outline-none placeholder:text-gray-400 text-sm",
            "dark:placeholder:text-gray-500"
          )}
        />
      </div>

      {/* Formatting Toolbar */}
      <div className="border-t border-gray-100 dark:border-gray-800 px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            {/* Show only essential formatting options on mobile */}
            {formattingOptions.slice(0, 4).map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.type}
                  variant="ghost"
                  size="sm"
                  onClick={option.action}
                  disabled={disabled || loading}
                  className="w-7 h-7 sm:w-8 sm:h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                </Button>
              );
            })}
            {/* Hide additional options on mobile */}
            <div className="hidden sm:flex items-center gap-1">
              {formattingOptions.slice(4).map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.type}
                    variant="ghost"
                    size="sm"
                    onClick={option.action}
                    disabled={disabled || loading}
                    className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </Button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || disabled || loading}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 text-xs sm:text-sm flex-shrink-0"
          >
            {loading ? 'Submitting...' : submitText}
          </Button>
        </div>
      </div>
    </div>
  );
});
