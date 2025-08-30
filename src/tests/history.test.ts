/**
 * Tests for History functionality
 * 
 * This test file verifies the functionality of the useHistory hook
 * and ensures all actions work correctly with proper state management.
 */

import { renderHook, act } from '@testing-library/react';
import { useHistory, HistoryItem } from '@/hooks/use-history';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock Date.now for consistent testing
const mockTimestamp = 1640995200000; // 2022-01-01T00:00:00.000Z
const originalDateNow = Date.now;

beforeEach(() => {
  localStorageMock.clear();
  Date.now = jest.fn(() => mockTimestamp);
});

afterEach(() => {
  Date.now = originalDateNow;
});

describe('useHistory Hook', () => {
  describe('Basic functionality', () => {
    test('should initialize with empty history', () => {
      const { result } = renderHook(() => useHistory());
      
      expect(result.current.history).toEqual([]);
      expect(result.current.isLoaded).toBe(true);
      expect(result.current.error).toBe(null);
    });

    test('should add new history item', () => {
      const { result } = renderHook(() => useHistory());
      
      const newItem = {
        href: '/voice-transcript',
        label: 'Voice Transcript',
        timestamp: mockTimestamp,
        category: 'Audio'
      };

      act(() => {
        result.current.addHistoryItem(newItem);
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0]).toMatchObject({
        href: '/voice-transcript',
        label: 'Voice Transcript',
        count: 1,
        favorite: false,
        category: 'Audio'
      });
      expect(result.current.history[0].id).toBeDefined();
    });

    test('should update existing item count and move to front', () => {
      const { result } = renderHook(() => useHistory());
      
      const item1 = {
        href: '/voice-transcript',
        label: 'Voice Transcript',
        timestamp: mockTimestamp,
      };
      
      const item2 = {
        href: '/pdf-transcript',
        label: 'PDF Transcript',
        timestamp: mockTimestamp + 1000,
      };

      // Add first item
      act(() => {
        result.current.addHistoryItem(item1);
      });

      // Add second item
      act(() => {
        result.current.addHistoryItem(item2);
      });

      expect(result.current.history).toHaveLength(2);
      expect(result.current.history[0].href).toBe('/pdf-transcript');

      // Add first item again
      act(() => {
        result.current.addHistoryItem({
          ...item1,
          timestamp: mockTimestamp + 2000
        });
      });

      expect(result.current.history).toHaveLength(2);
      expect(result.current.history[0].href).toBe('/voice-transcript');
      expect(result.current.history[0].count).toBe(2);
    });
  });

  describe('History actions', () => {
    test('should delete history item', () => {
      const { result } = renderHook(() => useHistory());
      
      const newItem = {
        href: '/voice-transcript',
        label: 'Voice Transcript',
        timestamp: mockTimestamp,
      };

      act(() => {
        result.current.addHistoryItem(newItem);
      });

      const itemId = result.current.history[0].id;

      act(() => {
        const deleted = result.current.deleteHistoryItem(itemId);
        expect(deleted).toBe(true);
      });

      expect(result.current.history).toHaveLength(0);
    });

    test('should toggle favorite status', () => {
      const { result } = renderHook(() => useHistory());
      
      const newItem = {
        href: '/voice-transcript',
        label: 'Voice Transcript',
        timestamp: mockTimestamp,
      };

      act(() => {
        result.current.addHistoryItem(newItem);
      });

      const itemId = result.current.history[0].id;
      expect(result.current.history[0].favorite).toBe(false);

      act(() => {
        const newState = result.current.toggleFavorite(itemId);
        expect(newState).toBe(true);
      });

      expect(result.current.history[0].favorite).toBe(true);

      act(() => {
        const newState = result.current.toggleFavorite(itemId);
        expect(newState).toBe(false);
      });

      expect(result.current.history[0].favorite).toBe(false);
    });

    test('should update history item', () => {
      const { result } = renderHook(() => useHistory());
      
      const newItem = {
        href: '/voice-transcript',
        label: 'Voice Transcript',
        timestamp: mockTimestamp,
      };

      act(() => {
        result.current.addHistoryItem(newItem);
      });

      const itemId = result.current.history[0].id;

      act(() => {
        const updated = result.current.updateHistoryItem(itemId, {
          label: 'Updated Voice Transcript',
          notes: 'Test notes'
        });
        expect(updated).toBe(true);
      });

      expect(result.current.history[0].label).toBe('Updated Voice Transcript');
      expect(result.current.history[0].notes).toBe('Test notes');
    });

    test('should clear all history', () => {
      const { result } = renderHook(() => useHistory());
      
      const items = [
        { href: '/voice-transcript', label: 'Voice Transcript', timestamp: mockTimestamp },
        { href: '/pdf-transcript', label: 'PDF Transcript', timestamp: mockTimestamp + 1000 }
      ];

      act(() => {
        items.forEach(item => result.current.addHistoryItem(item));
      });

      expect(result.current.history).toHaveLength(2);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.history).toHaveLength(0);
    });
  });

  describe('Search and filtering', () => {
    test('should search history items', () => {
      const { result } = renderHook(() => useHistory());
      
      const items = [
        { href: '/voice-transcript', label: 'Voice Transcript', timestamp: mockTimestamp },
        { href: '/pdf-transcript', label: 'PDF Transcript', timestamp: mockTimestamp + 1000 },
        { href: '/text-to-speech', label: 'Text to Speech', timestamp: mockTimestamp + 2000 }
      ];

      act(() => {
        items.forEach(item => result.current.addHistoryItem(item));
      });

      let searchResults: HistoryItem[] = [];
      
      act(() => {
        searchResults = result.current.searchHistory('transcript');
      });

      expect(searchResults).toHaveLength(2);
      expect(searchResults.map(item => item.href)).toEqual(
        expect.arrayContaining(['/voice-transcript', '/pdf-transcript'])
      );

      act(() => {
        searchResults = result.current.searchHistory('speech');
      });

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].href).toBe('/text-to-speech');
    });

    test('should filter history by category', () => {
      const { result } = renderHook(() => useHistory());
      
      const items = [
        { href: '/voice-transcript', label: 'Voice Transcript', timestamp: mockTimestamp, category: 'Audio' },
        { href: '/pdf-transcript', label: 'PDF Transcript', timestamp: mockTimestamp + 1000, category: 'Document' },
        { href: '/text-to-speech', label: 'Text to Speech', timestamp: mockTimestamp + 2000, category: 'Audio' }
      ];

      act(() => {
        items.forEach(item => result.current.addHistoryItem(item));
      });

      let audioItems: HistoryItem[] = [];
      
      act(() => {
        audioItems = result.current.getHistoryByCategory('Audio');
      });

      expect(audioItems).toHaveLength(2);
      expect(audioItems.map(item => item.href)).toEqual(
        expect.arrayContaining(['/voice-transcript', '/text-to-speech'])
      );
    });
  });

  describe('Statistics', () => {
    test('should calculate correct statistics', () => {
      const { result } = renderHook(() => useHistory());
      
      const items = [
        { href: '/voice-transcript', label: 'Voice Transcript', timestamp: mockTimestamp, category: 'Audio' },
        { href: '/pdf-transcript', label: 'PDF Transcript', timestamp: mockTimestamp + 1000, category: 'Document' }
      ];

      act(() => {
        items.forEach(item => result.current.addHistoryItem(item));
      });

      // Add first item again to increase count
      act(() => {
        result.current.addHistoryItem(items[0]);
      });

      // Mark one as favorite
      const firstItemId = result.current.history.find(item => item.href === '/voice-transcript')?.id;
      if (firstItemId) {
        act(() => {
          result.current.toggleFavorite(firstItemId);
        });
      }

      const stats = result.current.getHistoryStats();

      expect(stats.totalVisits).toBe(3); // 2 + 1 for repeated item
      expect(stats.uniquePages).toBe(2);
      expect(stats.favoritePages).toBe(1);
      expect(stats.categories).toEqual({
        'Audio': 2,
        'Document': 1
      });
    });
  });

  describe('Import/Export', () => {
    test('should export history correctly', () => {
      const { result } = renderHook(() => useHistory());
      
      const newItem = {
        href: '/voice-transcript',
        label: 'Voice Transcript',
        timestamp: mockTimestamp,
        category: 'Audio'
      };

      act(() => {
        result.current.addHistoryItem(newItem);
      });

      const exportData = result.current.exportHistory();
      const parsed = JSON.parse(exportData);

      expect(parsed.version).toBe('1.0');
      expect(parsed.appName).toBe('SomlengP Voice Features');
      expect(parsed.history).toHaveLength(1);
      expect(parsed.history[0]).toMatchObject({
        href: '/voice-transcript',
        label: 'Voice Transcript',
        category: 'Audio'
      });
    });

    test('should import history correctly', () => {
      const { result } = renderHook(() => useHistory());
      
      const importData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appName: 'SomlengP Voice Features',
        history: [
          {
            id: 'test-id-1',
            href: '/voice-transcript',
            label: 'Voice Transcript',
            timestamp: mockTimestamp,
            count: 1,
            lastVisited: mockTimestamp,
            favorite: false,
            category: 'Audio',
            notes: ''
          }
        ]
      };

      act(() => {
        const result_import = result.current.importHistory(JSON.stringify(importData));
        expect(result_import.success).toBe(true);
        expect(result_import.imported).toBe(1);
        expect(result_import.errors).toHaveLength(0);
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].href).toBe('/voice-transcript');
    });
  });

  describe('Error handling', () => {
    test('should handle invalid item deletion gracefully', () => {
      const { result } = renderHook(() => useHistory());
      
      act(() => {
        const deleted = result.current.deleteHistoryItem('invalid-id');
        expect(deleted).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    test('should handle invalid favorite toggle gracefully', () => {
      const { result } = renderHook(() => useHistory());
      
      act(() => {
        const toggled = result.current.toggleFavorite('invalid-id');
        expect(toggled).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    test('should handle corrupted localStorage data', () => {
      // Pre-populate with invalid data
      localStorageMock.setItem('voiceScribeFeatureHistory', 'invalid-json');
      
      const { result } = renderHook(() => useHistory());
      
      expect(result.current.history).toEqual([]);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Performance and validation', () => {
    test('should limit history to max items', () => {
      const { result } = renderHook(() => useHistory());
      
      // Add more than max items
      act(() => {
        for (let i = 0; i < 150; i++) {
          result.current.addHistoryItem({
            href: `/page-${i}`,
            label: `Page ${i}`,
            timestamp: mockTimestamp + i,
          });
        }
      });

      expect(result.current.history.length).toBeLessThanOrEqual(100);
    });

    test('should validate history items properly', () => {
      const { result } = renderHook(() => useHistory());
      
      // Try to add invalid item
      act(() => {
        try {
          result.current.addHistoryItem({
            href: '',
            label: '',
            timestamp: 0,
          } as any);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.history).toHaveLength(0);
      expect(result.current.error).toBeTruthy();
    });
  });
});
