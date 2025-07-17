"use client";

import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FeedbackSuccessProps {
  message: string;
  onAnimationEnd: () => void;
}

export function FeedbackSuccess({ message, onAnimationEnd }: FeedbackSuccessProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setVisible(true);

    // Trigger close after animation + delay
    const timer = setTimeout(() => {
      onAnimationEnd();
    }, 2000); // 500ms animation + 1500ms wait

    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center transition-opacity duration-500 ease-in-out" style={{ opacity: visible ? 1 : 0 }}>
      <CheckCircle 
        className="h-20 w-20 text-green-500 transition-transform duration-500 ease-out" 
        style={{ transform: visible ? 'scale(1)' : 'scale(0.5)' }} 
      />
      <h2 className="text-2xl font-bold">{message}</h2>
    </div>
  );
}
