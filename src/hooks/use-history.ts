
"use client";

import { useState, useEffect, useCallback } from 'react';

const HISTORY_STORAGE_KEY = 'voiceScribeFeatureHistory';

export interface HistoryItem {
  href: string;
  label: string;
  timestamp: number;
  count: number;
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        // Basic migration for old history format
        const parsedHistory = JSON.parse(storedHistory);
        const migratedHistory = parsedHistory.map((item: HistoryItem & { count?: number }) => ({
            ...item,
            count: item.count || 1
        }));
        setHistory(migratedHistory);
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const addHistoryItem = useCallback((newItem: Omit<HistoryItem, 'count' | 'timestamp'> & { timestamp: number }) => {
    setHistory(prevHistory => {
        const existingItem = prevHistory.find(item => item.href === newItem.href);
        let newHistory: HistoryItem[];

        if (existingItem) {
            // Update existing item's timestamp and count
            newHistory = prevHistory.map(item =>
                item.href === newItem.href
                    ? { ...item, timestamp: newItem.timestamp, count: item.count + 1 }
                    : item
            );
        } else {
            // Add new item
            newHistory = [{ ...newItem, count: 1 }, ...prevHistory];
        }
      
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error("Failed to save history to localStorage", error);
      }
      
      return newHistory;
    });
  }, []);

  return { history, addHistoryItem, isLoaded };
}
