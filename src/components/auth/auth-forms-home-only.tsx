"use client";

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
import { LogOut, User, LogIn } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthFormsHomeOnlyProps {
  variant?: 'default' | 'circle';
}

export function AuthFormsHomeOnly({ variant = 'default' }: AuthFormsHomeOnlyProps) {
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

  // If user is not logged in, show sign in button that navigates to login page
  return (
    <div className="flex items-center gap-2">
      <Link href="/login">
        <Button 
          variant={variant === 'circle' ? 'ghost' : 'outline'}
          size={variant === 'circle' ? 'icon' : 'sm'}
          className={cn(
            "relative overflow-hidden",
            variant === 'circle' 
              ? "h-10 w-10 rounded-full p-0 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl border-0"
              : "bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 text-gray-700 border border-blue-200 shadow-sm hover:border-blue-300 dark:from-blue-950/30 dark:to-purple-950/30 dark:hover:from-blue-900/40 dark:hover:to-purple-900/40 dark:bg-gray-900 dark:text-gray-200 dark:border-blue-600 dark:hover:bg-gray-800 h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm w-full sm:w-auto group",
            "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
          )}
        >
          {variant === 'circle' ? (
            <div className="relative flex items-center justify-center">
              <LogIn className="h-4 w-4 text-white hover:scale-110 transition-transform duration-300" />
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-1 mr-1 sm:mr-2 shadow-sm group-hover:shadow-md transition-all duration-300">
                <LogIn className="h-3 w-3 sm:h-4 sm:w-4 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-purple-700 transition-all duration-300">Sign in</span>
            </>
          )}
        </Button>
      </Link>
    </div>
  );
}
