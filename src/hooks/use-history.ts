
"use client";

import { useState, useEffect, useCallback } from 'react';

const HISTORY_STORAGE_KEY = 'voiceScribeFeatureHistory';

export interface HistoryItem {
  href: string;
  label: string;
  timestamp: number;
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const addHistoryItem = useCallback((newItem: HistoryItem) => {
    setHistory(prevHistory => {
      // Remove any previous entry with the same href
      const filteredHistory = prevHistory.filter(item => item.href !== newItem.href);
      // Add the new item to the beginning of the array
      const newHistory = [newItem, ...filteredHistory];
      
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
