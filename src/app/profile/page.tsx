"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  LogOut,
  User2,
  Calendar,
  Trash2,
  Settings,
  Mail,
  Copy,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { UserProfile } from '@/components/user/user-profile';
import { formatRelativeTime } from '@/lib/user-profile';
import { PasswordConfirmation } from '@/components/auth/password-confirmation';
import { isEmailPasswordUser, isGoogleUser } from '@/lib/auth-utils';


export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();
  
  // State management
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!user) return null;

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
      // Redirect to home page after successful logout
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect to home even if logout fails
      router.push('/');
    }
  };

  const handleDeleteAccount = () => {
    // Close the first dialog and show password confirmation
    setShowDeleteDialog(false);
    setDeleteError(null);
    
    // For Google users or users who need reauthentication, show different flow
    if (user && (isGoogleUser(user) || !isEmailPasswordUser(user))) {
      // For Google users, show different confirmation
      setShowPasswordConfirmation(true);
    } else {
      // For email/password users, show password confirmation
      setShowPasswordConfirmation(true);
    }
  };

  const handlePasswordConfirm = async (password: string) => {
    if (!user) return;
    
    setDeleteLoading(true);
    setDeleteError(null);
    
    try {
      await deleteAccount(password);
      // Redirect to home page after successful account deletion
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

  const userCreationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime) : null;
  const lastSignInTime = user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;
  

  return (
    <AuthGuard>
      <FeaturePageLayout title="Profile">
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 md:space-y-10">
          {/* Enhanced Profile Header with Cover */}
          <Card className="group overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 ease-out">
            {/* Cover Section with Animated Gradient */}
            <div className="relative h-40 md:h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-indigo-700/90"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
              
              {/* Animated background elements */}
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-4 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute top-12 right-20 w-8 h-8 bg-purple-300/20 rounded-full blur-lg animate-bounce delay-300"></div>
                <div className="absolute bottom-8 left-12 w-12 h-12 bg-blue-300/15 rounded-full blur-lg animate-pulse delay-700"></div>
              </div>
            </div>
            
            <CardContent className="-mt-20 relative pt-24 pb-8 px-6 md:px-8">
              <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-10">
                {/* Enhanced Avatar with Status */}
                <div className="relative shrink-0 group/avatar">
                  <UserProfile 
                    user={user} 
                    size="xl" 
                    showName={false}
                    variant="glass"
                    showStatusDot={true}
                    className="ring-4 ring-white/70 dark:ring-gray-800/70 shadow-2xl hover:ring-6 hover:ring-blue-400/40 dark:hover:ring-purple-500/40 transition-all duration-300"
                  />
                  
                  {/* Status indicator with animation */}
                  <div className="absolute -bottom-2 -right-2 flex items-center justify-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-green-500 border-4 border-white dark:border-gray-800 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced User Info */}
                <div className="flex-1 text-center lg:text-left space-y-6 min-w-0 w-full">
                  {/* User Name with animation */}
                  <div className="space-y-3">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent mb-3 transition-all duration-300 hover:scale-105 transform-gpu">
                      {user.displayName || user.email?.split('@')[0] || 'User'}
                    </h1>
                    
                    {/* Provider and verification status */}
                    <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
                      {user.providerData?.length > 0 && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg transition-all duration-200">
                          <span className="mr-1">✨</span>
                          {user.providerData[0].providerId === 'google.com' ? 'Google Account' : user.providerData[0].providerId}
                        </Badge>
                      )}
                      
                      {user.emailVerified && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 shadow-lg transition-all duration-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified Account
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Email Section with enhanced styling */}
                  {user.email && (
                    <div className="space-y-3">
                      <div className="group p-4 rounded-xl bg-gradient-to-r from-gray-50/50 to-blue-50/30 dark:from-gray-800/30 dark:to-blue-900/20 border border-gray-200/50 dark:border-gray-700/30 hover:border-blue-300/50 dark:hover:border-blue-600/30 transition-all duration-300">
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 shadow-sm">
                              <Mail className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-medium break-all text-sm md:text-base">{user.email}</span>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(user.email!, 'email')}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-110 transition-all duration-200"
                            title="Copy email"
                          >
                            {copiedField === 'email' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 animate-bounce" />
                            ) : (
                              <Copy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* User Stats with enhanced cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userCreationTime && (
                      <div className="group p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200/50 dark:border-purple-700/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 shadow-sm">
                            <Calendar className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Member Since</p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatRelativeTime(userCreationTime)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {lastSignInTime && (
                      <div className="group p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 shadow-sm">
                            <Activity className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Last Active</p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatRelativeTime(lastSignInTime)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* User ID with enhanced styling */}
                  <div className="flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50/80 to-slate-50/80 dark:from-gray-800/50 dark:to-slate-800/50 border border-gray-200/50 dark:border-gray-700/30">
                    <div className="p-1.5 rounded-md bg-gradient-to-r from-gray-600 to-slate-700 shadow-sm">
                      <User2 className="h-3 w-3 text-white" />
                    </div>
                    <code className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 px-3 py-1.5 rounded-lg font-mono text-xs text-gray-700 dark:text-gray-300 shadow-sm">
                      {user.uid.slice(0, 12)}...{user.uid.slice(-8)}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(user.uid, 'uid')}
                      className="h-7 w-7 p-0 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-110 transition-all duration-200"
                      title="Copy User ID"
                    >
                      {copiedField === 'uid' ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600 animate-bounce" />
                      ) : (
                        <Copy className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Section with enhanced design */}
          <Card className="group border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-4 text-xl">
                <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Account Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sign Out Button */}
                <div className="group/button relative overflow-hidden">
                  <Button 
                    onClick={handleLogout}
                    className="w-full justify-start gap-4 h-14 text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200/50 hover:from-amber-100 hover:to-orange-100 hover:border-amber-300 hover:shadow-lg hover:scale-105 dark:text-amber-300 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800/50 dark:hover:from-amber-950/50 dark:hover:to-orange-950/50 transition-all duration-300 font-medium"
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm">
                      <LogOut className="h-4 w-4 text-white" />
                    </div>
                    <span>Sign Out Safely</span>
                  </Button>
                </div>
                
                {/* Delete Account Button */}
                <div className="group/button relative overflow-hidden">
                  <Button 
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full justify-start gap-4 h-14 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
                  >
                    <div className="p-2 rounded-lg bg-red-700/30 shadow-sm">
                      <Trash2 className="h-4 w-4" />
                    </div>
                    <span>Delete Account</span>
                  </Button>
                </div>
              </div>
              
              {/* Warning note */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200/50 dark:border-yellow-700/30">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">⚠️</span>
                  <span>Account actions are permanent. Make sure you want to proceed before clicking any buttons above.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </FeaturePageLayout>
      {/* Delete Account Confirmation Dialog */}
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
