"use client";

import { memo, useMemo, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from 'firebase/auth';
import { Clock, Calendar } from 'lucide-react';
import { formatRelativeTime } from '@/lib/user-profile';
import { cn } from '@/lib/utils';

interface UserProfileProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showUserId?: boolean;
  showLastSignIn?: boolean;
  showCreationDate?: boolean;
  variant?: 'default' | 'card' | 'minimal' | 'glass';
  showStatusDot?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeConfig = {
  sm: {
    avatar: 'h-8 w-8',
    text: 'text-sm',
    fallback: 'text-xs',
    spacing: 'space-x-2',
    statusDot: 'w-2 h-2'
  },
  md: {
    avatar: 'h-12 w-12',
    text: 'text-base',
    fallback: 'text-sm',
    spacing: 'space-x-3',
    statusDot: 'w-3 h-3'
  },
  lg: {
    avatar: 'h-16 w-16',
    text: 'text-lg',
    fallback: 'text-base',
    spacing: 'space-x-4',
    statusDot: 'w-3 h-3'
  },
  xl: {
    avatar: 'h-24 w-24',
    text: 'text-xl',
    fallback: 'text-lg',
    spacing: 'space-x-4',
    statusDot: 'w-4 h-4'
  }
} as const;

const variantConfig = {
  default: {
    container: 'flex items-center',
    content: 'flex-1 min-w-0 space-y-1'
  },
  card: {
    container: 'flex items-center p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200',
    content: 'flex-1 min-w-0 space-y-2'
  },
  minimal: {
    container: 'flex items-center',
    content: 'flex-1 min-w-0'
  },
  glass: {
    container: 'flex items-center p-4 rounded-2xl bg-white/10 dark:bg-gray-900/10 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-xl transition-all duration-300',
    content: 'flex-1 min-w-0 space-y-2'
  }
} as const;

// Memoized sub-components for better performance
const StatusDot = memo(function StatusDot({ 
  size, 
  className 
}: { 
  size: string;
  className?: string; 
}) {
  return (
    <div 
      className={cn(
        'absolute -bottom-0.5 -right-0.5 rounded-full',
        'bg-mono-gray-700',
        'ring-2 ring-white dark:ring-gray-800',
        'animate-pulse shadow-sm',
        size,
        className
      )} 
    />
  );
});

const UserBadge = memo(function UserBadge({ 
  type, 
  userId, 
  isVerified 
}: { 
  type: 'userId' | 'verified';
  userId?: string;
  isVerified?: boolean;
}) {
  if (type === 'userId' && userId) {
    return (
      <Badge 
        variant="outline" 
        className="text-xs font-mono bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
      >
        <span className="text-gray-500 dark:text-gray-400">ID:</span>
        <span className="ml-1 text-gray-700 dark:text-gray-300">{userId.substring(0, 8)}...</span>
      </Badge>
    );
  }

  if (type === 'verified' && isVerified) {
    return (
      <Badge className="text-xs bg-mono-gray-700 text-mono-white hover:bg-mono-gray-600 transition-all duration-200 shadow-sm">
        Verified
      </Badge>
    );
  }

  return null;
});

const ActivityInfo = memo(function ActivityInfo({ 
  type, 
  date, 
  iconSize = 'h-3 w-3'
}: { 
  type: 'lastSignIn' | 'creation';
  date: Date | null;
  iconSize?: string;
}) {
  if (!date) return null;

  const Icon = type === 'lastSignIn' ? Clock : Calendar;
  const label = type === 'lastSignIn' ? 'Last seen' : 'Joined';
  const iconColor = type === 'lastSignIn' ? 'text-mono-gray-500' : 'text-mono-gray-600';

  return (
    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200 group-hover:text-gray-700 dark:group-hover:text-gray-300">
      <Icon className={cn(iconSize, iconColor)} />
      <span>{label} {formatRelativeTime(date)}</span>
    </div>
  );
});

export const OptimizedUserProfile = memo(function OptimizedUserProfile({ 
  user, 
  size = 'md', 
  showName = true, 
  showUserId = false,
  showLastSignIn = false,
  showCreationDate = false,
  variant = 'default',
  showStatusDot = false,
  className = '',
  onClick
}: UserProfileProps) {
  const sizeClasses = sizeConfig[size];
  const variantClasses = variantConfig[variant];
  
  // Memoize parsed dates to avoid repeated Date construction
  const dates = useMemo(() => ({
    lastSignInTime: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null,
    creationTime: user.metadata.creationTime ? new Date(user.metadata.creationTime) : null,
  }), [user.metadata.lastSignInTime, user.metadata.creationTime]);

  // Memoize user initial calculation
  const userInitial = useMemo(() => {
    return user.displayName?.charAt(0) || user.email?.charAt(0) || 'U';
  }, [user.displayName, user.email]);

  // Memoize display name calculation
  const displayName = useMemo(() => {
    return user.displayName || user.email || 'User';
  }, [user.displayName, user.email]);

  // Memoize class calculations for performance
  const classes = useMemo(() => ({
    container: cn(
      variantClasses.container, 
      sizeClasses.spacing,
      'group transition-all duration-200 ease-in-out',
      onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
      className
    ),
    avatar: cn(
      sizeClasses.avatar, 
      'ring-2 ring-white/50 dark:ring-gray-800/50 shadow-lg',
      'transition-all duration-300 group-hover:ring-4 group-hover:ring-blue-500/30',
      'relative overflow-hidden'
    ),
    fallback: cn(
      'bg-gradient-to-br from-mono-gray-800 via-mono-gray-700 to-mono-gray-900', 
      'text-mono-white font-bold shadow-inner',
      'transition-all duration-300 group-hover:from-mono-gray-700 group-hover:to-mono-gray-800',
      sizeClasses.fallback
    ),
    displayName: cn(
      'font-semibold bg-gradient-to-r from-mono-gray-900 to-mono-gray-700 dark:from-mono-gray-100 dark:to-mono-gray-300',
      'bg-clip-text text-transparent truncate transition-all duration-200',
      'group-hover:from-mono-black group-hover:to-mono-gray-800 dark:group-hover:from-mono-white dark:group-hover:to-mono-gray-200',
      sizeClasses.text
    )
  }), [variantClasses, sizeClasses, onClick, className]);

  // Memoized click handler to prevent unnecessary re-renders
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <div className={classes.container} onClick={handleClick} role={onClick ? "button" : undefined}>
      <div className="relative">
        <Avatar className={classes.avatar}>
          <AvatarImage 
            src={user.photoURL || ''} 
            alt={displayName}
            className="object-cover transition-all duration-300 group-hover:scale-110"
            loading="lazy" // Add lazy loading for better performance
          />
          <AvatarFallback className={classes.fallback}>
            <span className="select-none">{userInitial}</span>
          </AvatarFallback>
        </Avatar>
        
        {showStatusDot && (
          <StatusDot size={sizeClasses.statusDot} />
        )}
      </div>
      
      {showName && (
        <div className={variantClasses.content}>
          <div className="space-y-1">
            <p className={classes.displayName}>
              {displayName}
            </p>
            {!user.displayName && user.email && (
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate transition-colors duration-200 group-hover:text-gray-800 dark:group-hover:text-gray-200">
                {user.email}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <UserBadge type="userId" userId={showUserId ? user.uid : undefined} />
            <UserBadge type="verified" isVerified={user.emailVerified} />
          </div>
          
          <div className="space-y-1">
            {showLastSignIn && (
              <ActivityInfo type="lastSignIn" date={dates.lastSignInTime} />
            )}
            {showCreationDate && (
              <ActivityInfo type="creation" date={dates.creationTime} />
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// Export with display name for debugging
OptimizedUserProfile.displayName = 'OptimizedUserProfile';