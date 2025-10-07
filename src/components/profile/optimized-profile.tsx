"use client";

import '../../styles/profile-animations.css';
import { useState, useMemo, useCallback, memo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LogOut,
  User2,
  Calendar,
  Trash2,
  Mail,
  Copy,
  CheckCircle2,
  Activity,
  Edit,
  MoreVertical,
  Settings,
  Bell,
  Lock,
  Star,
  Crown,
  Shield,
  Zap,
  Award,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '@/components/user/user-profile';
import { formatRelativeTime } from '@/lib/user-profile';
import { PasswordConfirmation } from '@/components/auth/password-confirmation';
import { isEmailPasswordUser, isGoogleUser } from '@/lib/auth-utils';
import { ProfileEditorDialog } from '@/components/user/profile-editor-dialog';
import { cn } from '@/lib/utils';

// Animation variants
const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.95,
    transition: { duration: 0.3, ease: "easeIn" }
  }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

// Memoized components for better performance
const StatCard = memo(({ icon: Icon, label, value, isLoading = false }: {
  icon: any;
  label: string;
  value: string;
  isLoading?: boolean;
}) => (
  <motion.div
    variants={fadeInUp}
    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200/50 dark:border-gray-700/30 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
  >
    <div className="flex items-center gap-3">
      <div className="shrink-0 p-2 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 dark:from-gray-600 dark:to-gray-800 shadow-sm group-hover:shadow-md transition-shadow">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">
          {label}
        </p>
        {isLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {value}
          </p>
        )}
      </div>
    </div>
    
    {/* Hover effect overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  </motion.div>
));

const ActionButton = memo(({ 
  onClick, 
  icon: Icon, 
  title, 
  variant = "default", 
  isLoading = false 
}: {
  onClick: () => void;
  icon: any;
  title: string;
  variant?: "default" | "danger";
  isLoading?: boolean;
}) => {
  const baseClasses = "w-full justify-start gap-4 h-14 font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]";
  const variantClasses = variant === "danger" 
    ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 shadow-lg hover:shadow-xl"
    : "text-gray-800 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border border-gray-300/50 hover:border-gray-400/50 hover:shadow-lg dark:text-gray-200 dark:from-gray-800 dark:to-gray-900 dark:hover:from-gray-700 dark:hover:to-gray-800 dark:border-gray-700/50 dark:hover:border-gray-600/50";

  return (
    <motion.div 
      variants={fadeInUp}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button 
        onClick={onClick}
        disabled={isLoading}
        className={cn(baseClasses, variantClasses)}
      >
        <div className={cn(
          "p-2 rounded-lg shadow-sm",
          variant === "danger" 
            ? "bg-red-800/50" 
            : "bg-gray-700 dark:bg-gray-600"
        )}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span>{title}</span>
        {isLoading && (
          <div className="ml-auto">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </Button>
    </motion.div>
  );
});

const CopyableField = memo(({ 
  value, 
  field, 
  icon: Icon, 
  copiedField, 
  onCopy 
}: {
  value: string;
  field: string;
  icon: any;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) => (
  <motion.div 
    variants={fadeInUp}
    className="group flex items-center justify-center lg:justify-start gap-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200/50 dark:border-gray-700/30 hover:shadow-md transition-all duration-300"
  >
    <div className="p-2 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 shadow-sm">
      <Icon className="h-3 w-3 text-white" />
    </div>
    <code className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg font-mono text-xs text-gray-700 dark:text-gray-300 shadow-inner border border-gray-200 dark:border-gray-700 flex-1 truncate">
      {value}
    </code>
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => onCopy(value, field)}
      className="h-8 w-8 p-0 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-110 transition-all duration-200"
      title={`Copy ${field}`}
    >
      <AnimatePresence mode="wait">
        {copiedField === field ? (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.2 }}
          >
            <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Copy className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  </motion.div>
));

// Loading skeleton component
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-black">
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <Card className="relative overflow-hidden border border-gray-200/50 dark:border-gray-800/50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl shadow-2xl rounded-3xl">
        <div className="h-40 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800" />
        <div className="relative px-6 lg:px-8 pb-8 pt-4">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 -mt-12 mb-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
);

export const OptimizedProfile = memo(function OptimizedProfile() {
  const router = useRouter();
  const { user, logout, deleteAccount, loading } = useAuth();
  
  // State management with useCallback for performance
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Memoized user data computation
  const userData = useMemo(() => {
    if (!user) return null;
    
    const userCreationTime = user.created_at ? new Date(user.created_at) : null;
    const lastSignInTime = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    const userInitials = displayName.charAt(0).toUpperCase() + (displayName.split(' ')[1]?.charAt(0)?.toUpperCase() || '');
    
    const accountAgeInDays = userCreationTime ? Math.floor((Date.now() - userCreationTime.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const isNewUser = accountAgeInDays < 7;
    const isPremiumUser = user.email?.includes('premium') || false;
    
    return {
      displayName,
      userInitials,
      userCreationTime,
      lastSignInTime,
      accountAgeInDays,
      isNewUser,
      isPremiumUser,
      provider: user.app_metadata?.provider,
      isEmailConfirmed: !!user.email_confirmed_at
    };
  }, [user]);

  // Memoized event handlers
  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/');
    }
  }, [logout, router]);

  const handleDeleteAccount = useCallback(() => {
    setShowDeleteDialog(false);
    setDeleteError(null);
    setShowPasswordConfirmation(true);
  }, []);

  const handlePasswordConfirm = useCallback(async (password: string) => {
    if (!user) return;
    
    setDeleteLoading(true);
    setDeleteError(null);
    
    try {
      await deleteAccount(); // The auth context doesn't need the password
      router.push('/');
    } catch (error: unknown) {
      console.error('Delete account failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account. Please try again.';
      setDeleteError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  }, [user, deleteAccount, router]);

  const handlePasswordConfirmationClose = useCallback(() => {
    setShowPasswordConfirmation(false);
    setDeleteError(null);
    setDeleteLoading(false);
  }, []);

  // Loading state
  if (loading || !user || !userData) {
    return <ProfileSkeleton />;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-950 dark:via-blue-950/10 dark:to-purple-950/10"
    >
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Enhanced Header with Floating Card Design */}
        <motion.div variants={cardVariants} className="relative">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl" />
          
          {/* Main Header Card */}
          <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shadow-2xl rounded-3xl">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            </div>
            
            {/* Cover Section */}
            <div className="relative h-32 md:h-40 bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
              {/* Animated Orbs */}
              <div className="absolute inset-0">
                <motion.div 
                  className="absolute top-4 left-8 w-20 h-20 bg-white/10 rounded-full blur-xl"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
                <motion.div 
                  className="absolute bottom-4 right-8 w-16 h-16 bg-white/5 rounded-full blur-lg"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: 1
                  }}
                />
              </div>
              
              {/* Settings Menu */}
              <div className="absolute top-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm transition-all duration-200"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Account Settings</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Lock className="mr-2 h-4 w-4" />
                      Privacy
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)} 
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Profile Info */}
            <CardContent className="relative px-6 lg:px-8 pb-8 pt-4">
              <motion.div 
                variants={staggerChildren}
                className="flex flex-col lg:flex-row items-center lg:items-start gap-6 -mt-12 mb-6"
              >
                {/* Enhanced Avatar */}
                <motion.div variants={fadeInUp} className="relative shrink-0 group">
                  <div className="relative">
                    <UserProfile 
                      user={user} 
                      size="xl" 
                      showName={false}
                      variant="glass"
                      showStatusDot={true}
                      className="ring-4 ring-white/70 dark:ring-gray-800/70 shadow-2xl hover:ring-6 hover:ring-blue-400/40 dark:hover:ring-purple-500/40 transition-all duration-300"
                    />
                    
                    {/* Status Indicator */}
                    <motion.div 
                      className="absolute -bottom-2 -right-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 border-4 border-white dark:border-gray-800 rounded-full shadow-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
                
                {/* Enhanced User Info */}
                <motion.div 
                  variants={staggerChildren}
                  className="flex-1 text-center lg:text-left space-y-6 min-w-0 w-full"
                >
                  {/* User Name with Gradient */}
                  <motion.div variants={fadeInUp} className="space-y-3">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                      {userData.displayName}
                    </h1>
                    
                    {/* Enhanced Badges */}
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                      <AnimatePresence>
                        {userData.provider && (
                          <motion.div
                            key="provider-badge"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg transition-all duration-200">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {userData.provider === 'google' ? 'Google Account' : userData.provider}
                            </Badge>
                          </motion.div>
                        )}
                        
                        {userData.isEmailConfirmed && (
                          <motion.div
                            key="verified-badge"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Badge className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 shadow-lg transition-all duration-200">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          </motion.div>
                        )}
                        
                        {userData.isNewUser && (
                          <motion.div
                            key="new-member-badge"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg transition-all duration-200 animate-pulse">
                              <Star className="h-3 w-3 mr-1" />
                              New Member
                            </Badge>
                          </motion.div>
                        )}
                        
                        {userData.isPremiumUser && (
                          <motion.div
                            key="premium-badge"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 shadow-lg transition-all duration-200">
                              <Crown className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                  
                  {/* Email Section */}
                  {user.email && (
                    <motion.div variants={fadeInUp} className="space-y-3">
                      <div className="group p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200/50 dark:border-gray-700/30 hover:shadow-lg transition-all duration-300">
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm">
                              <Mail className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-medium break-all text-sm md:text-base">{user.email}</span>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(user.email!, 'email')}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-110 transition-all duration-200"
                            title="Copy email"
                          >
                            <AnimatePresence mode="wait">
                              {copiedField === 'email' ? (
                                <motion.div
                                  key="check"
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 180 }}
                                >
                                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="copy"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* User Stats */}
                  <motion.div 
                    variants={staggerChildren}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {userData.userCreationTime && (
                      <StatCard
                        icon={Calendar}
                        label="Member Since"
                        value={formatRelativeTime(userData.userCreationTime)}
                      />
                    )}
                    
                    {userData.lastSignInTime && (
                      <StatCard
                        icon={Activity}
                        label="Last Active"
                        value={formatRelativeTime(userData.lastSignInTime)}
                      />
                    )}
                  </motion.div>
                  
                  {/* User ID */}
                  <CopyableField
                    value={`${user.id.slice(0, 12)}...${user.id.slice(-8)}`}
                    field="uid"
                    icon={User2}
                    copiedField={copiedField}
                    onCopy={() => copyToClipboard(user.id, 'uid')}
                  />
                </motion.div>
                
                {/* Action Button */}
                <motion.div variants={fadeInUp} className="shrink-0">
                  <ProfileEditorDialog 
                    trigger={
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    }
                  />
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Account Actions Section */}
        <motion.div variants={cardVariants}>
          <Card className="border-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-600 dark:to-gray-700 shadow-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">Account Actions</span>
              </motion.div>
              
              <motion.div 
                variants={staggerChildren}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <ActionButton
                  onClick={handleLogout}
                  icon={LogOut}
                  title="Sign Out Safely"
                  variant="default"
                />
                
                <ActionButton
                  onClick={() => setShowDeleteDialog(true)}
                  icon={Trash2}
                  title="Delete Account"
                  variant="danger"
                />
              </motion.div>
              
              {/* Enhanced Warning Note */}
              <motion.div 
                variants={fadeInUp}
                className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-700/30"
              >
                <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">⚠️</span>
                  <span>Account actions are permanent and cannot be undone. Please proceed with caution.</span>
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

      </div>

      {/* Delete Account Dialog */}
      <AnimatePresence>
        {showDeleteDialog && (
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center space-x-2">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  <span>Delete Account</span>
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to permanently delete your account? This action cannot be undone. 
                  All your data will be permanently removed from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </AnimatePresence>
      
      {/* Password Confirmation Dialog */}
      <PasswordConfirmation
        isOpen={showPasswordConfirmation}
        onClose={handlePasswordConfirmationClose}
        onConfirm={handlePasswordConfirm}
        title="Confirm Account Deletion"
        description="This action cannot be undone. Please enter your password to permanently delete your account."
        confirmButtonText="Delete Account"
        isLoading={deleteLoading}
        error={deleteError}
        isGoogleUser={user ? isGoogleUser(user) : false}
      />
    </motion.div>
  );
});

export default OptimizedProfile;