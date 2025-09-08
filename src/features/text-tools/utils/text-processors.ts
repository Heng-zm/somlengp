// Text processing utility functions

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingTime: number; // in minutes
  // Advanced analytics
  averageWordsPerSentence: number;
  averageSentencesPerParagraph: number;
  averageCharactersPerWord: number;
  uniqueWords: number;
  readabilityScore: number; // Flesch Reading Ease Score
  languageDetection: string;
  mostCommonWords: Array<{word: string; count: number}>;
  complexity: 'Simple' | 'Medium' | 'Complex';
}

export interface TextDiff {
  operation: 'equal' | 'delete' | 'insert';
  text: string;
}

// Text statistics calculation with advanced analytics
export function calculateTextStats(text: string): TextStats {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  
  // Words - split by whitespace and filter empty strings
  const wordArray = text.trim() ? text.trim().split(/\s+/) : [];
  const words = wordArray.length;
  
  // Sentences - count by periods, exclamation marks, and question marks
  const sentenceArray = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentences = sentenceArray.length;
  
  // Paragraphs - split by double line breaks
  const paragraphArray = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim().length > 0) : [];
  const paragraphs = paragraphArray.length;
  
  // Lines - count line breaks + 1
  const lines = text ? text.split('\n').length : 0;
  
  // Reading time - average 250 words per minute
  const readingTime = Math.ceil(words / 250);
  
  // Advanced analytics
  const averageWordsPerSentence = sentences > 0 ? Math.round((words / sentences) * 10) / 10 : 0;
  const averageSentencesPerParagraph = paragraphs > 0 ? Math.round((sentences / paragraphs) * 10) / 10 : 0;
  const averageCharactersPerWord = words > 0 ? Math.round((charactersNoSpaces / words) * 10) / 10 : 0;
  
  // Unique words count
  const uniqueWordSet = new Set(
    wordArray.map(word => word.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')).filter(word => word.length > 0)
  );
  const uniqueWords = uniqueWordSet.size;
  
  // Flesch Reading Ease Score
  const avgSentenceLength = averageWordsPerSentence;
  const avgSyllablesPerWord = calculateAverageSyllables(wordArray);
  const readabilityScore = sentences > 0 && words > 0 
    ? Math.round(206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord))
    : 0;
  
  // Language detection (simplified)
  const languageDetection = detectLanguage(text);
  
  // Most common words
  const wordFrequency = getWordFrequency(wordArray);
  const mostCommonWords = Object.entries(wordFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));
  
  // Complexity assessment
  let complexity: 'Simple' | 'Medium' | 'Complex' = 'Simple';
  if (readabilityScore < 50) {
    complexity = 'Complex';
  } else if (readabilityScore < 70) {
    complexity = 'Medium';
  }
  
  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    readingTime,
    averageWordsPerSentence,
    averageSentencesPerParagraph,
    averageCharactersPerWord,
    uniqueWords,
    readabilityScore,
    languageDetection,
    mostCommonWords,
    complexity
  };
}

// Helper function to calculate average syllables per word
function calculateAverageSyllables(words: string[]): number {
  if (words.length === 0) return 0;
  
  const syllableCounts = words.map(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-zA-Z]/g, '');
    if (cleanWord.length === 0) return 1;
    
    // Simple syllable counting algorithm
    const vowels = cleanWord.match(/[aeiouy]+/g);
    let syllables = vowels ? vowels.length : 1;
    
    // Adjust for silent 'e'
    if (cleanWord.endsWith('e')) syllables--;
    
    // Minimum of 1 syllable per word
    return Math.max(syllables, 1);
  });
  
  const totalSyllables = syllableCounts.reduce((sum, count) => sum + count, 0);
  return totalSyllables / words.length;
}

// Helper function for simple language detection
function detectLanguage(text: string): string {
  if (text.length < 10) return 'Unknown';
  
  // Simple heuristics for language detection
  const englishWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'has', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
  const words = text.toLowerCase().split(/\s+/).slice(0, 50); // Check first 50 words
  
  const englishMatches = words.filter(word => 
    englishWords.includes(word.replace(/[^a-z]/g, ''))
  ).length;
  
  const englishPercentage = englishMatches / Math.min(words.length, 50);
  
  if (englishPercentage > 0.2) {
    return 'English';
  }
  
  return 'Other';
}

// Helper function to get word frequency
function getWordFrequency(words: string[]): Record<string, number> {
  const frequency: Record<string, number> = {};
  const commonWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'has', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'a', 'an', 'as', 'at', 'be', 'by', 'he', 'in', 'is', 'it', 'of', 'on', 'or', 'to']);
  
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    if (cleanWord.length > 2 && !commonWords.has(cleanWord)) {
      frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
    }
  });
  
  return frequency;
}

// Text case conversions
export function toUpperCase(text: string): string {
  return text.toUpperCase();
}

export function toLowerCase(text: string): string {
  return text.toLowerCase();
}

export function toTitleCase(text: string): string {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

export function toCamelCase(text: string): string {
  return text
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

export function toPascalCase(text: string): string {
  return text
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
      return word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

export function toSnakeCase(text: string): string {
  return text
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('_');
}

export function toKebabCase(text: string): string {
  return text
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('-');
}

export function toSentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Text transformations
export function reverseText(text: string): string {
  return text.split('').reverse().join('');
}

export function removeExtraSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function removeEmptyLines(text: string): string {
  return text.split('\n').filter(line => line.trim().length > 0).join('\n');
}

export function sortLines(text: string, ascending: boolean = true): string {
  const lines = text.split('\n');
  return lines.sort((a, b) => {
    if (ascending) {
      return a.localeCompare(b);
    } else {
      return b.localeCompare(a);
    }
  }).join('\n');
}

export function removeDuplicateLines(text: string): string {
  const lines = text.split('\n');
  const uniqueLines = [...new Set(lines)];
  return uniqueLines.join('\n');
}

export function addLineNumbers(text: string): string {
  const lines = text.split('\n');
  return lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
}

// Text encoding/decoding with improved error handling and performance
export function encodeBase64(text: string): string {
  try {
    // More robust Base64 encoding for Unicode text
    if (typeof btoa === 'undefined') {
      throw new Error('Base64 encoding not supported in this environment');
    }
    return btoa(new TextEncoder().encode(text).reduce((data, byte) => data + String.fromCharCode(byte), ''));
  } catch {
    throw new Error('Failed to encode text to Base64. Please check if the text contains valid characters.');
  }
}

export function decodeBase64(text: string): string {
  try {
    if (typeof atob === 'undefined') {
      throw new Error('Base64 decoding not supported in this environment');
    }
    // Validate Base64 format first
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(text)) {
      throw new Error('Invalid Base64 format');
    }
    const binary = atob(text);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error('Failed to decode Base64 text. Please ensure the input is valid Base64 encoded.');
  }
}

export function encodeURL(text: string): string {
  try {
    return encodeURIComponent(text);
  } catch {
    throw new Error('Failed to URL encode text');
  }
}

export function decodeURL(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    throw new Error('Failed to decode URL-encoded text. Please ensure the input is valid URL encoding.');
  }
}

// JSON formatting
export function formatJSON(text: string, indent: number = 2): string {
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, indent);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

export function minifyJSON(text: string): string {
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

// Text difference calculation (simplified version)
export function calculateTextDifference(text1: string, text2: string): TextDiff[] {
  const diffs: TextDiff[] = [];
  
  // Simple word-based diff algorithm
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);
  
  let i = 0, j = 0;
  
  while (i < words1.length || j < words2.length) {
    if (i >= words1.length) {
      // Remaining words in text2 are insertions
      diffs.push({ operation: 'insert', text: words2.slice(j).join(' ') });
      break;
    } else if (j >= words2.length) {
      // Remaining words in text1 are deletions
      diffs.push({ operation: 'delete', text: words1.slice(i).join(' ') });
      break;
    } else if (words1[i] === words2[j]) {
      // Words are equal
      diffs.push({ operation: 'equal', text: words1[i] });
      i++;
      j++;
    } else {
      // Find next matching word
      let found = false;
      for (let k = j + 1; k < words2.length; k++) {
        if (words1[i] === words2[k]) {
          // Insert words before the match
          diffs.push({ operation: 'insert', text: words2.slice(j, k).join(' ') });
          j = k;
          found = true;
          break;
        }
      }
      if (!found) {
        // Delete the word from text1
        diffs.push({ operation: 'delete', text: words1[i] });
        i++;
      }
    }
  }
  
  return diffs;
}

// HTML/XML utilities
export function stripHTML(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

export function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function unescapeHTML(text: string): string {
  const div = document.createElement('div');
  div.innerHTML = text;
  return div.textContent || div.innerText || '';
}

// Hash generation (simple)
export function generateHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

// Word/phrase utilities
export function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}

export function extractURLs(text: string): string[] {
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  return text.match(urlRegex) || [];
}

export function extractPhoneNumbers(text: string): string[] {
  const phoneRegex = /(\+?1?[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
  return text.match(phoneRegex) || [];
}
