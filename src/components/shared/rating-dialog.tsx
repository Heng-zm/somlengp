
"use client";

import { useState, memo, useCallback } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';
import { FeedbackSuccess } from './feedback-success';
import { ThreeDotsLoader } from './three-dots-loader';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number, feedback: string) => Promise<boolean>;
  translations: {
    title: string;
    description:string;
    feedbackPlaceholder: string;
    submit: string;
    rateLater: string;
    thankYou: string;
  };
}

export const RatingDialog = memo(function RatingDialog({ open, onOpenChange, onSubmit, translations }: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const cleanUp = useCallback(() => {
    setRating(0);
    setFeedback('');
    setIsSubmitting(false);
    setIsSubmitted(false);
    setHoverRating(0);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (rating === 0 || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const success = await onSubmit(rating, feedback);
      if (success) {
        setIsSubmitted(true);
      } else {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Rating submission failed:', error);
      setIsSubmitting(false);
    }
  }, [rating, feedback, isSubmitting, onSubmit]);

  const handleClose = useCallback((newOpenState: boolean) => {
    if (isSubmitting) return;

    onOpenChange(newOpenState);
    if (!newOpenState) {
      // Cleanup after dialog closes to prevent state issues
      setTimeout(cleanUp, 300);
    }
  }, [isSubmitting, onOpenChange, cleanUp]);

  const handleAnimationEnd = useCallback(() => {
    handleClose(false);
  }, [handleClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] flex items-center justify-center min-h-[350px]">
        {isSubmitted ? (
            <FeedbackSuccess 
              key="feedback-success"
              message={translations.thankYou} 
              onAnimationEnd={handleAnimationEnd} 
            />
        ) : (
          <div key="feedback-form" className="w-full">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="text-primary" />
                {translations.title}
              </DialogTitle>
              <DialogDescription>
                {translations.description}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-10 w-10 cursor-pointer transition-colors',
                      (hoverRating || rating) >= star
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-muted-foreground/30'
                    )}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                ))}
              </div>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={translations.feedbackPlaceholder}
                rows={4}
                disabled={isSubmitting}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleClose(false)} disabled={isSubmitting}>{translations.rateLater}</Button>
              <Button type="button" onClick={handleSubmit} disabled={rating === 0 || isSubmitting}>
                {isSubmitting ? (
                    <ThreeDotsLoader />
                ) : (
                    <Star className="mr-2 h-4 w-4" />
                )}
                {translations.submit}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
