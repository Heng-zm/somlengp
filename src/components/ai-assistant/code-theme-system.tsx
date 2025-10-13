'use client';

import { memo } from 'react';

// Define color themes for code highlighting
export const codeThemes = {
  dark: {
    background: 'bg-gray-900',
    headerBg: 'bg-gray-800',
    borderColor: 'border-gray-700',
    textColor: 'text-gray-100',
    keywords: 'text-blue-300',
    strings: 'text-green-300',
    numbers: 'text-yellow-300',
    comments: 'text-gray-400',
    operators: 'text-purple-300',
    functions: 'text-cyan-300',
    variables: 'text-orange-300',
    types: 'text-teal-300'
  },
  light: {
    background: 'bg-gray-50',
    headerBg: 'bg-gray-100',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-900',
    keywords: 'text-blue-700',
    strings: 'text-green-700',
    numbers: 'text-orange-600',
    comments: 'text-gray-500',
    operators: 'text-purple-700',
    functions: 'text-cyan-700',
    variables: 'text-red-600',
    types: 'text-teal-700'
  },
  monokai: {
    background: 'bg-slate-900',
    headerBg: 'bg-slate-800',
    borderColor: 'border-slate-700',
    textColor: 'text-slate-100',
    keywords: 'text-pink-400',
    strings: 'text-yellow-300',
    numbers: 'text-purple-400',
    comments: 'text-slate-500',
    operators: 'text-pink-400',
    functions: 'text-green-400',
    variables: 'text-blue-300',
    types: 'text-cyan-400'
  }
};

export type CodeTheme = keyof typeof codeThemes;

// Enhanced syntax highlighting with theme support
export const highlightCodeWithTheme = (
  code: string, 
  language: string = 'text', 
  theme: CodeTheme = 'dark'
) => {
  const colors = codeThemes[theme];
  
  // Escape HTML to prevent XSS
  const escapeHtml = (str: string) => 
    str.replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&#39;');

  let highlighted = escapeHtml(code);
  const lang = language.toLowerCase();
  
  // Enhanced JavaScript/TypeScript highlighting
  if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
    highlighted = highlighted
      // Keywords
      .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|try|catch|finally|throw|new|this|super|extends|implements)\b/g, 
        `<span class="${colors.keywords} font-semibold">$1</span>`)
      // Types (TypeScript)
      .replace(/\b(string|number|boolean|object|any|void|null|undefined|Array|Promise|Function)\b/g, 
        `<span class="${colors.types} font-medium">$1</span>`)
      // Functions
      .replace(/\b(\w+)\s*(?=\()/g, 
        `<span class="${colors.functions}">$1</span>`)
      // Strings (improved regex)
      .replace(/([`'"])([^`'"]*?)\1/g, 
        `<span class="${colors.strings}">$1$2$1</span>`)
      // Numbers
      .replace(/\b(\d+\.?\d*|0x[0-9a-fA-F]+)\b/g, 
        `<span class="${colors.numbers}">$1</span>`)
      // Operators
      .replace(/([+\-*/%=<>!&|?:]+)/g, 
        `<span class="${colors.operators}">$1</span>`)
      // Single line comments
      .replace(/\/\/.*$/gm, 
        `<span class="${colors.comments} italic">$&</span>`)
      // Multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, 
        `<span class="${colors.comments} italic">$&</span>`);
  }
  
  // Enhanced Python highlighting
  else if (lang === 'python' || lang === 'py') {
    highlighted = highlighted
      // Keywords
      .replace(/\b(def|class|import|from|return|if|else|elif|for|while|try|except|with|as|True|False|None|and|or|not|in|is|lambda|yield|global|nonlocal|pass|break|continue)\b/g,
        `<span class="${colors.keywords} font-semibold">$1</span>`)
      // Built-in functions
      .replace(/\b(print|len|range|str|int|float|list|dict|tuple|set|type|isinstance|hasattr|getattr|setattr|super)\b/g,
        `<span class="${colors.functions}">$1</span>`)
      // Decorators
      .replace(/@\w+/g,
        `<span class="${colors.operators} font-medium">$&</span>`)
      // Strings
      .replace(/(['"])([^'"]*?)\1/g,
        `<span class="${colors.strings}">$1$2$1</span>`)
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g,
        `<span class="${colors.numbers}">$1</span>`)
      // Comments
      .replace(/#.*$/gm,
        `<span class="${colors.comments} italic">$&</span>`);
  }
  
  // Enhanced JSON highlighting
  else if (lang === 'json') {
    highlighted = highlighted
      // Property keys
      .replace(/&quot;([^&]+)&quot;\s*:/g,
        `<span class="${colors.keywords}">&quot;$1&quot;</span>:`)
      // String values
      .replace(/(:\s*)(&quot;[^&]*&quot;)/g,
        `$1<span class="${colors.strings}">$2</span>`)
      // Boolean/null values
      .replace(/(:\s*)(true|false|null)\b/g,
        `$1<span class="${colors.operators} font-medium">$2</span>`)
      // Numbers
      .replace(/(:\s*)(\d+(?:\.\d+)?)\b/g,
        `$1<span class="${colors.numbers}">$2</span>`);
  }
  
  // Enhanced HTML/XML highlighting
  else if (lang === 'html' || lang === 'xml' || lang === 'jsx' || lang === 'tsx') {
    highlighted = highlighted
      // Tag names
      .replace(/(&lt;\/?)(\w+)/g,
        `<span class="${colors.operators}">$1</span><span class="${colors.keywords} font-semibold">$2</span>`)
      // Attributes
      .replace(/(\w+)(=)/g,
        `<span class="${colors.functions}">$1</span><span class="${colors.operators}">$2</span>`)
      // Attribute values
      .replace(/=(&quot;[^&]*&quot;)/g,
        `=<span class="${colors.strings}">$1</span>`)
      // Closing brackets
      .replace(/(&gt;)/g,
        `<span class="${colors.operators}">$1</span>`);
  }
  
  // Enhanced CSS highlighting
  else if (lang === 'css' || lang === 'scss' || lang === 'sass') {
    highlighted = highlighted
      // Selectors
      .replace(/^([.#]?[\w-]+)\s*{/gm,
        `<span class="${colors.keywords} font-semibold">$1</span> {`)
      // Properties
      .replace(/(\w+[\w-]*)\s*:/g,
        `<span class="${colors.functions}">$1</span>:`)
      // Values
      .replace(/:\s*([^;]+);/g,
        `: <span class="${colors.strings}">$1</span>;`)
      // Comments
      .replace(/\/\*[\s\S]*?\*\//g,
        `<span class="${colors.comments} italic">$&</span>`);
  }
  
  // SQL highlighting
  else if (lang === 'sql') {
    highlighted = highlighted
      // Keywords
      .replace(/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE|DATABASE|INDEX|ALTER|DROP|JOIN|INNER|LEFT|RIGHT|FULL|ON|GROUP|BY|ORDER|HAVING|UNION|DISTINCT|AS|IN|EXISTS|LIKE|BETWEEN|IS|NULL|NOT|AND|OR)\b/gi,
        `<span class="${colors.keywords} font-semibold">$1</span>`)
      // Functions
      .replace(/\b(COUNT|SUM|AVG|MIN|MAX|CONCAT|LENGTH|UPPER|LOWER|TRIM|DATE|NOW)\b/gi,
        `<span class="${colors.functions}">$1</span>`)
      // Strings
      .replace(/'([^']*)'/g,
        `<span class="${colors.strings}">'$1'</span>`)
      // Numbers
      .replace(/\b(\d+)\b/g,
        `<span class="${colors.numbers}">$1</span>`)
      // Comments
      .replace(/--.*$/gm,
        `<span class="${colors.comments} italic">$&</span>`);
  }
  
  return highlighted;
};

// Theme-aware code block wrapper
export const ThemedCodeBlock = memo(function ThemedCodeBlock({
  code,
  language,
  theme = 'dark',
  showLineNumbers = false,
  className = ''
}: {
  code: string;
  language: string;
  theme?: CodeTheme;
  showLineNumbers?: boolean;
  className?: string;
}) {
  const colors = codeThemes[theme];
  const lines = code.split('\\n');
  const highlightedCode = highlightCodeWithTheme(code, language, theme);

  return (
    <div className={`rounded-lg overflow-hidden ${colors.background} ${colors.borderColor} border ${className}`}>
      <div className={`${colors.headerBg} px-3 py-2 ${colors.borderColor} border-b`}>
        <span className={`text-xs font-mono ${colors.textColor} opacity-80 capitalize`}>
          {language || 'text'}
        </span>
      </div>
      
      <div className="relative overflow-x-auto">
        <pre className={`p-4 ${colors.textColor} font-mono text-sm leading-relaxed`} style={{ tabSize: 2 }}>
          {showLineNumbers ? (
            <div className="flex">
              <div className={`select-none ${colors.comments} pr-4 border-r ${colors.borderColor} mr-4 text-right`}>
                {lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <div className="flex-1">
                <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
              </div>
            </div>
          ) : (
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          )}
        </pre>
      </div>
    </div>
  );
});