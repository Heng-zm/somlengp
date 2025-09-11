/**
 * Utility functions for applying text styling to AI responses
 */

export interface TextStylingOptions {
  bold?: boolean;
  italic?: boolean;
  inlineCode?: boolean;
}

/**
 * Apply text styling markup to a string
 */
export function applyTextStyling(text: string, options: TextStylingOptions = {}): string {
  const { bold = true, italic = true, inlineCode = true } = options;
  
  let styledText = text;
  
  // Apply bold styling
  if (bold) {
    styledText = makeBold(styledText);
  }
  
  // Apply italic styling
  if (italic) {
    styledText = makeItalic(styledText);
  }
  
  // Apply inline code styling
  if (inlineCode) {
    styledText = makeInlineCode(styledText);
  }
  
  return styledText;
}

/**
 * Make text bold using **text** syntax
 */
export function makeBold(text: string): string {
  return text.replace(/\b([A-Z][a-zA-Z]*:)\b/g, '**$1**'); // Bold labels like "Shape:", "Face:"
}

/**
 * Make text italic using *text* syntax
 */
export function makeItalic(text: string): string {
  // Italic for descriptive words in quotes or emphasis
  return text.replace(/(['"])([^'"]+)\1/g, '*$2*');
}

/**
 * Make text inline code using `text` syntax
 */
export function makeInlineCode(text: string): string {
  // Code for technical terms, variables, or specific values
  const technicalTerms = [
    'warmth', 'friendliness', 'innocence',
    'API', 'JSON', 'HTML', 'CSS', 'JavaScript', 'TypeScript',
    'useState', 'useEffect', 'className', 'onClick'
  ];
  
  let codeText = text;
  technicalTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    codeText = codeText.replace(regex, '`$&`');
  });
  
  return codeText;
}

/**
 * Smart text styling that automatically detects and styles common patterns
 */
export function smartTextStyling(text: string): string {
  let styledText = text;
  
  // Bold for headers and labels
  styledText = styledText.replace(/^([A-Z][^:]*:)/gm, '**$1**');
  
  // Italic for descriptive phrases in parentheses
  styledText = styledText.replace(/\(([^)]+)\)/g, '(*$1*)');
  
  // Code for file paths, URLs, and code-like strings
  styledText = styledText.replace(/([a-zA-Z0-9._/-]+\.[a-zA-Z]{2,4})/g, '`$1`'); // file extensions
  styledText = styledText.replace(/(https?:\/\/[^\s]+)/g, '`$1`'); // URLs
  styledText = styledText.replace(/\b([a-zA-Z]+\(\))\b/g, '`$1`'); // function calls
  
  return styledText;
}

/**
 * Convert styled text to HTML format
 */
export function convertToHTML(styledText: string): string {
  return styledText
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

/**
 * Remove all styling markup from text
 */
export function removeTextStyling(styledText: string): string {
  return styledText
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1')     // Remove italic
    .replace(/`([^`]+)`/g, '$1');      // Remove code
}

/**
 * Example usage and demonstration
 */
export const exampleUsage = {
  input: `Here's a description of the image: The character shows warmth and friendliness.`,
  
  manualStyling: `Here's a description of the image: The character shows **warmth** and *friendliness*.`,
  
  smartStyling: smartTextStyling(`Here's a description of the image: The character shows warmth and friendliness.`),
  
  htmlOutput: convertToHTML(`Here's a description of the image: The character shows **warmth** and *friendliness*.`)
};
