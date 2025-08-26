"use client";

import { memo } from 'react';
import { LoginForm } from "./login-form";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthFormsProps {
  variant?: 'default' | 'circle';
}

export const AuthForms = memo(function AuthForms({ variant = 'default' }: AuthFormsProps) {
  const { user, loading, logout } = useAuth();

  // Loading state
  if (loading) {
    return (
      <Button 
        variant="ghost" 
        size={variant === 'circle' ? 'icon' : 'sm'}
        disabled 
        className={cn(
          "relative overflow-hidden",
          variant === 'circle' && "h-10 w-10 rounded-full"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse" />
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
      </Button>
    );
  }

  // If user is logged in, show user dropdown
  if (user) {
    if (variant === 'circle') {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative h-10 w-10 rounded-full transition-all duration-200 hover:scale-105"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage 
                  src={user.photoURL || ''} 
                  alt={user.displayName || 'User'}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center space-x-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.displayName || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // Default variant for sidebar
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="relative h-10 w-10 rounded-full transition-all duration-200 hover:scale-105"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage 
                src={user.photoURL || ''} 
                alt={user.displayName || 'User'}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-72 p-0" align="end" forceMount>
          {/* Header with user info */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={user.photoURL || ''} 
                  alt={user.displayName || 'User'}
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
          
          {/* Profile Link */}
          <div className="px-2 py-2">
            <DropdownMenuItem asChild>
              <Link 
                href="/profile"
                className="cursor-pointer rounded-md px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 flex items-center"
              >
                <User className="mr-3 h-4 w-4" />
                <span className="font-medium">View Profile</span>
              </Link>
            </DropdownMenuItem>
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

  // If user is not logged in, show login form only
  return (
    <div className="flex items-center gap-2">
      <LoginForm />
    </div>
  );
});
