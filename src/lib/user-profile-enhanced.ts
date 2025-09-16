// Enhanced utility functions for user profile display with caching and performance optimizations

// Cache for formatted dates to avoid repeated calculations
const dateFormatCache = new Map<string, string>();
const relativeTimeCache = new Map<string, { formatted: string; timestamp: number }>();

// Cache TTL for relative time formatting (5 minutes)
const RELATIVE_TIME_CACHE_TTL = 5 * 60 * 1000;

/**
 * Formats a date for display with caching
 */
export function formatDate(date: Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return 'Not available';
  
  const cacheKey = `${date.getTime()}-${JSON.stringify(options || {})}`;
  
  if (dateFormatCache.has(cacheKey)) {
    return dateFormatCache.get(cacheKey)!;
  }
  
  const formatted = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(date);
  
  // Cache the result
  dateFormatCache.set(cacheKey, formatted);
  
  // Prevent memory leaks by limiting cache size
  if (dateFormatCache.size > 1000) {
    const firstKey = dateFormatCache.keys().next().value;
    if (firstKey) {
      dateFormatCache.delete(firstKey);
    }
  }
  
  return formatted;
}

/**
 * Formats a relative time (e.g., "2 hours ago") with smart caching
 */
export function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return 'Never';
  
  const now = Date.now();
  const dateTime = date.getTime();
  const cacheKey = dateTime.toString();
  
  // Check cache and TTL
  const cached = relativeTimeCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < RELATIVE_TIME_CACHE_TTL) {
    return cached.formatted;
  }
  
  const diffInMs = now - dateTime;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);
  
  let formatted: string;
  
  if (diffInSeconds < 30) {
    formatted = 'Just now';
  } else if (diffInSeconds < 60) {
    formatted = 'Less than a minute ago';
  } else if (diffInMinutes === 1) {
    formatted = '1 minute ago';
  } else if (diffInMinutes < 60) {
    formatted = `${diffInMinutes} minutes ago`;
  } else if (diffInHours === 1) {
    formatted = '1 hour ago';
  } else if (diffInHours < 24) {
    formatted = `${diffInHours} hours ago`;
  } else if (diffInDays === 1) {
    formatted = 'Yesterday';
  } else if (diffInDays < 7) {
    formatted = `${diffInDays} days ago`;
  } else if (diffInWeeks === 1) {
    formatted = '1 week ago';
  } else if (diffInWeeks < 4) {
    formatted = `${diffInWeeks} weeks ago`;
  } else if (diffInMonths === 1) {
    formatted = '1 month ago';
  } else if (diffInMonths < 12) {
    formatted = `${diffInMonths} months ago`;
  } else if (diffInYears === 1) {
    formatted = '1 year ago';
  } else if (diffInYears < 5) {
    formatted = `${diffInYears} years ago`;
  } else {
    // For very old dates, show the actual date
    formatted = formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  
  // Cache the result with timestamp
  relativeTimeCache.set(cacheKey, { formatted, timestamp: now });
  
  // Prevent memory leaks by limiting cache size
  if (relativeTimeCache.size > 500) {
    const firstKey = relativeTimeCache.keys().next().value;
    if (firstKey) {
      relativeTimeCache.delete(firstKey);
    }
  }
  
  return formatted;
}

/**
 * Formats account age in a human-readable format with enhanced precision
 */
export function formatAccountAge(date: Date | null | undefined): string {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);
  
  if (diffInHours < 1) {
    return 'Less than an hour';
  } else if (diffInHours < 24) {
    const hours = diffInHours;
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
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

/**
 * Get user's display name with fallbacks
 */
export function getUserDisplayName(user: { displayName?: string | null; email?: string | null }): string {
  if (user.displayName && user.displayName.trim()) {
    return user.displayName.trim();
  }
  
  if (user.email) {
    // Extract name from email if no display name
    const emailName = user.email.split('@')[0];
    // Capitalize first letter and replace dots/underscores with spaces
    return emailName
      .replace(/[._]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  return 'User';
}

/**
 * Get user's initials for avatar fallback
 */
export function getUserInitials(user: { displayName?: string | null; email?: string | null }): string {
  const displayName = getUserDisplayName(user);
  
  // Split by spaces and get first letter of each word (max 2)
  const words = displayName.split(' ').filter(word => word.length > 0);
  
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  } else if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return 'U';
}

/**
 * Check if user is considered "new" (account created within last 7 days)
 */
export function isNewUser(creationTime: string | null | undefined): boolean {
  if (!creationTime) return false;
  
  const creationDate = new Date(creationTime);
  const now = new Date();
  const diffInMs = now.getTime() - creationDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  return diffInDays < 7;
}

/**
 * Check if user was active recently (signed in within last 24 hours)
 */
export function isRecentlyActive(lastSignInTime: string | null | undefined): boolean {
  if (!lastSignInTime) return false;
  
  const lastSignInDate = new Date(lastSignInTime);
  const now = new Date();
  const diffInMs = now.getTime() - lastSignInDate.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  
  return diffInHours < 24;
}

/**
 * Get time breakdown since last sign in
 */
export function getTimeSinceLastSignIn(lastSignInTime: string | null | undefined) {
  if (!lastSignInTime) return null;
  
  const now = new Date();
  const lastSignInDate = new Date(lastSignInTime);
  const diffInMs = now.getTime() - lastSignInDate.getTime();
  
  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  
  return {
    seconds,
    minutes,
    hours,
    days,
    weeks,
    formatted: formatRelativeTime(lastSignInDate),
    raw: diffInMs
  };
}

/**
 * Validate user profile data
 */
export function validateUserProfileData(data: {
  displayName?: string;
  email?: string;
  photoURL?: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Display name validation
  if (data.displayName !== undefined) {
    if (typeof data.displayName !== 'string') {
      errors.displayName = 'Display name must be a string';
    } else if (data.displayName.trim().length === 0) {
      errors.displayName = 'Display name cannot be empty';
    } else if (data.displayName.length < 2) {
      errors.displayName = 'Display name must be at least 2 characters long';
    } else if (data.displayName.length > 50) {
      errors.displayName = 'Display name must be 50 characters or less';
    } else if (!/^[a-zA-Z0-9\s\-_.]+$/.test(data.displayName)) {
      errors.displayName = 'Display name contains invalid characters';
    }
  }
  
  // Email validation (basic)
  if (data.email !== undefined && data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
  }
  
  // Photo URL validation
  if (data.photoURL !== undefined && data.photoURL) {
    try {
      new URL(data.photoURL);
      if (!data.photoURL.startsWith('http://') && !data.photoURL.startsWith('https://')) {
        errors.photoURL = 'Photo URL must use HTTP or HTTPS protocol';
      }
    } catch {
      errors.photoURL = 'Please enter a valid URL';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Generate a user profile summary for display
 */
export function generateUserSummary(user: {
  displayName?: string | null;
  email?: string | null;
  emailVerified?: boolean;
  metadata?: {
    creationTime?: string | null;
    lastSignInTime?: string | null;
  };
  providerData?: Array<{ providerId?: string }>;
}) {
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);
  const isNew = isNewUser(user.metadata?.creationTime);
  const isActive = isRecentlyActive(user.metadata?.lastSignInTime);
  
  const providers = user.providerData?.map(p => p.providerId).filter(Boolean) || [];
  const isGoogleUser = providers.includes('google.com');
  
  const accountAge = user.metadata?.creationTime 
    ? formatAccountAge(new Date(user.metadata.creationTime))
    : 'Unknown';
    
  const lastActive = user.metadata?.lastSignInTime 
    ? formatRelativeTime(new Date(user.metadata.lastSignInTime))
    : 'Never';
  
  return {
    displayName,
    initials,
    isNew,
    isActive,
    isVerified: Boolean(user.emailVerified),
    isGoogleUser,
    accountAge,
    lastActive,
    providers,
    email: user.email || undefined
  };
}

/**
 * Clear caches (useful for testing or memory management)
 */
export function clearCaches(): void {
  dateFormatCache.clear();
  relativeTimeCache.clear();
}