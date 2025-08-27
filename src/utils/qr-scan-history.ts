'use client';

import { ParsedQRData, parseQRData } from './qr-data-parser';
import { errorHandler, StorageError, ValidationError, safeLocalStorage, validateInput, commonValidations, safeSync } from '@/lib/error-utils';

export interface QRHistoryItem {
  id: string;
  data: string;
  parsedData: ParsedQRData;
  timestamp: number;
  favorite: boolean;
  category?: string;
  tags?: string[];
  notes?: string;
  scanCount: number;
  lastScanned: number;
}

export interface QRHistoryStats {
  totalScans: number;
  uniqueScans: number;
  favoriteScans: number;
  typeStats: Record<string, number>;
  recentScans: QRHistoryItem[];
  topScans: QRHistoryItem[];
}

const STORAGE_KEY = 'qr-scan-history';
const MAX_HISTORY_ITEMS = 500; // Limit to prevent storage bloat

class QRScanHistoryManager {
  private history: QRHistoryItem[] = [];
  private initialized = false;

  constructor() {
    try {
      if (typeof window !== 'undefined') {
        this.loadHistory();
      } else {
        console.log('QR History: Running in server environment, history will be empty');
        this.initialized = true;
      }
    } catch (error) {
      errorHandler.handle(error, { method: 'constructor' });
      this.history = [];
      this.initialized = true;
    }
  }

  private loadHistory() {
    try {
      const safeStorage = safeLocalStorage();
      const stored = safeStorage.getItem(STORAGE_KEY);
      
      if (!stored) {
        console.log('QR History: No stored history found, starting fresh');
        this.initialized = true;
        return;
      }
      
      // Safely parse JSON
      const { data: parsed, error: parseError } = safeSync(
        () => JSON.parse(stored),
        null,
        { operation: 'parseHistory', dataLength: stored.length }
      );
      
      if (parseError || !Array.isArray(parsed)) {
        console.warn('QR History: Invalid history data format, resetting history');
        this.history = [];
        this.saveHistory(); // Clear corrupted data
        this.initialized = true;
        return;
      }
      
      // Validate and clean up data
      this.history = this.validateAndCleanHistoryItems(parsed);
      
      // Save cleaned data if any items were filtered out
      if (this.history.length !== parsed.length) {
        console.log(`QR History: Cleaned ${parsed.length - this.history.length} invalid items`);
        this.saveHistory();
      }
      
      this.initialized = true;
      console.log(`QR History: Loaded ${this.history.length} items`);
    } catch (error) {
      const storageError = new StorageError('Failed to load QR scan history', { 
        originalError: error instanceof Error ? error.message : 'Unknown error',
        storageKey: STORAGE_KEY
      });
      errorHandler.handle(storageError);
      
      this.history = [];
      this.initialized = true;
    }
  }

  private saveHistory() {
    if (!this.initialized) {
      console.warn('QR History: Attempted to save before initialization');
      return;
    }
    
    try {
      // Validate history before saving
      if (!Array.isArray(this.history)) {
        throw new ValidationError('History is not an array', { historyType: typeof this.history });
      }
      
      // Keep only the most recent items if we exceed the limit
      const historyToSave = this.history
        .filter(item => item && typeof item === 'object')
        .sort((a, b) => (b.lastScanned || 0) - (a.lastScanned || 0))
        .slice(0, MAX_HISTORY_ITEMS);
      
      const safeStorage = safeLocalStorage();
      const serializedData = JSON.stringify(historyToSave);
      
      // Check if data is too large
      if (serializedData.length > 5 * 1024 * 1024) { // 5MB limit
        console.warn('QR History: Data too large, trimming to fit storage limits');
        const trimmedHistory = historyToSave.slice(0, Math.floor(historyToSave.length * 0.8));
        const success = safeStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
        
        if (success) {
          this.history = trimmedHistory;
        } else {
          throw new StorageError('Failed to save trimmed history');
        }
      } else {
        const success = safeStorage.setItem(STORAGE_KEY, serializedData);
        
        if (success) {
          this.history = historyToSave;
        } else {
          throw new StorageError('Failed to save history to localStorage');
        }
      }
    } catch (error) {
      const storageError = new StorageError('Error saving QR scan history', {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        historyLength: this.history?.length || 0,
        storageKey: STORAGE_KEY
      });
      errorHandler.handle(storageError);
    }
  }

  addScan(data: string): QRHistoryItem {
    try {
      // Validate input
      validateInput(data, [
        commonValidations.required('Scan data is required'),
        commonValidations.string('Scan data must be a string'),
        commonValidations.maxLength(10000, 'Scan data is too long')
      ], { method: 'addScan' });
      
      if (!this.initialized) {
        console.warn('QR History: Adding scan before initialization, initializing now');
        this.history = [];
        this.initialized = true;
      }
      
      // Parse QR data safely
      const parsedData = parseQRData(data);
      const now = Date.now();
      
      // Validate timestamp
      if (!now || now <= 0) {
        throw new ValidationError('Invalid timestamp generated');
      }
      
      // Check if we've scanned this exact data before
      const existingIndex = this.history.findIndex(item => 
        item && item.data && item.data === data
      );
      
      if (existingIndex !== -1 && existingIndex < this.history.length) {
        // Update existing item
        const existing = this.history[existingIndex];
        
        if (!existing || typeof existing !== 'object') {
          console.warn('QR History: Found invalid existing item, removing it');
          this.history.splice(existingIndex, 1);
        } else {
          existing.scanCount = Math.max(1, (existing.scanCount || 0) + 1);
          existing.lastScanned = now;
          
          // Refresh parsed data in case parsing logic changed
          existing.parsedData = parsedData;
          
          // Move to front of array (most recent first)
          this.history.splice(existingIndex, 1);
          this.history.unshift(existing);
          
          this.saveHistory();
          return existing;
        }
      }
      
      // Create new item
      const newItem: QRHistoryItem = {
        id: this.generateId(),
        data,
        parsedData,
        timestamp: now,
        lastScanned: now,
        favorite: false,
        scanCount: 1,
        category: this.autoCategoize(parsedData),
        tags: this.autoTag(parsedData)
      };
      
      // Validate new item
      if (!this.validateHistoryItem(newItem)) {
        throw new ValidationError('Failed to create valid history item');
      }
      
      this.history.unshift(newItem);
      this.saveHistory();
      return newItem;
    } catch (error) {
      const historyError = error instanceof ValidationError ? error : 
        new StorageError('Failed to add scan to history', {
          originalError: error instanceof Error ? error.message : 'Unknown error',
          dataLength: data?.length || 0
        });
      errorHandler.handle(historyError);
      throw historyError;
    }
  }

  private generateId(): string {
    try {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      
      if (!timestamp || timestamp <= 0) {
        throw new Error('Invalid timestamp for ID generation');
      }
      
      if (!random || random.length < 5) {
        throw new Error('Invalid random component for ID generation');
      }
      
      return `${timestamp.toString(36)}_${random}`;
    } catch (error) {
      errorHandler.handle(error, { method: 'generateId' });
      // Fallback to basic timestamp-based ID
      return `fallback_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    }
  }

  private autoCategoize(parsedData: ParsedQRData): string {
    try {
      if (!parsedData || !parsedData.type) {
        console.warn('QR History: Invalid parsed data for categorization');
        return 'Other';
      }
      
      const categoryMap: Record<string, string> = {
        'url': 'Web',
        'email': 'Communication',
        'phone': 'Communication', 
        'sms': 'Communication',
        'wifi': 'Network',
        'contact': 'Contacts',
        'text': 'Documents',
        'geo': 'Location',
        'event': 'Calendar'
      };
      
      const type = parsedData.type.toLowerCase();
      return categoryMap[type] || 'Other';
    } catch (error) {
      errorHandler.handle(error, { method: 'autoCategoize', type: parsedData?.type });
      return 'Other';
    }
  }

  private autoTag(parsedData: ParsedQRData): string[] {
    try {
      if (!parsedData || !parsedData.type) {
        console.warn('QR History: Invalid parsed data for tagging');
        return ['unknown'];
      }
      
      const tags: string[] = [parsedData.type];
      
      const data = parsedData.data || '';
      
      if (parsedData.type === 'url') {
        if (data.includes('youtube.com')) {
          tags.push('video', 'entertainment');
        } else if (data.includes('github.com')) {
          tags.push('code', 'development');
        } else if (data.includes('linkedin.com')) {
          tags.push('professional', 'social');
        } else if (data.includes('twitter.com') || data.includes('x.com')) {
          tags.push('social', 'news');
        }
      } else if (parsedData.type === 'wifi') {
        tags.push('network', 'connection');
      } else if (parsedData.type === 'contact') {
        tags.push('business', 'networking');
      } else if (parsedData.type === 'geo') {
        tags.push('location', 'maps');
      } else if (parsedData.type === 'event') {
        tags.push('calendar', 'appointment');
      }
      
      // Remove duplicates and validate tags
      return [...new Set(tags.filter(tag => tag && typeof tag === 'string'))];
    } catch (error) {
      errorHandler.handle(error, { method: 'autoTag', type: parsedData?.type });
      return [parsedData?.type || 'unknown'];
    }
  }

  getHistory(): QRHistoryItem[] {
    try {
      if (!this.initialized) {
        console.warn('QR History: Getting history before initialization');
        return [];
      }
      
      if (!Array.isArray(this.history)) {
        console.warn('QR History: History is not an array, resetting');
        this.history = [];
        return [];
      }
      
      return [...this.history.filter(item => this.validateHistoryItem(item))];
    } catch (error) {
      errorHandler.handle(error, { method: 'getHistory' });
      return [];
    }
  }

  getHistoryByCategory(category: string): QRHistoryItem[] {
    try {
      if (!category || typeof category !== 'string' || category.trim() === '') {
        return this.getHistory();
      }
      
      if (!this.initialized || !Array.isArray(this.history)) {
        return [];
      }
      
      const normalizedCategory = category.toLowerCase().trim();
      return this.history.filter(item => {
        if (!this.validateHistoryItem(item) || !item.category) return false;
        return item.category.toLowerCase() === normalizedCategory;
      });
    } catch (error) {
      errorHandler.handle(error, { method: 'getHistoryByCategory', category });
      return [];
    }
  }

  getHistoryByType(type: string): QRHistoryItem[] {
    try {
      if (!type || typeof type !== 'string' || type.trim() === '') {
        return this.getHistory();
      }
      
      if (!this.initialized || !Array.isArray(this.history)) {
        return [];
      }
      
      const normalizedType = type.toLowerCase().trim();
      return this.history.filter(item => {
        if (!this.validateHistoryItem(item) || !item.parsedData || !item.parsedData.type) {
          return false;
        }
        return item.parsedData.type.toLowerCase() === normalizedType;
      });
    } catch (error) {
      errorHandler.handle(error, { method: 'getHistoryByType', type });
      return [];
    }
  }

  getFavorites(): QRHistoryItem[] {
    try {
      if (!this.initialized || !Array.isArray(this.history)) {
        return [];
      }
      
      return this.history.filter(item => 
        this.validateHistoryItem(item) && item.favorite === true
      );
    } catch (error) {
      errorHandler.handle(error, { method: 'getFavorites' });
      return [];
    }
  }

  searchHistory(query: string): QRHistoryItem[] {
    try {
      if (!query || typeof query !== 'string' || query.trim() === '') {
        return this.getHistory();
      }
      
      if (!this.initialized || !Array.isArray(this.history)) {
        return [];
      }
      
      // Limit query length to prevent performance issues
      const trimmedQuery = query.trim().slice(0, 500);
      const lowerQuery = trimmedQuery.toLowerCase();
      
      return this.history.filter(item => {
        if (!this.validateHistoryItem(item)) return false;
        
        try {
          // Search in QR data
          if (item.data && item.data.toLowerCase().includes(lowerQuery)) return true;
          
          // Search in parsed data label
          if (item.parsedData?.label && item.parsedData.label.toLowerCase().includes(lowerQuery)) return true;
          
          // Search in category (case-insensitive)
          if (item.category && item.category.toLowerCase().includes(lowerQuery)) return true;
          
          // Search in tags (case-insensitive)
          if (Array.isArray(item.tags) && item.tags.some(tag => 
            tag && typeof tag === 'string' && tag.toLowerCase().includes(lowerQuery)
          )) return true;
          
          // Search in notes (case-insensitive)
          if (item.notes && typeof item.notes === 'string' && item.notes.toLowerCase().includes(lowerQuery)) return true;
          
          // Search in parsed data type
          if (item.parsedData?.type && item.parsedData.type.toLowerCase().includes(lowerQuery)) return true;
          
          return false;
        } catch (searchError) {
          console.warn('Error searching item:', searchError);
          return false;
        }
      });
    } catch (error) {
      errorHandler.handle(error, { method: 'searchHistory', queryLength: query?.length || 0 });
      return [];
    }
  }

  toggleFavorite(id: string): boolean {
    const item = this.history.find(h => h.id === id);
    if (item) {
      item.favorite = !item.favorite;
      this.saveHistory();
      return item.favorite;
    }
    return false;
  }

  updateNotes(id: string, notes: string): boolean {
    const item = this.history.find(h => h.id === id);
    if (item) {
      item.notes = notes;
      this.saveHistory();
      return true;
    }
    return false;
  }

  updateTags(id: string, tags: string[]): boolean {
    const item = this.history.find(h => h.id === id);
    if (item) {
      item.tags = tags;
      this.saveHistory();
      return true;
    }
    return false;
  }

  deleteItem(id: string): boolean {
    const index = this.history.findIndex(h => h.id === id);
    if (index !== -1) {
      this.history.splice(index, 1);
      this.saveHistory();
      return true;
    }
    return false;
  }

  clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  clearOldItems(daysOld: number = 30): number {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const initialLength = this.history.length;
    
    this.history = this.history.filter(item => 
      item.favorite || item.lastScanned > cutoffTime
    );
    
    const removedCount = initialLength - this.history.length;
    if (removedCount > 0) {
      this.saveHistory();
    }
    
    return removedCount;
  }

  getStats(): QRHistoryStats {
    const totalScans = this.history.reduce((sum, item) => sum + item.scanCount, 0);
    const uniqueScans = this.history.length;
    const favoriteScans = this.history.filter(item => item.favorite).length;
    
    const typeStats: Record<string, number> = {};
    this.history.forEach(item => {
      const type = item.parsedData.type;
      typeStats[type] = (typeStats[type] || 0) + item.scanCount;
    });
    
    const recentScans = this.history
      .sort((a, b) => b.lastScanned - a.lastScanned)
      .slice(0, 10);
    
    const topScans = this.history
      .sort((a, b) => b.scanCount - a.scanCount)
      .slice(0, 10);
    
    return {
      totalScans,
      uniqueScans,
      favoriteScans,
      typeStats,
      recentScans,
      topScans
    };
  }

  exportHistory(): string {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      history: this.history
    };
    return JSON.stringify(exportData, null, 2);
  }

  importHistory(jsonData: string): { success: boolean; imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;
    
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.history || !Array.isArray(data.history)) {
        throw new Error('Invalid export format');
      }
      
      data.history.forEach((item: any, index: number) => {
        try {
          if (item.data && item.timestamp) {
            // Re-parse the QR data to ensure consistency
            const parsedData = parseQRData(item.data);
            const historyItem: QRHistoryItem = {
              id: item.id || this.generateId(),
              data: item.data,
              parsedData,
              timestamp: item.timestamp,
              lastScanned: item.lastScanned || item.timestamp,
              favorite: Boolean(item.favorite),
              category: item.category || this.autoCategoize(parsedData),
              tags: Array.isArray(item.tags) ? item.tags : this.autoTag(parsedData),
              notes: item.notes || '',
              scanCount: Math.max(1, item.scanCount || 1)
            };
            
            // Check if item already exists
            if (!this.history.some(h => h.data === historyItem.data)) {
              this.history.push(historyItem);
              imported++;
            }
          }
        } catch (itemError) {
          errors.push(`Item ${index + 1}: ${itemError}`);
        }
      });
      
      if (imported > 0) {
        // Sort by last scanned and save
        this.history.sort((a, b) => b.lastScanned - a.lastScanned);
        this.saveHistory();
      }
      
      return { success: true, imported, errors };
    } catch (error) {
      return { 
        success: false, 
        imported: 0, 
        errors: [`Failed to parse import data: ${error}`] 
      };
    }
  }

  // Get all unique categories
  getCategories(): string[] {
    const categories = new Set(
      this.history
        .map(item => item.category)
        .filter((category): category is string => Boolean(category && category.trim()))
        .map(category => category.trim())
    );
    return Array.from(categories).sort();
  }

  // Get all unique tags
  getAllTags(): string[] {
    const allTags = new Set<string>();
    this.history.forEach(item => {
      item.tags?.forEach(tag => {
        if (tag && tag.trim()) {
          allTags.add(tag.trim().toLowerCase());
        }
      });
    });
    return Array.from(allTags).sort();
  }

  // Validation methods
  private validateHistoryItem(item: any): item is QRHistoryItem {
    try {
      return (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        item.id.length > 0 &&
        typeof item.data === 'string' &&
        item.data.length > 0 &&
        item.parsedData &&
        typeof item.parsedData === 'object' &&
        typeof item.parsedData.type === 'string' &&
        typeof item.timestamp === 'number' &&
        item.timestamp > 0 &&
        typeof item.lastScanned === 'number' &&
        item.lastScanned > 0 &&
        typeof item.scanCount === 'number' &&
        item.scanCount > 0 &&
        typeof item.favorite === 'boolean'
      );
    } catch (error) {
      return false;
    }
  }

  private validateAndCleanHistoryItems(items: any[]): QRHistoryItem[] {
    try {
      if (!Array.isArray(items)) {
        return [];
      }

      return items.filter(item => {
        if (!this.validateHistoryItem(item)) {
          console.warn('QR History: Removing invalid item:', item?.id || 'unknown');
          return false;
        }
        return true;
      });
    } catch (error) {
      errorHandler.handle(error, { method: 'validateAndCleanHistoryItems' });
      return [];
    }
  }
}

// Export singleton instance
export const qrScanHistory = new QRScanHistoryManager();

// Export utility functions
export const addQRScan = (data: string) => qrScanHistory.addScan(data);
export const getQRHistory = () => qrScanHistory.getHistory();
export const searchQRHistory = (query: string) => qrScanHistory.searchHistory(query);
export const getQRStats = () => qrScanHistory.getStats();
export const getQRHistoryByCategory = (category: string) => qrScanHistory.getHistoryByCategory(category);
export const getQRHistoryByType = (type: string) => qrScanHistory.getHistoryByType(type);
export const getQRCategories = () => qrScanHistory.getCategories();
export const getAllQRTags = () => qrScanHistory.getAllTags();
export const getFavoriteQRScans = () => qrScanHistory.getFavorites();
