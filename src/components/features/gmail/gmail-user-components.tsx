"use client";

import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Star, 
  Archive, 
  Trash2, 
  MoreHorizontal, 
  Paperclip, 
  Clock, 
  Shield,
  Mail,
  Inbox,
  Send,
  File,
  Tag,
  User,
  CheckCircle2
} from 'lucide-react';

interface GmailUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  verified?: boolean;
  online?: boolean;
}

interface GmailEmail {
  id: string;
  from: GmailUser;
  to?: GmailUser[];
  subject: string;
  preview: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  hasAttachment: boolean;
  labels?: string[];
  importance?: 'high' | 'medium' | 'low';
}

interface GmailUserAvatarProps {
  user: GmailUser;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showOnline?: boolean;
  className?: string;
}

// Gmail User Avatar Component
export const GmailUserAvatar = memo(function GmailUserAvatar({
  user,
  size = 'md',
  showOnline = false,
  className
}: GmailUserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className={cn("relative", className)}>
      <Avatar className={cn(
        sizeClasses[size],
        "ring-2 ring-white dark:ring-gray-900 shadow-sm",
        "transition-all duration-200 hover:shadow-md"
      )}>
        <AvatarImage 
          src={user.avatar} 
          alt={user.name}
          className="object-cover"
        />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
          {initial}
        </AvatarFallback>
      </Avatar>
      
      {/* Verification badge */}
      {user.verified && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
          <CheckCircle2 className="h-3 w-3 text-white" />
        </div>
      )}
      
      {/* Online status */}
      {showOnline && user.online && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
      )}
    </div>
  );
});

// Gmail User Card Component
interface GmailUserCardProps {
  user: GmailUser;
  variant?: 'compact' | 'detailed';
  showActions?: boolean;
  className?: string;
  onClick?: () => void;
}

export const GmailUserCard = memo(function GmailUserCard({
  user,
  variant = 'compact',
  showActions = true,
  className,
  onClick
}: GmailUserCardProps) {
  if (variant === 'detailed') {
    return (
      <Card className={cn(
        "group cursor-pointer border-0 shadow-lg bg-white dark:bg-gray-900",
        "hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out",
        "border border-gray-200 dark:border-gray-700",
        className
      )} onClick={onClick}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <GmailUserAvatar user={user} size="lg" showOnline />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                  {user.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
                {user.verified && (
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-blue-600 dark:text-blue-400">Verified Account</span>
                  </div>
                )}
              </div>
            </div>
            
            {showActions && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* User stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-gray-100">24</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Emails</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-gray-100">12</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Drafts</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-gray-100">5</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Labels</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn(
      "group cursor-pointer p-3 rounded-lg border border-gray-200 dark:border-gray-700",
      "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800",
      "transition-all duration-200 ease-out",
      className
    )} onClick={onClick} role="button" tabIndex={0}>
      <div className="flex items-center space-x-3">
        <GmailUserAvatar user={user} showOnline />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {user.name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {user.email}
          </p>
        </div>
        {user.verified && (
          <Shield className="h-4 w-4 text-blue-500 shrink-0" />
        )}
      </div>
    </div>
  );
});

// Gmail Email List Item Component
interface GmailEmailItemProps {
  email: GmailEmail;
  selected?: boolean;
  className?: string;
  onSelect?: () => void;
  onStar?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export const GmailEmailItem = memo(function GmailEmailItem({
  email,
  selected = false,
  className,
  onSelect,
  onStar,
  onArchive,
  onDelete
}: GmailEmailItemProps) {
  return (
    <div className={cn(
      "group cursor-pointer p-4 border-b border-gray-200 dark:border-gray-700",
      "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800",
      "transition-all duration-200 ease-out",
      selected && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
      !email.read && "bg-gradient-to-r from-blue-50/30 to-transparent dark:from-blue-900/10",
      className
    )} onClick={onSelect} role="button" tabIndex={0}>
      <div className="flex items-center space-x-4">
        {/* Selection checkbox */}
        <div className="shrink-0">
          <div className={cn(
            "w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600",
            "flex items-center justify-center transition-colors",
            selected && "bg-blue-500 border-blue-500"
          )}>
            {selected && <CheckCircle2 className="h-3 w-3 text-white" />}
          </div>
        </div>

        {/* Star */}
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 p-0 w-6 h-6 hover:bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            onStar?.();
          }}
        >
          <Star className={cn(
            "h-4 w-4 transition-colors",
            email.starred ? "text-yellow-500 fill-current" : "text-gray-400 hover:text-yellow-500"
          )} />
        </Button>

        {/* From user */}
        <div className="shrink-0">
          <GmailUserAvatar user={email.from} size="sm" />
        </div>

        {/* Email content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className={cn(
                  "font-medium truncate",
                  !email.read ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
                )}>
                  {email.from.name}
                </span>
                
                {/* Importance indicator */}
                {email.importance === 'high' && (
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                )}
                
                {/* Labels */}
                {email.labels && email.labels.length > 0 && (
                  <div className="flex space-x-1">
                    {email.labels.slice(0, 2).map((label, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                        {label}
                      </Badge>
                    ))}
                    {email.labels.length > 2 && (
                      <span className="text-xs text-gray-500">+{email.labels.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={cn(
                  "text-sm truncate",
                  !email.read ? "font-medium text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"
                )}>
                  {email.subject}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {email.preview}
                </span>
              </div>
            </div>
            
            {/* Right side info */}
            <div className="shrink-0 flex items-center space-x-3 ml-4">
              {/* Attachment indicator */}
              {email.hasAttachment && (
                <Paperclip className="h-4 w-4 text-gray-400" />
              )}
              
              {/* Timestamp */}
              <span className="text-sm text-gray-500 dark:text-gray-400 min-w-0">
                {email.timestamp}
              </span>
              
              {/* Action buttons (shown on hover) */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 w-8 h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive?.();
                  }}
                >
                  <Archive className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 w-8 h-8 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Gmail Inbox Layout Component
interface GmailInboxLayoutProps {
  emails: GmailEmail[];
  selectedEmails: string[];
  className?: string;
  onEmailSelect?: (emailId: string) => void;
  onEmailStar?: (emailId: string) => void;
  onEmailArchive?: (emailId: string) => void;
  onEmailDelete?: (emailId: string) => void;
}

export const GmailInboxLayout = memo(function GmailInboxLayout({
  emails,
  selectedEmails,
  className,
  onEmailSelect,
  onEmailStar,
  onEmailArchive,
  onEmailDelete
}: GmailInboxLayoutProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700",
      className
    )}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Inbox className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Inbox
              </h2>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {emails.filter(email => !email.read).length} new
            </Badge>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>
      
      {/* Email list */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {emails.map((email) => (
          <GmailEmailItem
            key={email.id}
            email={email}
            selected={selectedEmails.includes(email.id)}
            onSelect={() => onEmailSelect?.(email.id)}
            onStar={() => onEmailStar?.(email.id)}
            onArchive={() => onEmailArchive?.(email.id)}
            onDelete={() => onEmailDelete?.(email.id)}
          />
        ))}
      </div>
      
      {emails.length === 0 && (
        <div className="text-center py-12">
          <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No emails
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Your inbox is empty. New emails will appear here.
          </p>
        </div>
      )}
    </div>
  );
});

export const GmailComponents = {
  GmailUserAvatar,
  GmailUserCard,
  GmailEmailItem,
  GmailInboxLayout
};
