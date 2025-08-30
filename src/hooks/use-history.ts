
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const HISTORY_STORAGE_KEY = 'voiceScribeFeatureHistory';
const MAX_HISTORY_ITEMS = 100; // Limit to prevent storage bloat

export interface HistoryItem {
  id: string;
  href: string;
  label: string;
  timestamp: number;
  count: number;
  lastVisited: number;
  favorite?: boolean;
  category?: string;
  notes?: string;
}

export interface HistoryStats {
  totalVisits: number;
  uniquePages: number;
  favoritePages: number;
  mostVisited: HistoryItem[];
  recentVisits: HistoryItem[];
  categories: Record<string, number>;
}

export interface HistoryActions {
  addHistoryItem: (newItem: Omit<HistoryItem, 'id' | 'count' | 'lastVisited'>) => void;
  deleteHistoryItem: (id: string) => boolean;
  updateHistoryItem: (id: string, updates: Partial<HistoryItem>) => boolean;
  clearHistory: () => void;
  toggleFavorite: (id: string) => boolean;
  searchHistory: (query: string) => HistoryItem[];
  getHistoryStats: () => HistoryStats;
  getHistoryByCategory: (category: string) => HistoryItem[];
  exportHistory: () => string;
  importHistory: (jsonData: string) => { success: boolean; imported: number; errors: string[] };
}

export function useHistory(): {
  history: HistoryItem[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
} & HistoryActions {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for performance
  const historyCache = useRef<HistoryItem[]>([]);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Utility function to validate history item
  const validateHistoryItem = useCallback((item: any): item is HistoryItem => {
    return (
      item &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      item.id.length > 0 &&
      typeof item.href === 'string' &&
      item.href.length > 0 &&
      typeof item.label === 'string' &&
      item.label.length > 0 &&
      typeof item.timestamp === 'number' &&
      item.timestamp > 0 &&
      typeof item.count === 'number' &&
      item.count > 0 &&
      typeof item.lastVisited === 'number' &&
      item.lastVisited > 0
    );
  }, []);

  // Generate unique ID
  const generateId = useCallback((): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `hist_${timestamp}_${random}`;
  }, []);

  // Debounced save function
  const debouncedSave = useCallback((historyToSave: HistoryItem[]) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    
    saveTimeout.current = setTimeout(() => {
      try {
        // Validate and clean history before saving
        const validHistory = historyToSave
          .filter(validateHistoryItem)
          .slice(0, MAX_HISTORY_ITEMS)
          .sort((a, b) => b.lastVisited - a.lastVisited);
        
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(validHistory));
        historyCache.current = validHistory;
        setError(null);
      } catch (error) {
        console.error("Failed to save history to localStorage", error);
        setError("Failed to save history");
      }
    }, 300); // 300ms debounce
  }, [validateHistoryItem]);

  // Load history with proper error handling
  const loadHistory = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoaded(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      
      if (!storedHistory) {
        setHistory([]);
        historyCache.current = [];
        return;
      }

      const parsedHistory = JSON.parse(storedHistory);
      
      if (!Array.isArray(parsedHistory)) {
        throw new Error('Invalid history format: not an array');
      }

      // Migrate and validate history items
      const migratedHistory = parsedHistory
        .map((item: any) => {
          try {
            // Handle legacy format
            const migrated: HistoryItem = {
              id: item.id || generateId(),
              href: item.href || '',
              label: item.label || 'Unknown',
              timestamp: item.timestamp || Date.now(),
              count: Math.max(1, item.count || 1),
              lastVisited: item.lastVisited || item.timestamp || Date.now(),
              favorite: Boolean(item.favorite),
              category: item.category || 'General',
              notes: item.notes || ''
            };
            
            return validateHistoryItem(migrated) ? migrated : null;
          } catch (itemError) {
            console.warn('Invalid history item:', itemError);
            return null;
          }
        })
        .filter((item: HistoryItem | null): item is HistoryItem => item !== null)
        .sort((a, b) => b.lastVisited - a.lastVisited);

      setHistory(migratedHistory);
      historyCache.current = migratedHistory;
      
      // Save cleaned data if any items were filtered out
      if (migratedHistory.length !== parsedHistory.length) {
        debouncedSave(migratedHistory);
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
      setError("Failed to load history");
      setHistory([]);
      historyCache.current = [];
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [validateHistoryItem, generateId, debouncedSave]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

  // Add history item with improved logic
  const addHistoryItem = useCallback((newItem: Omit<HistoryItem, 'id' | 'count' | 'lastVisited'>) => {
    try {
      // Validate input
      if (!newItem.href || !newItem.label || !newItem.timestamp) {
        throw new Error('Invalid history item: missing required fields');
      }
      
      setHistory(prevHistory => {
        const now = Date.now();
        const existingIndex = prevHistory.findIndex(item => item.href === newItem.href);
        let newHistory: HistoryItem[];

        if (existingIndex !== -1) {
          // Update existing item
          newHistory = prevHistory.map((item, index) =>
            index === existingIndex
              ? { 
                  ...item, 
                  label: newItem.label, // Update label in case it changed
                  timestamp: newItem.timestamp,
                  lastVisited: now,
                  count: item.count + 1 
                }
              : item
          );
          
          // Move updated item to the front
          const updatedItem = newHistory[existingIndex];
          newHistory.splice(existingIndex, 1);
          newHistory.unshift(updatedItem);
        } else {
          // Add new item
          const historyItem: HistoryItem = {
            id: generateId(),
            href: newItem.href,
            label: newItem.label,
            timestamp: newItem.timestamp,
            lastVisited: now,
            count: 1,
            favorite: false,
            category: newItem.category || 'General',
            notes: newItem.notes || ''
          };
          
          newHistory = [historyItem, ...prevHistory];
        }
        
        // Trim to max items
        if (newHistory.length > MAX_HISTORY_ITEMS) {
          newHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);
        }
        
        debouncedSave(newHistory);
        return newHistory;
      });
      
      setError(null);
    } catch (error) {
      console.error('Failed to add history item:', error);
      setError('Failed to add history item');
    }
  }, [generateId, debouncedSave]);

  // Delete history item
  const deleteHistoryItem = useCallback((id: string): boolean => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid item ID');
      }
      
      let deleted = false;
      
      setHistory(prevHistory => {
        const newHistory = prevHistory.filter(item => {
          if (item.id === id) {
            deleted = true;
            return false;
          }
          return true;
        });
        
        if (deleted) {
          debouncedSave(newHistory);
        }
        
        return newHistory;
      });
      
      if (deleted) {
        setError(null);
      }
      
      return deleted;
    } catch (error) {
      console.error('Failed to delete history item:', error);
      setError('Failed to delete history item');
      return false;
    }
  }, [debouncedSave]);

  // Update history item
  const updateHistoryItem = useCallback((id: string, updates: Partial<HistoryItem>): boolean => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid item ID');
      }
      
      let updated = false;
      
      setHistory(prevHistory => {
        const newHistory = prevHistory.map(item => {
          if (item.id === id) {
            updated = true;
            return { ...item, ...updates, id: item.id }; // Preserve original ID
          }
          return item;
        });
        
        if (updated) {
          debouncedSave(newHistory);
        }
        
        return newHistory;
      });
      
      if (updated) {
        setError(null);
      }
      
      return updated;
    } catch (error) {
      console.error('Failed to update history item:', error);
      setError('Failed to update history item');
      return false;
    }
  }, [debouncedSave]);

  // Clear all history
  const clearHistory = useCallback(() => {
    try {
      setHistory([]);
      historyCache.current = [];
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      setError(null);
    } catch (error) {
      console.error('Failed to clear history:', error);
      setError('Failed to clear history');
    }
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback((id: string): boolean => {
    try {
      const item = history.find(h => h.id === id);
      if (!item) {
        throw new Error('History item not found');
      }
      
      const newFavoriteState = !item.favorite;
      const success = updateHistoryItem(id, { favorite: newFavoriteState });
      
      return success ? newFavoriteState : false;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      setError('Failed to toggle favorite');
      return false;
    }
  }, [history, updateHistoryItem]);

  // Search history
  const searchHistory = useCallback((query: string): HistoryItem[] => {
    try {
      if (!query || typeof query !== 'string' || query.trim() === '') {
        return history;
      }
      
      const lowerQuery = query.toLowerCase().trim();
      
      return history.filter(item => {
        return (
          item.label.toLowerCase().includes(lowerQuery) ||
          item.href.toLowerCase().includes(lowerQuery) ||
          item.category?.toLowerCase().includes(lowerQuery) ||
          item.notes?.toLowerCase().includes(lowerQuery)
        );
      });
    } catch (error) {
      console.error('Failed to search history:', error);
      setError('Failed to search history');
      return [];
    }
  }, [history]);

  // Get history statistics
  const getHistoryStats = useCallback((): HistoryStats => {
    try {
      const totalVisits = history.reduce((sum, item) => sum + item.count, 0);
      const uniquePages = history.length;
      const favoritePages = history.filter(item => item.favorite).length;
      
      const mostVisited = [...history]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      const recentVisits = [...history]
        .sort((a, b) => b.lastVisited - a.lastVisited)
        .slice(0, 10);
      
      const categories: Record<string, number> = {};
      history.forEach(item => {
        const category = item.category || 'General';
        categories[category] = (categories[category] || 0) + item.count;
      });
      
      return {
        totalVisits,
        uniquePages,
        favoritePages,
        mostVisited,
        recentVisits,
        categories
      };
    } catch (error) {
      console.error('Failed to get history stats:', error);
      return {
        totalVisits: 0,
        uniquePages: 0,
        favoritePages: 0,
        mostVisited: [],
        recentVisits: [],
        categories: {}
      };
    }
  }, [history]);

  // Get history by category
  const getHistoryByCategory = useCallback((category: string): HistoryItem[] => {
    try {
      if (!category || typeof category !== 'string') {
        return history;
      }
      
      const normalizedCategory = category.toLowerCase().trim();
      return history.filter(item => 
        item.category?.toLowerCase() === normalizedCategory
      );
    } catch (error) {
      console.error('Failed to get history by category:', error);
      return [];
    }
  }, [history]);

  // Export history
  const exportHistory = useCallback((): string => {
    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appName: 'SomlengP Voice Features',
        history: history
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export history:', error);
      throw new Error('Failed to export history');
    }
  }, [history]);

  // Import history
  const importHistory = useCallback((jsonData: string): { success: boolean; imported: number; errors: string[] } => {
    const errors: string[] = [];
    let imported = 0;
    
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.history || !Array.isArray(data.history)) {
        throw new Error('Invalid export format: missing history array');
      }
      
      const importedItems: HistoryItem[] = [];
      
      data.history.forEach((item: any, index: number) => {
        try {
          const historyItem: HistoryItem = {
            id: item.id || generateId(),
            href: item.href || '',
            label: item.label || 'Imported Item',
            timestamp: item.timestamp || Date.now(),
            lastVisited: item.lastVisited || item.timestamp || Date.now(),
            count: Math.max(1, item.count || 1),
            favorite: Boolean(item.favorite),
            category: item.category || 'General',
            notes: item.notes || ''
          };
          
          if (validateHistoryItem(historyItem)) {
            // Check if item already exists
            const exists = history.some(h => h.href === historyItem.href);
            if (!exists) {
              importedItems.push(historyItem);
              imported++;
            }
          } else {
            errors.push(`Item ${index + 1}: Invalid item format`);
          }
        } catch (itemError) {
          errors.push(`Item ${index + 1}: ${itemError}`);
        }
      });
      
      if (importedItems.length > 0) {
        setHistory(prevHistory => {
          const newHistory = [...importedItems, ...prevHistory]
            .sort((a, b) => b.lastVisited - a.lastVisited)
            .slice(0, MAX_HISTORY_ITEMS);
          
          debouncedSave(newHistory);
          return newHistory;
        });
      }
      
      return { success: true, imported, errors };
    } catch (error) {
      return { 
        success: false, 
        imported: 0, 
        errors: [`Failed to parse import data: ${error}`] 
      };
    }
  }, [history, validateHistoryItem, generateId, debouncedSave]);

  // Memoized values for performance
  const memoizedHistory = useMemo(() => history, [history]);
  
  return {
    history: memoizedHistory,
    isLoaded,
    isLoading,
    error,
    addHistoryItem,
    deleteHistoryItem,
    updateHistoryItem,
    clearHistory,
    toggleFavorite,
    searchHistory,
    getHistoryStats,
    getHistoryByCategory,
    exportHistory,
    importHistory
  };
}
