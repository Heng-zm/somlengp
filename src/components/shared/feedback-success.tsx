"use client";

import { CheckCircle, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { Button } from '@/components/ui/button';
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function


interface FeedbackSuccessProps {
  message: string;
  onAnimationEnd: () => void;
  onClose?: () => void;
}

const FeedbackSuccess = memo(function FeedbackSuccess({ message, onAnimationEnd, onClose }: FeedbackSuccessProps) {
  const [visible, setVisible] = useState(false);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      onAnimationEnd();
    }
  }, [onClose, onAnimationEnd]);

  useEffect(() => {
    // Animate in immediately
    const animateIn = () => setVisible(true);
    const timeoutId = setTimeout(animateIn, 50);

    // Trigger close after animation + delay
    const closeTimer = setTimeout(() => {
      onAnimationEnd();
    }, 3000); // 500ms animation + 2500ms wait (longer for user to read)

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(closeTimer);
    };
  }, [onAnimationEnd]);

  const containerStyle = useMemo(() => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1)' : 'scale(0.95)'
  }), [visible]);

  const iconStyle = useMemo(() => ({
    transform: visible ? 'scale(1)' : 'scale(0.5)'
  }), [visible]);

  return (
    <div className="relative flex flex-col items-center justify-center gap-4 text-center transition-opacity duration-500 ease-in-out" style={containerStyle}>
      {/* Manual close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -top-2 -right-2 h-8 w-8 rounded-full opacity-70 hover:opacity-100"
        onClick={handleClose}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>
      
      <CheckCircle 
        className="h-20 w-20 text-green-500 transition-transform duration-500 ease-out" 
        style={iconStyle} 
      />
      <h2 className="text-2xl font-bold">{message}</h2>
      <p className="text-sm text-muted-foreground mt-2">
        This dialog will close automatically in a few seconds
      </p>
    </div>
  );
});

export { FeedbackSuccess };
