"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { debug } from "@/lib/debug";
import { 
  LogIn, 
  User, 
  UserCircle, 
  Shield, 
  Key,
  Sparkles,
  Zap
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";


export type LoginButtonVariant = 
  | 'default'
  | 'icon-only' 
  | 'icon-prominent'
  | 'gradient'
  | 'glass'
  | 'neon'
  | 'minimal'
  | 'pill'
  | 'square';

interface EnhancedLoginButtonProps {
  variant?: LoginButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  customIcon?: React.ReactNode;
}

export function EnhancedLoginButton({ 
  variant = 'default', 
  size = 'md',
  showText = true,
  customIcon
}: EnhancedLoginButtonProps) {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  // Size mappings
  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm", 
    lg: "h-12 px-6 text-base"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  // Map custom sizes to valid Button sizes
  const getButtonSize = (customSize: 'sm' | 'md' | 'lg'): 'sm' | 'default' | 'lg' => {
    switch (customSize) {
      case 'sm': return 'sm';
      case 'md': return 'default';
      case 'lg': return 'lg';
    }
  };

  // Loading state
  if (loading) {
    return (
      <Button 
        variant="ghost" 
        size={getButtonSize(size)}
        disabled 
        className={cn("relative overflow-hidden", sizeClasses[size])}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse" />
        <div className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent mr-2", iconSizes[size])} />
        {showText && (
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Connecting...
          </span>
        )}
      </Button>
    );
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      debug.error('Sign in error:', error);
    }
  };

  // Icon selection
  const getIcon = () => {
    if (customIcon) return customIcon;
    
    switch (variant) {
      case 'icon-prominent':
      case 'gradient':
        return <Shield className={iconSizes[size]} />;
      case 'glass':
        return <Sparkles className={iconSizes[size]} />;
      case 'neon':
        return <Zap className={iconSizes[size]} />;
      case 'pill':
        return <UserCircle className={iconSizes[size]} />;
      case 'square':
        return <Key className={iconSizes[size]} />;
      default:
        return <LogIn className={iconSizes[size]} />;
    }
  };

  if (!user) {
    const buttonVariants: Record<LoginButtonVariant, React.ReactNode> = {
      // Default button with icon background
      default: (
        <Button
          onClick={handleSignIn}
          className={cn(
            "relative overflow-hidden bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm",
            "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
            "dark:bg-gray-900 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800",
            sizeClasses[size]
          )}
        >
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full p-1 mr-2">
            {getIcon()}
          </div>
          {showText && <span className="font-medium">Sign In</span>}
        </Button>
      ),

      // Icon only button
      'icon-only': (
        <Button
          onClick={handleSignIn}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "relative overflow-hidden rounded-full p-0 aspect-square",
            "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
            "text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.05]",
            size === 'sm' && "w-8 h-8",
            size === 'md' && "w-10 h-10", 
            size === 'lg' && "w-12 h-12"
          )}
        >
          <div className={cn(
            "absolute inset-0 bg-white/20 rounded-full opacity-0 transition-opacity duration-300",
            isHovered && "opacity-100"
          )} />
          <div className="relative flex items-center justify-center">
            {getIcon()}
          </div>
        </Button>
      ),

      // Prominent icon with large icon area
      'icon-prominent': (
        <Button
          onClick={handleSignIn}
          className={cn(
            "relative overflow-hidden bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
            "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
            "dark:bg-gray-900 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800",
            sizeClasses[size], "pl-2"
          )}
        >
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2 mr-3">
            <Shield className={cn(iconSizes[size], "text-white")} />
          </div>
          {showText && <span className="font-medium">Secure Sign In</span>}
        </Button>
      ),

      // Full gradient button
      gradient: (
        <Button
          onClick={handleSignIn}
          className={cn(
            "relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600",
            "hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700",
            "text-white border-0 shadow-lg hover:shadow-xl",
            "transition-all duration-300 hover:scale-[1.02]",
            sizeClasses[size]
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center">
            <div className="bg-white/20 rounded-full p-1 mr-2">
              {getIcon()}
            </div>
            {showText && <span className="font-medium">Sign In</span>}
          </div>
        </Button>
      ),

      // Glass morphism style
      glass: (
        <Button
          onClick={handleSignIn}
          className={cn(
            "relative overflow-hidden backdrop-blur-xl bg-white/20 hover:bg-white/30",
            "border border-white/30 text-gray-800 dark:text-white shadow-2xl",
            "transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
            sizeClasses[size]
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
          <div className="relative flex items-center">
            <div className="bg-white/30 rounded-full p-1 mr-2">
              <Sparkles className={cn(iconSizes[size], "text-blue-600")} />
            </div>
            {showText && <span className="font-medium">Glass Sign In</span>}
          </div>
        </Button>
      ),

      // Neon style
      neon: (
        <Button
          onClick={handleSignIn}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "relative overflow-hidden bg-black hover:bg-gray-900 text-cyan-400 border-2 border-cyan-400/50",
            "transition-all duration-300 hover:border-cyan-400 hover:text-cyan-300",
            "hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]",
            sizeClasses[size]
          )}
        >
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 transition-opacity duration-300",
            isHovered && "opacity-100"
          )} />
          <div className="relative flex items-center">
            <div className={cn(
              "border border-cyan-400/50 rounded-full p-1 mr-2 transition-all duration-300",
              isHovered && "border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
            )}>
              <Zap className={cn(iconSizes[size], "text-cyan-400")} />
            </div>
            {showText && <span className="font-medium">Neon Sign In</span>}
          </div>
        </Button>
      ),

      // Minimal style
      minimal: (
        <Button
          variant="ghost"
          onClick={handleSignIn}
          className={cn(
            "text-blue-600 hover:text-blue-700 hover:bg-blue-50",
            "dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/20",
            "transition-all duration-200",
            sizeClasses[size]
          )}
        >
          {getIcon()}
          {showText && <span className="ml-2">Sign in</span>}
        </Button>
      ),

      // Pill shaped
      pill: (
        <Button
          onClick={handleSignIn}
          className={cn(
            "rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600",
            "text-white border-0 shadow-lg hover:shadow-xl",
            "transition-all duration-300 hover:scale-[1.02]",
            sizeClasses[size]
          )}
        >
          <UserCircle className={cn(iconSizes[size], "mr-2")} />
          {showText && <span className="font-medium">Continue</span>}
        </Button>
      ),

      // Square/boxy design
      square: (
        <Button
          onClick={handleSignIn}
          className={cn(
            "rounded-none bg-gray-800 hover:bg-gray-700 text-white border-0",
            "shadow-lg hover:shadow-xl transition-all duration-300",
            "border-l-4 border-blue-500 hover:border-blue-400",
            sizeClasses[size]
          )}
        >
          <div className="bg-blue-500/20 rounded-sm p-1 mr-2">
            <Key className={cn(iconSizes[size], "text-blue-400")} />
          </div>
          {showText && <span className="font-medium tracking-wide">SIGN IN</span>}
        </Button>
      )
    };

    return buttonVariants[variant];
  }

  // User dropdown (same as original but with enhanced styling)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full transition-all duration-200 hover:scale-105"
        >
          <Avatar className="h-9 w-9 ring-2 ring-blue-500/20 hover:ring-blue-500/50 transition-all duration-200">
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
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-72">
        {/* Header with user info */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 ring-2 ring-blue-500/30">
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

        <DropdownMenuSeparator />
        
        {/* Profile Link */}
        <DropdownMenuItem asChild>
          <Link 
            href="/profile"
            className="cursor-pointer flex items-center"
          >
            <User className="w-4 h-4 mr-2" />
            <span className="font-medium">View Profile</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Sign out */}
        <DropdownMenuItem 
          onClick={logout} 
          className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
        >
          <LogIn className="w-4 h-4 mr-2 rotate-180" />
          <span className="font-medium">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
