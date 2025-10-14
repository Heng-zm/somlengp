"use client";

import { memo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe, 
  Star,
  MessageCircle,
  UserPlus,
  Settings,
  Shield,
  Crown,
  Heart,
  Share,
  MoreVertical,
  Edit,
  Camera,
  CheckCircle,
  Clock,
  Briefcase,
  GraduationCap,
  Award,
  Link2,
  Building
} from 'lucide-react';

export interface GmailUserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  company?: string;
  position?: string;
  education?: string;
  joinDate?: string;
  lastActive?: string;
  verified?: boolean;
  premium?: boolean;
  online?: boolean;
  stats?: {
    emails: number;
    contacts: number;
    folders: number;
  };
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

// Gmail Profile Header Component
interface GmailProfileHeaderProps {
  profile: GmailUserProfile;
  isOwnProfile?: boolean;
  className?: string;
  onEdit?: () => void;
  onMessage?: () => void;
  onFollow?: () => void;
}

export const GmailProfileHeader = memo(function GmailProfileHeader({
  profile,
  isOwnProfile = false,
  className,
  onEdit,
  onMessage,
  onFollow
}: GmailProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  
  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    onFollow?.();
  };

  return (
    <Card className={cn(
      "overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30",
      "dark:from-gray-900 dark:to-blue-900/10",
      className
    )}>
      {/* Cover Image */}
      <div className="relative h-32 md:h-40 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 overflow-hidden">
        {profile.coverImage && (
          <img 
            src={profile.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        
        {/* Cover Actions */}
        {isOwnProfile && (
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              className="bg-black/20 hover:bg-black/30 text-white backdrop-blur-sm"
            >
              <Camera className="h-4 w-4 mr-2" />
              Edit Cover
            </Button>
          </div>
        )}
        
        {/* Premium Badge */}
        {profile.premium && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-0">
        <div className="px-6 pb-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between -mt-16 md:-mt-12 mb-6">
            <div className="flex items-end space-x-4">
              <div className="relative">
                <Avatar className="h-24 w-24 md:h-28 md:w-28 ring-4 ring-white dark:ring-gray-900 shadow-xl">
                  <AvatarImage 
                    src={profile.avatar} 
                    alt={profile.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-2xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Online Status */}
                {profile.online && (
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full ring-4 ring-white dark:ring-gray-900" />
                )}
                
                {/* Verification Badge */}
                {profile.verified && (
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                )}
                
                {isOwnProfile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute bottom-0 right-0 w-8 h-8 p-0 bg-gray-900/80 hover:bg-gray-900 text-white rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2 mt-4 md:mt-0">
              {isOwnProfile ? (
                <>
                  <Button variant="outline" onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleFollow}
                    className={cn(
                      "transition-all duration-200",
                      isFollowing && "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    {isFollowing ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button onClick={onMessage}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Profile Information */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {profile.name}
              </h1>
              {profile.position && profile.company && (
                <p className="text-lg text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                  <Briefcase className="h-4 w-4" />
                  {profile.position} at {profile.company}
                </p>
              )}
            </div>
            
            {profile.bio && (
              <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                {profile.bio}
              </p>
            )}
            
            {/* Contact Information */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>{profile.email}</span>
              </div>
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1">
                  <Link2 className="h-4 w-4" />
                  <a href={profile.website} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {profile.joinDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {profile.joinDate}</span>
                </div>
              )}
            </div>
            
            {/* Social Links */}
            {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
              <div className="flex space-x-3">
                {profile.socialLinks.facebook && (
                  <a
                    href={profile.socialLinks.facebook}
                    className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  >
                    f
                  </a>
                )}
                {profile.socialLinks.twitter && (
                  <a
                    href={profile.socialLinks.twitter}
                    className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                  >
                    𝕏
                  </a>
                )}
                {profile.socialLinks.linkedin && (
                  <a
                    href={profile.socialLinks.linkedin}
                    className="w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors"
                  >
                    in
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Gmail Profile Stats Component
interface GmailProfileStatsProps {
  profile: GmailUserProfile;
  className?: string;
}

export const GmailProfileStats = memo(function GmailProfileStats({
  profile,
  className
}: GmailProfileStatsProps) {
  const stats = profile.stats || { emails: 0, contacts: 0, folders: 0 };
  
  return (
    <Card className={cn("border-0 shadow-lg", className)}>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Activity Overview
        </h3>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.emails.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Emails</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.contacts.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Contacts</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Building className="h-6 w-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.folders}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Folders</p>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Recent Activity</h4>
            {profile.lastActive && (
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-3 w-3" />
                <span>Active {profile.lastActive}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-900 dark:text-gray-100">Sent 3 emails</p>
                <p className="text-gray-500 dark:text-gray-400">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-gray-900 dark:text-gray-100">Added 2 new contacts</p>
                <p className="text-gray-500 dark:text-gray-400">Yesterday</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Gmail Profile Card (Compact Version)
interface GmailProfileCardProps {
  profile: GmailUserProfile;
  variant?: 'compact' | 'detailed' | 'minimal';
  showStats?: boolean;
  className?: string;
  onClick?: () => void;
}

export const GmailProfileCard = memo(function GmailProfileCard({
  profile,
  variant = 'compact',
  showStats = false,
  className,
  onClick
}: GmailProfileCardProps) {
  if (variant === 'minimal') {
    return (
      <div className={cn(
        "group cursor-pointer p-4 rounded-lg border border-gray-200 dark:border-gray-700",
        "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800",
        "hover:shadow-md transition-all duration-200 ease-out",
        className
      )} onClick={onClick} role="button" tabIndex={0}>
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 ring-2 ring-gray-200/50 dark:ring-gray-700/50 group-hover:ring-blue-400/50 transition-all duration-200">
            <AvatarImage src={profile.avatar} alt={profile.name} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
              {profile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {profile.name}
              </p>
              {profile.verified && (
                <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
              )}
              {profile.premium && (
                <Crown className="h-4 w-4 text-amber-500 shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {profile.email}
            </p>
          </div>
          
          {profile.online && (
            <div className="w-3 h-3 bg-green-500 rounded-full shrink-0" />
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "group cursor-pointer border-0 shadow-lg bg-white dark:bg-gray-900",
      "hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out",
      "overflow-hidden",
      className
    )} onClick={onClick}>
      {/* Header Gradient */}
      <div className="h-16 bg-gradient-to-r from-blue-600 to-purple-600 relative">
        {profile.premium && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-6 -mt-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-4 ring-white dark:ring-gray-900 shadow-lg">
                <AvatarImage src={profile.avatar} alt={profile.name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {profile.online && (
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
              )}
              
              {profile.verified && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {profile.name}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {profile.email}
              </p>
              {profile.position && (
                <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1 mt-1">
                  <Briefcase className="h-3 w-3" />
                  {profile.position}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {profile.bio && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
            {profile.bio}
          </p>
        )}
        
        {showStats && profile.stats && (
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {profile.stats.emails}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Emails</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {profile.stats.contacts}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Contacts</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {profile.stats.folders}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Folders</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export const GmailUserProfiles = {
  GmailProfileHeader,
  GmailProfileStats,
  GmailProfileCard
};
