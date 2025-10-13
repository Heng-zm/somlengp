'use client';

import { memo, useCallback } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { showSuccessToast } from '@/lib/toast-utils';

// Simple language detection based on common patterns
const detectLanguage = (code: string): string => {
  const trimmed = code.trim();
  
  // JSON detection
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON, continue detection
    }
  }
  
  // HTML/XML detection
  if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) {
    return 'html';
  }
  
  // Python detection
  if (/\b(def|class|import|from)\s+\w+|:\s*$|^\s*#/m.test(trimmed)) {
    return 'python';
  }
  
  // JavaScript detection
  if (/\b(function|const|let|var|=>|import|export|from)\b/.test(trimmed)) {
    return 'javascript';
  }
  
  return 'text';
};

interface LightweightCodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

// Enhanced syntax highlighting with better language support
const highlightCode = (code: string, language: string = 'text') => {
  // Escape HTML to prevent XSS
  const escapeHtml = (str: string) => 
    str.replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&#39;');

  let highlighted = escapeHtml(code);
  const lang = language.toLowerCase();
  
  // JavaScript/TypeScript highlighting
  if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
    highlighted = highlighted
      // Keywords
      .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await)\b/g, '<span class="text-blue-300 font-medium">$1</span>')
      // Strings
      .replace(/(\'|\"|\`)([^\'\"|\`]*?)\1/g, '<span class="text-green-300">$1$2$1</span>')
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-yellow-300">$1</span>')
      // Comments
      .replace(/\/\/.*$/gm, '<span class="text-gray-400 italic">$&</span>');
  }
  // Python highlighting
  else if (lang === 'python' || lang === 'py') {
    highlighted = highlighted
      // Keywords
      .replace(/\b(def|class|import|from|return|if|else|elif|for|while|try|except|with|as|True|False|None)\b/g, '<span class="text-blue-300 font-medium">$1</span>')
      // Strings
      .replace(/(\'|\")([^\'\"]*)\1/g, '<span class="text-green-300">$1$2$1</span>')
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-yellow-300">$1</span>')
      // Comments
      .replace(/#.*$/gm, '<span class="text-gray-400 italic">$&</span>');
  }
  // JSON highlighting
  else if (lang === 'json') {
    highlighted = highlighted
      // Property keys
      .replace(/&quot;([^&]+)&quot;\s*:/g, '<span class="text-blue-300">&quot;$1&quot;</span>:')
      // String values
      .replace(/(:\s*)(&quot;[^&]*&quot;)/g, '$1<span class="text-green-300">$2</span>')
      // Boolean/null/numbers
      .replace(/(:\s*)(true|false|null|\d+(?:\.\d+)?)/g, '$1<span class="text-orange-300">$2</span>');
  }
  // HTML/XML highlighting
  else if (lang === 'html' || lang === 'xml') {
    highlighted = highlighted
      // Tags
      .replace(/(&lt;\/?)(\w+)([^&gt;]*?)(&gt;)/g, '<span class="text-red-300">$1</span><span class="text-blue-300">$2</span>$3<span class="text-red-300">$4</span>');
  }
  
  return highlighted;
};

export const LightweightCodeBlock = memo(function LightweightCodeBlock({
  code,
  language = 'text',
  showLineNumbers = false
}: LightweightCodeBlockProps) {
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      showSuccessToast("Code copied to clipboard");
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showSuccessToast("Code copied to clipboard");
    }
  }, [code]);

  const lines = code.split('\n');
  const highlightedCode = highlightCode(code, language);
  
  // Auto-detect language if not provided
  const detectedLanguage = language === 'text' ? detectLanguage(code) : language;
  const displayLanguage = detectedLanguage || language;

  return (
    <div className="my-2 rounded-lg overflow-hidden bg-gray-900 border border-gray-700 w-full max-w-full">
      {/* Mobile-optimized Header */}
      <div className="flex items-center justify-between bg-gray-800 px-2 sm:px-3 py-1.5 sm:py-2 border-b border-gray-700">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <span className="text-xs text-gray-300 font-mono capitalize truncate">{displayLanguage}</span>
          <Badge 
            variant="secondary" 
            className="text-xs px-1 sm:px-1.5 py-0 h-3.5 sm:h-4 bg-gray-800/30 text-gray-300 border-gray-600 hidden sm:inline-flex"
          >
            {lines.length} line{lines.length !== 1 ? 's' : ''}
          </Badge>
          {lines.length > 20 && (
            <Badge 
              variant="outline" 
              className="text-xs px-1 sm:px-1.5 py-0 h-3.5 sm:h-4 bg-yellow-900/20 text-yellow-300 border-yellow-600/50 hidden sm:inline-flex"
            >
              Long
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs text-gray-300 hover:text-white hover:bg-gray-700 touch-manipulation"
          onClick={copyCode}
          aria-label="Copy code"
        >
          <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>
      
      {/* Mobile-optimized Code content */}
      <div className="relative">
        <div 
          className="overflow-x-auto bg-gray-900 max-w-full" 
          style={{ 
            maxHeight: window.innerWidth < 640 
              ? (lines.length > 20 ? '300px' : '250px')
              : (lines.length > 30 ? '500px' : '400px')
          }}
        >
          <pre className="p-2 sm:p-3 text-gray-100 font-mono text-xs sm:text-sm leading-relaxed m-0" style={{ tabSize: 2 }}>
            {showLineNumbers ? (
              <div className="flex">
                <div className="select-none text-gray-500 pr-2 sm:pr-4 border-r border-gray-700 mr-2 sm:mr-4 text-right flex-shrink-0">
                  {lines.map((_, i) => (
                    <div key={i} className="text-right text-xs">
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <code 
                    className="text-gray-100 break-all sm:break-normal"
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />
                </div>
              </div>
            ) : (
              <code 
                className="text-gray-100 break-all sm:break-normal"
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            )}
          </pre>
        </div>
      </div>
    </div>
  );
});