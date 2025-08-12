"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from 'firebase/auth';
import { Clock, Calendar } from 'lucide-react';
import { formatRelativeTime } from '@/lib/user-profile';

interface UserProfileProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showUserId?: boolean;
  showLastSignIn?: boolean;
  showCreationDate?: boolean;
  className?: string;
}

const sizeMap = {
  sm: {
    avatar: 'h-8 w-8',
    text: 'text-sm',
    fallback: 'text-xs'
  },
  md: {
    avatar: 'h-12 w-12',
    text: 'text-base',
    fallback: 'text-sm'
  },
  lg: {
    avatar: 'h-16 w-16',
    text: 'text-lg',
    fallback: 'text-base'
  },
  xl: {
    avatar: 'h-24 w-24',
    text: 'text-xl',
    fallback: 'text-lg'
  }
};

export function UserProfile({ 
  user, 
  size = 'md', 
  showName = true, 
  showUserId = false,
  showLastSignIn = false,
  showCreationDate = false,
  className = '' 
}: UserProfileProps) {
  const sizeClasses = sizeMap[size];
  const lastSignInTime = user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;
  const creationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime) : null;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Avatar className={`${sizeClasses.avatar} ring-2 ring-white shadow-lg dark:ring-gray-700`}>
        <AvatarImage 
          src={user.photoURL || ''} 
          alt={user.displayName || 'User'}
          className="object-cover"
        />
        <AvatarFallback className={`bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold ${sizeClasses.fallback}`}>
          {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      
      {showName && (
        <div className="flex-1 min-w-0 space-y-1">
          <p className={`font-semibold text-gray-900 dark:text-gray-100 truncate ${sizeClasses.text}`}>
            {user.displayName || 'User'}
          </p>
          {!user.displayName && user.email && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {user.email}
            </p>
          )}
          
          {/* User ID Badge */}
          {showUserId && (
            <Badge variant="outline" className="text-xs font-mono">
              ID: {user.uid.substring(0, 8)}...
            </Badge>
          )}
          
          {/* Last Sign In */}
          {showLastSignIn && lastSignInTime && (
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>Last seen {formatRelativeTime(lastSignInTime)}</span>
            </div>
          )}
          
          {/* Creation Date */}
          {showCreationDate && creationTime && (
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="h-3 w-3" />
              <span>Joined {formatRelativeTime(creationTime)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
