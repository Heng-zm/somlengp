'use client';

import { memo } from 'react';
import Link from 'next/link';
import { MessageCircle, LogIn } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CommentNotificationProps {
  message: string;
  className?: string;
}

export const CommentNotification = memo(function CommentNotification({
  message,
  className
}: CommentNotificationProps) {
  return (
    <Card className={cn(
      "w-full border border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20",
      "shadow-sm hover:shadow-md transition-shadow duration-200",
      className
    )}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-grow">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              {message}
            </p>
          </div>
          <Link href="/login" passHref>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30 whitespace-nowrap"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
});
