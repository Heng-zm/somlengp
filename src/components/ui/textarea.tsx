import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-24 w-full rounded-lg border border-input bg-background px-3.5 py-3 text-base text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 md:text-sm',
          'no-zoom-textarea', // Prevent mobile zoom on focus
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
