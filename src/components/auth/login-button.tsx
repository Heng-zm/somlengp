"use client";

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// Google Colors for branding
const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

interface LoginButtonProps {
  variant?: 'default' | 'modern' | 'minimal' | 'gradient' | 'circle';
}

export function LoginButton({ variant = 'modern' }: LoginButtonProps) {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  // Debug logging
  console.log('LoginButton render:', { user: !!user, loading, variant });

  // Loading state with animated spinner
  if (loading) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        disabled 
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse" />
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Connecting...
        </span>
      </Button>
    );
  }

  const handleSignIn = async () => {
    console.log('Login button clicked, attempting sign in...');
    try {
      await signInWithGoogle();
      console.log('Sign in function completed');
    } catch (error) {
      console.error('Sign in error in LoginButton:', error);
    }
  };

  // Enhanced login button designs
  if (!user) {
    const buttonVariants = {
      default: (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSignIn}
          className="hover:shadow-md transition-all duration-200"
        >
          <GoogleIcon />
          <span className="ml-2">Sign in with Google</span>
        </Button>
      ),
      modern: (
        <Button
          onClick={handleSignIn}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "relative overflow-hidden bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm",
            "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
            "dark:bg-gray-900 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800"
          )}
          size="sm"
        >
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300",
            isHovered && "opacity-100"
          )} />
          <div className="relative flex items-center">
            <GoogleIcon />
            <span className="ml-2 font-medium">Continue with Google</span>
          </div>
        </Button>
      ),
      minimal: (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignIn}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/20"
        >
          <GoogleIcon />
          <span className="ml-2">Sign in</span>
        </Button>
      ),
      gradient: (
        <Button
          onClick={handleSignIn}
          className={cn(
            "relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600",
            "hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700",
            "text-white border-0 shadow-lg hover:shadow-xl",
            "transition-all duration-300 hover:scale-[1.02]"
          )}
          size="sm"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center">
            <div className="bg-white/20 rounded-full p-1 mr-2">
              <GoogleIcon />
            </div>
            <span className="font-medium">Sign in with Google</span>
          </div>
        </Button>
      ),
      circle: (
        <Button
          onClick={handleSignIn}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "relative overflow-hidden h-10 w-10 rounded-full p-0",
            "bg-white hover:bg-gray-50 border border-gray-300 shadow-md",
            "transition-all duration-300 hover:shadow-lg hover:scale-[1.05]",
            "dark:bg-gray-900 dark:border-gray-600 dark:hover:bg-gray-800"
          )}
        >
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full opacity-0 transition-opacity duration-300",
            isHovered && "opacity-100"
          )} />
          <div className="relative flex items-center justify-center">
            <GoogleIcon />
          </div>
        </Button>
      )
    };

    return buttonVariants[variant];
  }

  // Enhanced user dropdown with better styling
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage 
              src={user.photoURL || ''} 
              alt={user.displayName || 'User'}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-72 p-0" align="end" forceMount>
        {/* Header with user info */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 ring-2 ring-white/50">
              <AvatarImage 
                src={user.photoURL || ''} 
                alt={user.displayName || 'User'}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {user.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {user.email}
              </p>
              <div className="flex items-center mt-1">
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
                  Online
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="m-0" />
        
        
        {/* Sign out */}
        <div className="px-2 py-2">
          <DropdownMenuItem 
            onClick={logout} 
            className="cursor-pointer rounded-md px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span className="font-medium">Sign out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
