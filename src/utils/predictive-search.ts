'use client';

import { QRHistoryItem } from './qr-scan-history';
import { analyzeQRContent } from '@/ai/flows/qr-analysis-flow';
import { errorHandler } from '@/lib/error-utils';

export interface SearchSuggestion {
  text: string;
  type: 'content' | 'category' | 'tag' | 'semantic' | 'action';
  confidence: number;
  matchCount?: number;
  icon?: string;
  description?: string;
}

export interface SemanticSearchResult {
  item: QRHistoryItem;
  relevanceScore: number;
  matchReasons: string[];
  semanticSimilarity?: number;
  keywords: string[];
}

export interface SearchOptions {
  enableSemanticSearch?: boolean;
  enablePredictive?: boolean;
  maxSuggestions?: number;
  minConfidence?: number;
  searchTimeout?: number;
  includeContent?: boolean;
  includeTags?: boolean;
  includeCategories?: boolean;
  enableFuzzyMatch?: boolean;
}

interface SearchIndex {
  keywords: Map<string, Set<string>>; // keyword -> item IDs
  categories: Map<string, Set<string>>; // category -> item IDs
  tags: Map<string, Set<string>>; // tag -> item IDs
  content: Map<string, Set<string>>; // content hash -> item IDs
  semanticVectors: Map<string, number[]>; // item ID -> semantic vector
  lastUpdated: number;
}

class PredictiveSearchEngine {
  private searchIndex: SearchIndex = {
    keywords: new Map(),
    categories: new Map(),
    tags: new Map(),
    content: new Map(),
    semanticVectors: new Map(),
    lastUpdated: 0
  };

  private searchHistory: string[] = [];
  private popularTerms: Map<string, number> = new Map();
  private recentSearches: Array<{ query: string; timestamp: number; resultCount: number }> = [];

  constructor() {
    this.initializeSearch();
  }

  private initializeSearch(): void {
    // Load search history from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('qr-search-history');
        if (stored) {
          const parsed = JSON.parse(stored);
          this.searchHistory = parsed.history || [];
          this.popularTerms = new Map(Object.entries(parsed.popularTerms || {}));
          this.recentSearches = parsed.recentSearches || [];
        }
      } catch (error) {
        console.warn('Failed to load search history:', error);
      }
    }
  }

  /**
   * Build search index from QR history items
   */
  buildSearchIndex(items: QRHistoryItem[]): void {
    try {
      // Clear existing index
      this.searchIndex = {
        keywords: new Map(),
        categories: new Map(),
        tags: new Map(),
        content: new Map(),
        semanticVectors: new Map(),
        lastUpdated: Date.now()
      };

      for (const item of items) {
        try {
          // Index keywords from content
          const keywords = this.extractKeywords(item.data);
          keywords.forEach(keyword => {
            if (!this.searchIndex.keywords.has(keyword)) {
              this.searchIndex.keywords.set(keyword, new Set());
            }
            this.searchIndex.keywords.get(keyword)!.add(item.id);
          });

          // Index category
          if (item.category) {
            const category = item.category.toLowerCase();
            if (!this.searchIndex.categories.has(category)) {
              this.searchIndex.categories.set(category, new Set());
            }
            this.searchIndex.categories.get(category)!.add(item.id);
          }

          // Index tags
          if (item.tags) {
            item.tags.forEach(tag => {
              const normalizedTag = tag.toLowerCase();
              if (!this.searchIndex.tags.has(normalizedTag)) {
                this.searchIndex.tags.set(normalizedTag, new Set());
              }
              this.searchIndex.tags.get(normalizedTag)!.add(item.id);
            });
          }

          // Index content hash for exact matching
          const contentHash = this.generateContentHash(item.data);
          if (!this.searchIndex.content.has(contentHash)) {
            this.searchIndex.content.set(contentHash, new Set());
          }
          this.searchIndex.content.get(contentHash)!.add(item.id);

        } catch (itemError) {
          console.warn(`Failed to index item ${item.id}:`, itemError);
        }
      }

      console.log(`Search index built with ${items.length} items`);
    } catch (error) {
      errorHandler.handle(error, { method: 'buildSearchIndex', itemCount: items.length });
    }
  }

  /**
   * Generate search suggestions based on partial input
   */
  async generateSearchSuggestions(
    partialQuery: string, 
    items: QRHistoryItem[],
    options: SearchOptions = {}
  ): Promise<SearchSuggestion[]> {
    const {
      maxSuggestions = 8,
      minConfidence = 0.3,
      includeContent = true,
      includeTags = true,
      includeCategories = true,
      enableFuzzyMatch = true
    } = options;

    try {
      if (!partialQuery || partialQuery.length < 2) {
        return this.getPopularSearchSuggestions(maxSuggestions);
      }

      const normalizedQuery = partialQuery.toLowerCase().trim();
      const suggestions: SearchSuggestion[] = [];

      // 1. Search history suggestions
      const historySuggestions = this.getHistorySuggestions(normalizedQuery, 3);
      suggestions.push(...historySuggestions);

      // 2. Category suggestions
      if (includeCategories) {
        const categorySuggestions = this.getCategorySuggestions(normalizedQuery, items, 2);
        suggestions.push(...categorySuggestions);
      }

      // 3. Tag suggestions
      if (includeTags) {
        const tagSuggestions = this.getTagSuggestions(normalizedQuery, items, 2);
        suggestions.push(...tagSuggestions);
      }

      // 4. Content-based suggestions
      if (includeContent) {
        const contentSuggestions = this.getContentSuggestions(normalizedQuery, items, 3);
        suggestions.push(...contentSuggestions);
      }

      // 5. Fuzzy match suggestions
      if (enableFuzzyMatch) {
        const fuzzySuggestions = this.getFuzzyMatchSuggestions(normalizedQuery, items, 2);
        suggestions.push(...fuzzySuggestions);
      }

      // 6. Semantic suggestions (if AI is available)
      try {
        const semanticSuggestions = await this.getSemanticSuggestions(normalizedQuery, items, 2);
        suggestions.push(...semanticSuggestions);
      } catch (aiError) {
        console.warn('Semantic suggestions failed:', aiError);
      }

      // Deduplicate and rank suggestions
      const uniqueSuggestions = this.deduplicateAndRankSuggestions(suggestions);
      
      return uniqueSuggestions
        .filter(s => s.confidence >= minConfidence)
        .slice(0, maxSuggestions);

    } catch (error) {
      errorHandler.handle(error, { method: 'generateSearchSuggestions', query: partialQuery });
      return this.getPopularSearchSuggestions(Math.min(maxSuggestions, 3));
    }
  }

  /**
   * Perform semantic search on QR history
   */
  async performSemanticSearch(
    query: string,
    items: QRHistoryItem[],
    options: SearchOptions = {}
  ): Promise<SemanticSearchResult[]> {
    const {
      enableSemanticSearch = true,
      minConfidence = 0.3,
      searchTimeout = 5000
    } = options;

    try {
      // Record search for analytics
      this.recordSearch(query, items.length);

      const normalizedQuery = query.toLowerCase().trim();
      
      if (!normalizedQuery) {
        return [];
      }

      const results: SemanticSearchResult[] = [];
      const searchTerms = this.extractSearchTerms(normalizedQuery);

      // Perform traditional keyword search first
      for (const item of items) {
        const relevanceScore = this.calculateTraditionalRelevance(item, searchTerms, normalizedQuery);
        
        if (relevanceScore.score > 0) {
          results.push({
            item,
            relevanceScore: relevanceScore.score,
            matchReasons: relevanceScore.reasons,
            keywords: relevanceScore.keywords
          });
        }
      }

      // Enhance with semantic search if enabled
      if (enableSemanticSearch && results.length < 10) {
        try {
          const semanticResults = await this.performAISemanticSearch(query, items, searchTimeout);
          
          // Merge semantic results with traditional results
          for (const semanticResult of semanticResults) {
            const existingResult = results.find(r => r.item.id === semanticResult.item.id);
            if (existingResult) {
              // Boost existing result with semantic similarity
              existingResult.relevanceScore = Math.max(
                existingResult.relevanceScore, 
                semanticResult.relevanceScore
              );
              existingResult.semanticSimilarity = semanticResult.semanticSimilarity;
              existingResult.matchReasons.push(...semanticResult.matchReasons);
            } else {
              results.push(semanticResult);
            }
          }
        } catch (aiError) {
          console.warn('AI semantic search failed, using traditional search only:', aiError);
        }
      }

      // Sort by relevance score and filter by confidence
      return results
        .filter(result => result.relevanceScore >= minConfidence)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 50); // Limit results

    } catch (error) {
      errorHandler.handle(error, { method: 'performSemanticSearch', query });
      return [];
    }
  }

  private extractKeywords(text: string): string[] {
    // Extract meaningful keywords from text
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.isStopWord(word));

    // Remove duplicates
    return [...new Set(words)];
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'among', 'this', 'that', 'these', 'those', 'i', 'me', 'my',
      'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
      'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its',
      'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
      'who', 'whom', 'whose', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
      'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do',
      'does', 'did', 'doing', 'will', 'would', 'should', 'could', 'can', 'may',
      'might', 'must', 'ought', 'shall', 'will', 'would'
    ]);
    
    return stopWords.has(word.toLowerCase());
  }

  private generateContentHash(content: string): string {
    // Simple hash for content matching
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private getPopularSearchSuggestions(maxCount: number): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    // Add popular terms from search history
    const sortedTerms = Array.from(this.popularTerms.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxCount);

    for (const [term, count] of sortedTerms) {
      suggestions.push({
        text: term,
        type: 'semantic',
        confidence: Math.min(1, count / 10),
        matchCount: count,
        icon: '🔍',
        description: `Popular search (${count} times)`
      });
    }

    // Fill remaining slots with recent searches
    const recentTerms = this.recentSearches
      .slice(-maxCount)
      .reverse()
      .filter(search => !suggestions.some(s => s.text === search.query));

    for (const recent of recentTerms.slice(0, maxCount - suggestions.length)) {
      suggestions.push({
        text: recent.query,
        type: 'semantic',
        confidence: 0.7,
        matchCount: recent.resultCount,
        icon: '🕒',
        description: 'Recent search'
      });
    }

    return suggestions;
  }

  private getHistorySuggestions(query: string, maxCount: number): SearchSuggestion[] {
    const matches = this.searchHistory
      .filter(term => term.toLowerCase().includes(query))
      .slice(0, maxCount);

    return matches.map(term => ({
      text: term,
      type: 'semantic' as const,
      confidence: 0.8,
      icon: '🕒',
      description: 'From search history'
    }));
  }

  private getCategorySuggestions(query: string, items: QRHistoryItem[], maxCount: number): SearchSuggestion[] {
    const categories = new Map<string, number>();
    
    items.forEach(item => {
      if (item.category && item.category.toLowerCase().includes(query)) {
        categories.set(item.category, (categories.get(item.category) || 0) + 1);
      }
    });

    return Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxCount)
      .map(([category, count]) => ({
        text: category,
        type: 'category' as const,
        confidence: 0.9,
        matchCount: count,
        icon: '📁',
        description: `${count} items in category`
      }));
  }

  private getTagSuggestions(query: string, items: QRHistoryItem[], maxCount: number): SearchSuggestion[] {
    const tags = new Map<string, number>();
    
    items.forEach(item => {
      item.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(query)) {
          tags.set(tag, (tags.get(tag) || 0) + 1);
        }
      });
    });

    return Array.from(tags.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxCount)
      .map(([tag, count]) => ({
        text: tag,
        type: 'tag' as const,
        confidence: 0.85,
        matchCount: count,
        icon: '🏷️',
        description: `${count} items with tag`
      }));
  }

  private getContentSuggestions(query: string, items: QRHistoryItem[], maxCount: number): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const keywordMatches = new Map<string, number>();

    items.forEach(item => {
      const keywords = this.extractKeywords(item.data);
      keywords.forEach(keyword => {
        if (keyword.includes(query) && keyword !== query) {
          keywordMatches.set(keyword, (keywordMatches.get(keyword) || 0) + 1);
        }
      });
    });

    Array.from(keywordMatches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxCount)
      .forEach(([keyword, count]) => {
        suggestions.push({
          text: keyword,
          type: 'content',
          confidence: 0.7,
          matchCount: count,
          icon: '📄',
          description: `Found in ${count} items`
        });
      });

    return suggestions;
  }

  private getFuzzyMatchSuggestions(query: string, items: QRHistoryItem[], maxCount: number): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const fuzzyMatches = new Map<string, { score: number; count: number }>();

    // Simple fuzzy matching algorithm
    items.forEach(item => {
      const content = item.data.toLowerCase();
      const words = content.split(/\s+/);
      
      words.forEach(word => {
        if (word.length > 3) {
          const similarity = this.calculateStringSimilarity(query, word);
          if (similarity > 0.6 && similarity < 1) {
            const current = fuzzyMatches.get(word) || { score: 0, count: 0 };
            fuzzyMatches.set(word, {
              score: Math.max(current.score, similarity),
              count: current.count + 1
            });
          }
        }
      });
    });

    Array.from(fuzzyMatches.entries())
      .filter(([_, data]) => data.count >= 2)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, maxCount)
      .forEach(([word, data]) => {
        suggestions.push({
          text: word,
          type: 'content',
          confidence: data.score * 0.8,
          matchCount: data.count,
          icon: '🔍',
          description: `Similar to "${query}"`
        });
      });

    return suggestions;
  }

  private async getSemanticSuggestions(query: string, items: QRHistoryItem[], maxCount: number): Promise<SearchSuggestion[]> {
    // This would ideally use AI to generate semantic suggestions
    // For now, return empty array as this requires complex AI integration
    return [];
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Levenshtein distance-based similarity
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
  }

  private deduplicateAndRankSuggestions(suggestions: SearchSuggestion[]): SearchSuggestion[] {
    const seen = new Set<string>();
    const unique: SearchSuggestion[] = [];

    // Sort by confidence first
    suggestions.sort((a, b) => b.confidence - a.confidence);

    for (const suggestion of suggestions) {
      const key = `${suggestion.text.toLowerCase()}_${suggestion.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(suggestion);
      }
    }

    return unique;
  }

  private extractSearchTerms(query: string): string[] {
    return query.split(/\s+/).filter(term => term.length > 0);
  }

  private calculateTraditionalRelevance(
    item: QRHistoryItem, 
    searchTerms: string[], 
    fullQuery: string
  ): { score: number; reasons: string[]; keywords: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const matchedKeywords: string[] = [];

    // Exact content match (highest score)
    if (item.data.toLowerCase().includes(fullQuery)) {
      score += 100;
      reasons.push('Exact content match');
    }

    // Individual term matches
    for (const term of searchTerms) {
      // Content match
      if (item.data.toLowerCase().includes(term)) {
        score += 20;
        matchedKeywords.push(term);
        reasons.push(`Content contains "${term}"`);
      }

      // Category match
      if (item.category && item.category.toLowerCase().includes(term)) {
        score += 15;
        reasons.push(`Category matches "${term}"`);
      }

      // Tag match
      if (item.tags?.some(tag => tag.toLowerCase().includes(term))) {
        score += 10;
        reasons.push(`Tag contains "${term}"`);
      }

      // Type match
      if (item.parsedData.type.toLowerCase().includes(term)) {
        score += 8;
        reasons.push(`Type matches "${term}"`);
      }

      // Label match
      if (item.parsedData.label?.toLowerCase().includes(term)) {
        score += 12;
        reasons.push(`Label contains "${term}"`);
      }
    }

    // Boost for frequently scanned items
    if (item.scanCount > 1) {
      score += Math.min(10, item.scanCount * 2);
      reasons.push(`Frequently scanned (${item.scanCount} times)`);
    }

    // Boost for recent items
    const daysSinceScanned = (Date.now() - item.lastScanned) / (24 * 60 * 60 * 1000);
    if (daysSinceScanned < 7) {
      score += Math.max(0, 10 - daysSinceScanned);
      reasons.push('Recently scanned');
    }

    // Normalize score to 0-1 range
    score = Math.min(1, score / 100);

    return { score, reasons, keywords: matchedKeywords };
  }

  private async performAISemanticSearch(
    query: string, 
    items: QRHistoryItem[], 
    timeout: number
  ): Promise<SemanticSearchResult[]> {
    // This is a simplified version - in a real implementation, 
    // you would use embeddings or other AI techniques
    return [];
  }

  private recordSearch(query: string, resultCount: number): void {
    try {
      // Update popular terms
      const normalizedQuery = query.toLowerCase().trim();
      if (normalizedQuery.length > 0) {
        this.popularTerms.set(normalizedQuery, (this.popularTerms.get(normalizedQuery) || 0) + 1);
        
        // Add to search history
        if (!this.searchHistory.includes(normalizedQuery)) {
          this.searchHistory.unshift(normalizedQuery);
          this.searchHistory = this.searchHistory.slice(0, 50); // Keep only recent 50
        }

        // Add to recent searches
        this.recentSearches.push({
          query: normalizedQuery,
          timestamp: Date.now(),
          resultCount
        });
        this.recentSearches = this.recentSearches.slice(-20); // Keep only recent 20
      }

      // Save to localStorage
      this.saveSearchHistory();
    } catch (error) {
      errorHandler.handle(error, { method: 'recordSearch' });
    }
  }

  private saveSearchHistory(): void {
    if (typeof window !== 'undefined') {
      try {
        const data = {
          history: this.searchHistory,
          popularTerms: Object.fromEntries(this.popularTerms),
          recentSearches: this.recentSearches
        };
        localStorage.setItem('qr-search-history', JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save search history:', error);
      }
    }
  }

  /**
   * Clear search history and popular terms
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
    this.popularTerms.clear();
    this.recentSearches = [];
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qr-search-history');
    }
  }

  /**
   * Get search analytics
   */
  getSearchAnalytics(): {
    totalSearches: number;
    popularTerms: Array<{ term: string; count: number }>;
    recentSearches: Array<{ query: string; timestamp: number; resultCount: number }>;
    averageResultCount: number;
  } {
    const totalSearches = Array.from(this.popularTerms.values()).reduce((sum, count) => sum + count, 0);
    const popularTerms = Array.from(this.popularTerms.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const averageResultCount = this.recentSearches.length > 0 ?
      this.recentSearches.reduce((sum, search) => sum + search.resultCount, 0) / this.recentSearches.length :
      0;

    return {
      totalSearches,
      popularTerms,
      recentSearches: [...this.recentSearches].reverse(),
      averageResultCount: Math.round(averageResultCount * 10) / 10
    };
  }
}

// Export singleton instance
export const predictiveSearchEngine = new PredictiveSearchEngine();

// Export convenience functions
export const generateSuggestions = (query: string, items: QRHistoryItem[], options?: SearchOptions) =>
  predictiveSearchEngine.generateSearchSuggestions(query, items, options);

export const performSemanticSearch = (query: string, items: QRHistoryItem[], options?: SearchOptions) =>
  predictiveSearchEngine.performSemanticSearch(query, items, options);

export const buildSearchIndex = (items: QRHistoryItem[]) =>
  predictiveSearchEngine.buildSearchIndex(items);
