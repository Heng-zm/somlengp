"use client";

import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'firebase/auth';
import { 
  Clock, 
  Calendar, 
  Mail, 
  User2, 
  Shield, 
  Star,
  MessageCircle,
  Crown
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/user-profile';
import { cn } from '@/lib/utils';

interface UserProfileCardProps {
  user: User;
  variant?: 'compact' | 'detailed' | 'social' | 'premium' | 'minimal-card';
  showStats?: boolean;
  showActions?: boolean;
  className?: string;
  onClick?: () => void;
}

// Compact Profile Card - Perfect for lists and grids
export const CompactProfileCard = memo(function CompactProfileCard({ 
  user, 
  className,
  onClick 
}: UserProfileCardProps) {
  const userInitial = user.displayName?.charAt(0) || user.email?.charAt(0) || 'U';
  
  return (
    <Card 
      className={cn(
        "group cursor-pointer border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50",
        "hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all duration-300">
              <AvatarImage 
                src={user.photoURL || ''} 
                alt={user.displayName || 'User'}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            {user.emailVerified && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                <Shield className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
              {user.displayName || user.email?.split('@')[0] || 'User'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
            {user.metadata.lastSignInTime && (
              <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(new Date(user.metadata.lastSignInTime))}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Detailed Profile Card - Rich information display
export const DetailedProfileCard = memo(function DetailedProfileCard({ 
  user, 
  showActions = true,
  className,
  onClick 
}: UserProfileCardProps) {
  const userInitial = user.displayName?.charAt(0) || user.email?.charAt(0) || 'U';
  const creationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime) : null;
  const lastSignInTime = user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;
  
  return (
    <Card 
      className={cn(
        "group border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20",
        "dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10",
        "hover:shadow-2xl transition-all duration-500 ease-out",
        className
      )}
    >
      <CardContent className="p-0">
        {/* Header with gradient background */}
        <div className="relative h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-t-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-4 right-4">
            {user.providerData?.[0]?.providerId === 'google.com' && (
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Star className="h-3 w-3 mr-1" />
                Google
              </Badge>
            )}
          </div>
        </div>

        {/* Avatar and basic info */}
        <div className="relative px-6 pb-6">
          <div className="flex items-start -mt-8 mb-4">
            <Avatar className="h-16 w-16 ring-4 ring-white dark:ring-gray-900 shadow-xl">
              <AvatarImage 
                src={user.photoURL || ''} 
                alt={user.displayName || 'User'}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white font-bold text-lg">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            
            {user.emailVerified && (
              <Badge className="ml-3 mt-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-sm">
                <Shield className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {user.displayName || user.email?.split('@')[0] || 'User'}
              </h2>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mt-1">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{user.email}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              {creationTime && (
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200/50 dark:border-purple-700/30">
                  <Calendar className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatRelativeTime(creationTime)}
                  </p>
                </div>
              )}
              
              {lastSignInTime && (
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/30">
                  <Clock className="h-4 w-4 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatRelativeTime(lastSignInTime)}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex gap-2 pt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/30"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-900/30"
                  onClick={onClick}
                >
                  <User2 className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Social Profile Card - Social media style
export const SocialProfileCard = memo(function SocialProfileCard({ 
  user, 
  showStats = true,
  className,
  onClick 
}: UserProfileCardProps) {
  const userInitial = user.displayName?.charAt(0) || user.email?.charAt(0) || 'U';
  
  return (
    <Card 
      className={cn(
        "group border-0 shadow-lg bg-gradient-to-br from-white to-gray-50",
        "dark:from-gray-900 dark:to-gray-800",
        "hover:shadow-xl hover:scale-[1.01] transition-all duration-300",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-14 w-14 ring-2 ring-gradient-to-r ring-pink-500/30 ring-offset-2 ring-offset-white dark:ring-offset-gray-900">
              <AvatarImage 
                src={user.photoURL || ''} 
                alt={user.displayName || 'User'}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-white font-bold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {user.displayName || user.email?.split('@')[0] || 'User'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                @{user.email?.split('@')[0] || 'user'}
              </p>
              {user.emailVerified && (
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">Verified</span>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 hover:from-pink-600 hover:to-purple-700"
            onClick={onClick}
          >
            Follow
          </Button>
        </div>

        {/* Bio section could go here */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          Welcome to my profile! Member since {user.metadata.creationTime ? formatRelativeTime(new Date(user.metadata.creationTime)) : 'recently'}.
        </p>

        {/* Social stats */}
        {showStats && (
          <div className="flex justify-around py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="font-bold text-gray-900 dark:text-gray-100">127</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 dark:text-gray-100">1.2K</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 dark:text-gray-100">856</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Following</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Premium Profile Card - Luxurious design
export const PremiumProfileCard = memo(function PremiumProfileCard({ 
  user, 
  className,
  onClick 
}: UserProfileCardProps) {
  const userInitial = user.displayName?.charAt(0) || user.email?.charAt(0) || 'U';
  
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden border-0 shadow-2xl",
        "bg-gradient-to-br from-amber-50 via-white to-orange-50",
        "dark:from-amber-900/10 dark:via-gray-900 dark:to-orange-900/10",
        "hover:shadow-3xl transition-all duration-500",
        className
      )}
    >
      {/* Premium border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 p-0.5 rounded-lg">
        <div className="h-full w-full bg-white dark:bg-gray-900 rounded-md" />
      </div>
      
      <CardContent className="relative p-6 z-10">
        {/* Premium badge */}
        <div className="absolute top-4 right-4">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>

        <div className="flex items-start space-x-4 mb-6">
          <div className="relative">
            <Avatar className="h-16 w-16 ring-4 ring-gradient-to-r ring-amber-400/50 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 shadow-xl">
              <AvatarImage 
                src={user.photoURL || ''} 
                alt={user.displayName || 'User'}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 text-white font-bold text-lg">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
              <Crown className="h-3 w-3 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent mb-2">
              {user.displayName || user.email?.split('@')[0] || 'User'}
            </h2>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{user.email}</span>
              {user.emailVerified && (
                <Shield className="h-4 w-4 text-emerald-500" />
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Star className="h-4 w-4 fill-current" />
                <span>Premium Member</span>
              </div>
              {user.metadata.creationTime && (
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Since {formatRelativeTime(new Date(user.metadata.creationTime))}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Premium features */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
            <Star className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">VIP</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
            <Shield className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Secure</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
            <Crown className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Elite</p>
          </div>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg"
          onClick={onClick}
        >
          <User2 className="h-4 w-4 mr-2" />
          View Premium Profile
        </Button>
      </CardContent>
    </Card>
  );
});

// Minimal Card - Ultra clean design
export const MinimalProfileCard = memo(function MinimalProfileCard({ 
  user, 
  className,
  onClick 
}: UserProfileCardProps) {
  const userInitial = user.displayName?.charAt(0) || user.email?.charAt(0) || 'U';
  
  return (
    <div 
      className={cn(
        "group cursor-pointer p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50",
        "bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm",
        "hover:shadow-lg hover:border-gray-300/50 dark:hover:border-gray-600/50",
        "hover:bg-white dark:hover:bg-gray-900",
        "transition-all duration-200 ease-out",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10 ring-2 ring-gray-200/50 dark:ring-gray-700/50 group-hover:ring-blue-400/50 transition-all duration-200">
          <AvatarImage 
            src={user.photoURL || ''} 
            alt={user.displayName || 'User'}
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white font-medium text-sm">
            {userInitial}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
            {user.displayName || user.email?.split('@')[0] || 'User'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {user.email}
          </p>
        </div>

        {user.emailVerified && (
          <div className="shrink-0">
            <Shield className="h-4 w-4 text-emerald-500" />
          </div>
        )}
      </div>
    </div>
  );
});

// Export all variants
export const UserProfileVariants = {
  CompactProfileCard,
  DetailedProfileCard,
  SocialProfileCard,
  PremiumProfileCard,
  MinimalProfileCard
};
