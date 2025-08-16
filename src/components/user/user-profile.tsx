"use client";

import { memo, useMemo } from 'react';
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
}

const sizeMap = {
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
};

const variantMap = {
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
};

export const UserProfile = memo(function UserProfile({ 
  user, 
  size = 'md', 
  showName = true, 
  showUserId = false,
  showLastSignIn = false,
  showCreationDate = false,
  variant = 'default',
  showStatusDot = false,
  className = '' 
}: UserProfileProps) {
  const sizeClasses = sizeMap[size];
  const variantClasses = variantMap[variant];
  
  const { lastSignInTime, creationTime, userInitial, containerClasses, avatarClasses, fallbackClasses } = useMemo(() => {
    const lastSignInTime = user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;
    const creationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime) : null;
    const userInitial = user.displayName?.charAt(0) || user.email?.charAt(0) || 'U';
    
    return {
      lastSignInTime,
      creationTime,
      userInitial,
      containerClasses: cn(
        variantClasses.container, 
        sizeClasses.spacing,
        'group cursor-pointer transition-all duration-200 ease-in-out',
        'hover:scale-[1.02] active:scale-[0.98]',
        className
      ),
      avatarClasses: cn(
        sizeClasses.avatar, 
        'ring-2 ring-white/50 dark:ring-gray-800/50 shadow-lg',
        'transition-all duration-300 group-hover:ring-4 group-hover:ring-blue-500/30',
        'relative overflow-hidden'
      ),
      fallbackClasses: cn(
        'bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600', 
        'text-white font-bold shadow-inner',
        'transition-all duration-300 group-hover:from-blue-600 group-hover:to-purple-700',
        sizeClasses.fallback
      )
    };
  }, [user.metadata.lastSignInTime, user.metadata.creationTime, user.displayName, user.email, sizeClasses, variantClasses, className]);

  return (
    <div className={containerClasses}>
      <div className="relative">
        <Avatar className={avatarClasses}>
          <AvatarImage 
            src={user.photoURL || ''} 
            alt={user.displayName || 'User'}
            className="object-cover transition-all duration-300 group-hover:scale-110"
          />
          <AvatarFallback className={fallbackClasses}>
            <span className="select-none">{userInitial}</span>
          </AvatarFallback>
        </Avatar>
        
        {/* Status Dot */}
        {showStatusDot && (
          <div className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full',
            'bg-gradient-to-r from-green-400 to-emerald-500',
            'ring-2 ring-white dark:ring-gray-800',
            'animate-pulse shadow-sm',
            sizeClasses.statusDot
          )} />
        )}
      </div>
      
      {showName && (
        <div className={variantClasses.content}>
          <div className="space-y-1">
            <p className={cn(
              'font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300',
              'bg-clip-text text-transparent truncate transition-all duration-200',
              'group-hover:from-blue-900 group-hover:to-purple-700 dark:group-hover:from-blue-100 dark:group-hover:to-purple-300',
              sizeClasses.text
            )}>
              {user.displayName || user.email || 'User'}
            </p>
            {!user.displayName && user.email && (
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate transition-colors duration-200 group-hover:text-gray-800 dark:group-hover:text-gray-200">
                {user.email}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* User ID Badge */}
            {showUserId && (
              <Badge 
                variant="outline" 
                className="text-xs font-mono bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
              >
                <span className="text-gray-500 dark:text-gray-400">ID:</span>
                <span className="ml-1 text-gray-700 dark:text-gray-300">{user.uid.substring(0, 8)}...</span>
              </Badge>
            )}
            
            {/* Email Verification Badge */}
            {user.emailVerified && (
              <Badge className="text-xs bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 transition-all duration-200 shadow-sm">
                Verified
              </Badge>
            )}
          </div>
          
          {/* Activity Info */}
          <div className="space-y-1">
            {/* Last Sign In */}
            {showLastSignIn && lastSignInTime && (
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                <Clock className="h-3 w-3 text-blue-500" />
                <span>Last seen {formatRelativeTime(lastSignInTime)}</span>
              </div>
            )}
            
            {/* Creation Date */}
            {showCreationDate && creationTime && (
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                <Calendar className="h-3 w-3 text-purple-500" />
                <span>Joined {formatRelativeTime(creationTime)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
