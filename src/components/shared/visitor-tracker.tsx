"use client";

import { useEffect } from 'react';

const VISITOR_FLAG = 'hasVisitedVoiceScribe';

export function VisitorTracker() {
  useEffect(() => {
    // This code only runs on the client-side
    const hasVisited = localStorage.getItem(VISITOR_FLAG);

    if (!hasVisited) {
      // Mark as visited immediately to prevent duplicate calls
      localStorage.setItem(VISITOR_FLAG, 'true');

      // Send a request to the backend to log the new visit
      fetch('/api/visit', {
        method: 'POST',
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('Successfully tracked new visitor.');
        } else {
            // If tracking fails, remove the flag so we can try again on the next visit.
            localStorage.removeItem(VISITOR_FLAG);
        }
      })
      .catch(error => {
        console.error('Failed to track visitor:', error);
        // If there's a network error, remove the flag to retry on the next visit.
        localStorage.removeItem(VISITOR_FLAG);
      });
    }
  }, []);

  return null; // This component does not render anything
}
