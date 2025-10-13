'use client';

import { memo, useState, useCallback } from 'react';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { showSuccessToast } from '@/lib/toast-utils';
import { LightweightCodeBlock } from './lightweight-code-block';

interface EnhancedCodeRendererProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  isUser?: boolean;
}

// Enhanced inline code renderer
const InlineCode = memo(function InlineCode({ 
  children, 
  isUser 
}: { 
  children: React.ReactNode; 
  isUser: boolean;
}) {
  return (
    <code
      className={`
        px-1.5 py-0.5 rounded text-sm font-mono
        ${isUser 
          ? 'bg-white/20 text-white' 
          : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
        }
      `}
    >
      {children}
    </code>
  );
});

// Enhanced block code renderer with collapsible long code
const BlockCode = memo(function BlockCode({
  language,
  code,
  isUser
}: {
  language: string;
  code: string;
  isUser: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(code.split('\n').length > 25);
  const lines = code.split('\n');
  
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      showSuccessToast("Code copied!");
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showSuccessToast("Code copied!");
    }
  }, [code]);

  if (isCollapsed) {
    return (
      <div className="my-2 rounded-lg overflow-hidden bg-gray-900 border border-gray-700">
        {/* Mobile-optimized Collapsed header */}
        <div className="flex items-center justify-between bg-gray-800 px-2 sm:px-3 py-1.5 sm:py-2 border-b border-gray-700">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <span className="text-xs text-gray-300 font-mono capitalize truncate">{language || 'code'}</span>
            <Badge variant="secondary" className="text-xs px-1 sm:px-1.5 py-0 h-3.5 sm:h-4 bg-gray-800/30 text-gray-300 border-gray-600 hidden sm:inline-flex">
              {lines.length} lines
            </Badge>
            <Badge variant="outline" className="text-xs px-1 sm:px-1.5 py-0 h-3.5 sm:h-4 bg-blue-900/20 text-blue-300 border-blue-600/50">
              Collapsed
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-xs text-gray-300 hover:text-white hover:bg-gray-700 touch-manipulation"
              onClick={copyCode}
              aria-label="Copy code"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 sm:px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700 touch-manipulation"
              onClick={() => setIsCollapsed(false)}
              aria-label="Expand code"
            >
              <ChevronDown className="w-3 h-3 mr-0.5 sm:mr-1" />
              <span className="hidden sm:inline">Show</span>
            </Button>
          </div>
        </div>
        
        {/* Mobile-optimized Preview */}
        <div className="bg-gray-900 p-2 sm:p-3">
          <pre className="text-gray-400 font-mono text-xs leading-relaxed overflow-x-auto">
            {lines.slice(0, 2).join('\n')}
            {lines.length > 2 && '\n...'}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="my-2">
      {/* Mobile-optimized Collapse button for long code */}
      {lines.length > 25 && (
        <div className="flex justify-end mb-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 sm:px-2 text-xs text-gray-400 hover:text-gray-200 touch-manipulation"
            onClick={() => setIsCollapsed(true)}
            aria-label="Collapse code"
          >
            <ChevronUp className="w-3 h-3 mr-0.5 sm:mr-1" />
            <span className="hidden sm:inline">Collapse</span>
          </Button>
        </div>
      )}
      
      <LightweightCodeBlock 
        code={code} 
        language={language || 'text'} 
        showLineNumbers={lines.length > 10}
      />
    </div>
  );
});

// Main enhanced code renderer
export const EnhancedCodeRenderer = memo(function EnhancedCodeRenderer({
  inline,
  className,
  children,
  isUser = false,
  ...props
}: EnhancedCodeRendererProps) {
  // Extract language from className (e.g., "language-javascript")
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  // Render inline code
  if (inline) {
    return <InlineCode isUser={isUser}>{children}</InlineCode>;
  }

  // Render block code with syntax highlighting
  return (
    <BlockCode 
      language={language} 
      code={codeString} 
      isUser={isUser} 
    />
  );
});

// Pre-configured components for ReactMarkdown
export const createCodeComponents = (isUser: boolean = false) => ({
  code: (props: any) => <EnhancedCodeRenderer {...props} isUser={isUser} />,
});