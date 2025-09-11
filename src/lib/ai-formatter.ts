export type AIFormat = 'plain' | 'markdown' | 'html' | 'json' | 'code';

export interface FormatOptions {
  format: AIFormat;
  // Code options
  language?: string; // for code blocks
  // Markdown/HTML options
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  // Text styling options
  enableBold?: boolean;
  enableItalic?: boolean;
  enableInlineCode?: boolean;
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

function applyTextStyling(text: string, options: FormatOptions): string {
  const { format, enableBold = true, enableItalic = true, enableInlineCode = true } = options;
  let styledText = text;

  if (format === 'markdown') {
    // For markdown, either keep or remove styling
    if (!enableInlineCode) {
      styledText = styledText.replace(/`([^`]+?)`/g, '$1');
    }
    
    if (!enableBold) {
      styledText = styledText.replace(/\*\*([^*]+?)\*\*/g, '$1');
    }
    
    if (!enableItalic) {
      // Split by bold markers to avoid removing asterisks from bold text
      let parts = styledText.split('**');
      for (let i = 0; i < parts.length; i += 2) {
        parts[i] = parts[i].replace(/\*([^*]+?)\*/g, '$1');
      }
      styledText = parts.join('**');
    }
    
  } else if (format === 'html') {
    // For HTML, convert markdown to HTML tags or remove styling
    
    // Process inline code first
    if (enableInlineCode) {
      styledText = styledText.replace(/`([^`]+?)`/g, '<code>$1</code>');
    } else {
      styledText = styledText.replace(/`([^`]+?)`/g, '$1');
    }
    
    // Process bold first
    if (enableBold) {
      styledText = styledText.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    } else {
      styledText = styledText.replace(/\*\*([^*]+?)\*\*/g, '$1');
    }
    
    // Process italic (handle single asterisks, avoiding those inside <strong> tags)
    if (enableItalic) {
      // Use a more careful approach to handle italics
      styledText = styledText.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
    } else {
      // Remove italic markers
      styledText = styledText.replace(/\*([^*]+?)\*/g, '$1');
    }
  }

  return styledText;
}

export function formatAIResponse(content: string, options: FormatOptions): string {
  const { format, language, headingLevel, wrapAt } = options;
  const contentWrapped = softWrap(content, wrapAt);
  const styledContent = applyTextStyling(contentWrapped, options);

  switch (format) {
    case 'plain':
      return styledContent;
    case 'markdown': {
      const heading = headingLevel ? `${'#'.repeat(headingLevel)} ` : '';
      return heading ? `${heading}${styledContent}` : styledContent;
    }
    case 'html': {
      // First apply text styling, then escape remaining HTML
      let htmlContent = styledContent;
      
      // Escape HTML characters but preserve our styling tags
      const preservedTags = ['<strong>', '</strong>', '<em>', '</em>', '<code>', '</code>'];
      const placeholders: string[] = [];
      
      // Replace styling tags with placeholders
      preservedTags.forEach((tag, index) => {
        const placeholder = `__PRESERVE_TAG_${index}__`;
        htmlContent = htmlContent.replace(new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), placeholder);
        placeholders[index] = tag;
      });
      
      // Escape HTML
      htmlContent = escapeHtml(htmlContent)
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');
      
      // Restore styling tags
      placeholders.forEach((tag, index) => {
        const placeholder = `__PRESERVE_TAG_${index}__`;
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), tag);
      });
      
      return `<p>${htmlContent}</p>`;
    }
    case 'json': {
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        return JSON.stringify(parsed, null, 2);
      } catch {
        // Not valid JSON; wrap into an object
        return JSON.stringify({ text: styledContent }, null, 2);
      }
    }
    case 'code': {
      const lang = language || '';
      return `\u0060\u0060\u0060${lang}\n${styledContent}\n\u0060\u0060\u0060`;
    }
    default:
      return styledContent;
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

