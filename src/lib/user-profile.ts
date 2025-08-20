// Essential utility functions for user profile display

/**
 * Formats a date for display
 */
export function formatDate(date: Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return 'Not available';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(date);
}

/**
 * Formats a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return 'Never';
  
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

/**
 * Formats account age in a human-readable format
 */
export function formatAccountAge(date: Date | null | undefined): string {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);
  
  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return '1 day';
  } else if (diffInDays < 7) {
    return `${diffInDays} days`;
  } else if (diffInWeeks === 1) {
    return '1 week';
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} weeks`;
  } else if (diffInMonths === 1) {
    return '1 month';
  } else if (diffInMonths < 12) {
    return `${diffInMonths} months`;
  } else if (diffInYears === 1) {
    return '1 year';
  } else {
    return `${diffInYears} years`;
  }
}

