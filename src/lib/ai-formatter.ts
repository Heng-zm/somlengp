export type AIFormat = 'plain' | 'markdown' | 'html' | 'json' | 'code';

export interface FormatOptions {
  format: AIFormat;
  // Code options
  language?: string; // for code blocks
  // Markdown/HTML options
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  // Common options
  wrapAt?: number; // soft wrap width for plain/code
  includeTimestamps?: boolean;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function softWrap(text: string, width?: number): string {
  if (!width || width <= 0) return text;
  return text
    .split('\n')
    .map((line) => line.match(new RegExp(`.{1,${width}}`, 'g'))?.join('\n') || '')
    .join('\n');
}

export function formatAIResponse(content: string, options: FormatOptions): string {
  const { format, language, headingLevel, wrapAt } = options;
  const contentWrapped = softWrap(content, wrapAt);

  switch (format) {
    case 'plain':
      return contentWrapped;
    case 'markdown': {
      const heading = headingLevel ? `${'#'.repeat(headingLevel)} ` : '';
      return heading ? `${heading}${contentWrapped}` : contentWrapped;
    }
    case 'html': {
      const escaped = escapeHtml(contentWrapped)
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');
      return `<p>${escaped}</p>`;
    }
    case 'json': {
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        return JSON.stringify(parsed, null, 2);
      } catch {
        // Not valid JSON; wrap into an object
        return JSON.stringify({ text: contentWrapped }, null, 2);
      }
    }
    case 'code': {
      const lang = language || '';
      return `\u0060\u0060\u0060${lang}\n${contentWrapped}\n\u0060\u0060\u0060`;
    }
    default:
      return contentWrapped;
  }
}

export interface ExportOptions {
  filename: string;
  mime: 'text/plain' | 'text/markdown' | 'text/html' | 'application/json';
}

export function inferExportOptions(format: AIFormat): ExportOptions {
  switch (format) {
    case 'markdown':
      return { filename: 'response.md', mime: 'text/markdown' };
    case 'html':
      return { filename: 'response.html', mime: 'text/html' };
    case 'json':
      return { filename: 'response.json', mime: 'application/json' };
    default:
      return { filename: 'response.txt', mime: 'text/plain' };
  }
}

