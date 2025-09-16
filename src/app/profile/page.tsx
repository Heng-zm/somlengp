"use client";

import '../../styles/patterns.css';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
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
  Shield,
  Camera,
  Edit,
  UserCog,
  FileText,
  User,
  MoreVertical,
  Settings,
  Bell,
  Lock,
  Palette,
  Globe,
  Smartphone,
  CreditCard,
  Heart,
  Star,
  Zap,
  Award,
  Crown
} from 'lucide-react';
import { UserProfile } from '@/components/user/user-profile';
import { formatRelativeTime } from '@/lib/user-profile';
import { PasswordConfirmation } from '@/components/auth/password-confirmation';
import { isEmailPasswordUser, isGoogleUser } from '@/lib/auth-utils';
import { ProfileEditorDialog } from '@/components/user/profile-editor-dialog';

export default function EnhancedProfilePage() {
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();
  
  // State management
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Memoized user data
  const userData = useMemo(() => {
    if (!user) return null;
    
    const userCreationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime) : null;
    const lastSignInTime = user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;
    const displayName = user.displayName || user.email?.split('@')[0] || 'User';
    const userInitials = displayName.charAt(0).toUpperCase() + (displayName.split(' ')[1]?.charAt(0)?.toUpperCase() || '');
    
    // Account age calculation
    const accountAgeInDays = userCreationTime ? Math.floor((Date.now() - userCreationTime.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const isNewUser = accountAgeInDays < 7;
    const isPremiumUser = user.email?.includes('premium') || false; // Demo logic
    
    return {
      displayName,
      userInitials,
      userCreationTime,
      lastSignInTime,
      accountAgeInDays,
      isNewUser,
      isPremiumUser
    };
  }, [user]);

  if (!user || !userData) return null;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/');
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(false);
    setDeleteError(null);
    
    if (user && (isGoogleUser(user) || !isEmailPasswordUser(user))) {
      setShowPasswordConfirmation(true);
    } else {
      setShowPasswordConfirmation(true);
    }
  };

  const handlePasswordConfirm = async (password: string) => {
    if (!user) return;
    
    setDeleteLoading(true);
    setDeleteError(null);
    
    try {
      await deleteAccount(password);
      router.push('/');
    } catch (error: unknown) {
      console.error('Delete account failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account. Please try again.';
      setDeleteError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePasswordConfirmationClose = () => {
    setShowPasswordConfirmation(false);
    setDeleteError(null);
    setDeleteLoading(false);
  };

  return (
    <AuthGuard>
      <FeaturePageLayout title="Profile">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-black">
          <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            
            {/* Enhanced Header with Floating Card Design */}
            <div className="relative">
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-600/10 to-gray-800/10 rounded-3xl blur-3xl"></div>
              
              {/* Main Header Card */}
              <Card className="relative overflow-hidden border border-gray-200/50 dark:border-gray-800/50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl shadow-2xl rounded-3xl">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-800"></div>
                  <div className="absolute inset-0 bg-pattern animate-pulse"></div>
                </div>
                
                {/* Cover Section */}
                <div className="relative h-32 md:h-40 bg-gradient-to-br from-gray-800 to-black overflow-hidden">
                  {/* Animated Elements */}
                  <div className="absolute inset-0">
                    <div className="absolute top-4 left-8 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
                    <div className="absolute bottom-4 right-8 w-16 h-16 bg-white/5 rounded-full blur-lg animate-pulse delay-300"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse delay-700"></div>
                  </div>
                  
                  {/* Settings Menu */}
                  <div className="absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
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
                        <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 dark:text-red-400">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Profile Info */}
                <div className="relative px-6 lg:px-8 pb-8 pt-4">
                  {/* Profile Picture and Enhanced Info */}
                  <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 -mt-12 mb-6">
                    {/* Enhanced Avatar with UserProfile */}
                    <div className="relative shrink-0 group/avatar">
                      <UserProfile 
                        user={user} 
                        size="xl" 
                        showName={false}
                        variant="glass"
                        showStatusDot={true}
                        className="ring-4 ring-white/70 dark:ring-gray-800/70 shadow-2xl hover:ring-6 hover:ring-blue-400/40 dark:hover:ring-purple-500/40 transition-all duration-300"
                      />
                      
                      {/* Enhanced Status indicator with animation */}
                      <div className="absolute -bottom-2 -right-2 flex items-center justify-center">
                        <div className="w-10 h-10 bg-gray-800 dark:bg-gray-600 border-4 border-white dark:border-gray-800 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200">
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced User Info */}
                    <div className="flex-1 text-center lg:text-left space-y-6 min-w-0 w-full">
                      {/* User Name with animation */}
                      <div className="space-y-3">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-black to-gray-800 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-3 transition-all duration-300 hover:scale-105 transform-gpu">
                          {userData.displayName}
                        </h1>
                        
                        {/* Provider and verification status */}
                        <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
                          {user.providerData?.length > 0 && (
                            <Badge className="bg-black hover:bg-gray-800 text-white border-0 shadow-lg transition-all duration-200">
                              <span className="mr-1">✨</span>
                              {user.providerData[0].providerId === 'google.com' ? 'Google Account' : user.providerData[0].providerId}
                            </Badge>
                          )}
                          
                          {user.emailVerified && (
                            <Badge className="bg-gray-800 hover:bg-gray-700 text-white border-0 shadow-lg transition-all duration-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified Account
                            </Badge>
                          )}

                          {userData.isNewUser && (
                            <Badge className="bg-gray-600 hover:bg-gray-500 text-white border-0 shadow-md hover:shadow-lg transition-shadow animate-pulse">
                              <Star className="h-3 w-3 mr-1" />
                              New Member
                            </Badge>
                          )}

                          {userData.isPremiumUser && (
                            <Badge className="bg-gray-900 hover:bg-gray-800 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
                              <Crown className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Email Section with enhanced styling */}
                      {user.email && (
                        <div className="space-y-3">
                          <div className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/30 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300">
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                <div className="p-2 rounded-lg bg-gray-800 dark:bg-gray-600 shadow-sm">
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
                                {copiedField === 'email' ? (
                                  <CheckCircle2 className="h-4 w-4 text-gray-800 dark:text-gray-200 animate-bounce" />
                                ) : (
                                  <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* User Stats with enhanced cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {userData.userCreationTime && (
                          <div className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gray-800 dark:bg-gray-600 shadow-sm">
                                <Calendar className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Member Since</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatRelativeTime(userData.userCreationTime)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {userData.lastSignInTime && (
                          <div className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gray-700 dark:bg-gray-600 shadow-sm">
                                <Activity className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Last Active</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatRelativeTime(userData.lastSignInTime)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* User ID with enhanced styling */}
                      <div className="flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/30">
                        <div className="p-1.5 rounded-md bg-gray-700 dark:bg-gray-600 shadow-sm">
                          <User2 className="h-3 w-3 text-white" />
                        </div>
                        <code className="bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg font-mono text-xs text-gray-700 dark:text-gray-300 shadow-sm">
                          {user.uid.slice(0, 12)}...{user.uid.slice(-8)}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyToClipboard(user.uid, 'uid')}
                          className="h-7 w-7 p-0 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-110 transition-all duration-200"
                          title="Copy User ID"
                        >
                          {copiedField === 'uid' ? (
                            <CheckCircle2 className="h-3 w-3 text-gray-800 dark:text-gray-200 animate-bounce" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="shrink-0">
                      <ProfileEditorDialog 
                        trigger={
                          <Button className="bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Enhanced Account Actions Section */}
            <Card className="border border-gray-200/50 dark:border-gray-800/50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl shadow-xl">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-2 rounded-xl bg-gray-800 dark:bg-gray-600 shadow-lg">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">Account Actions</span>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sign Out Button */}
                  <div className="group/button relative overflow-hidden">
                    <Button 
                      onClick={handleLogout}
                      className="w-full justify-start gap-4 h-14 text-gray-800 bg-gray-100 border border-gray-300 hover:bg-gray-200 hover:border-gray-400 hover:shadow-lg hover:scale-105 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:border-gray-600 transition-all duration-300 font-medium"
                    >
                      <div className="p-2 rounded-lg bg-gray-700 dark:bg-gray-600 shadow-sm">
                        <LogOut className="h-4 w-4 text-white" />
                      </div>
                      <span>Sign Out Safely</span>
                    </Button>
                  </div>
                  
                  {/* Delete Account Button */}
                  <div className="group/button relative overflow-hidden">
                    <Button 
                      onClick={() => setShowDeleteDialog(true)}
                      className="w-full justify-start gap-4 h-14 bg-gray-900 hover:bg-black text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
                    >
                      <div className="p-2 rounded-lg bg-gray-700 shadow-sm">
                        <Trash2 className="h-4 w-4 text-white" />
                      </div>
                      <span>Delete Account</span>
                    </Button>
                  </div>
                </div>
                
                {/* Warning note */}
                <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-gray-600 dark:text-gray-400 mt-0.5">⚠️</span>
                    <span>Account actions are permanent. Make sure you want to proceed before clicking any buttons above.</span>
                  </p>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </FeaturePageLayout>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <span>Delete Account</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete your account? This action cannot be undone. All your data will be permanently removed from our servers.
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
    </AuthGuard>
  );
}