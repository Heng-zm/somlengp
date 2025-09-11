"use client";

import '../../styles/patterns.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { Card } from '@/components/ui/card';
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
  Mail,
  Copy,
  CheckCircle2,
  Activity,
  Shield,
  Camera,
  Edit,
  UserCog,
  FileText,
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
  // Removed tab state management as navigation tabs have been removed

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
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
          {/* Profile Header with Cover Photo */}
          <div className="rounded-3xl overflow-hidden bg-white dark:bg-gray-950 shadow-xl">
            {/* Cover Photo with Edit Button */}
            <div className="relative h-48 md:h-64 lg:h-80 bg-gradient-to-r from-mono-gray-900 via-mono-gray-800 to-mono-gray-700 overflow-hidden">
              <div className="absolute inset-0 bg-pattern opacity-5"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-mono-black/60 via-transparent to-mono-black/20"></div>
              
              {/* Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-mono-white/5 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-mono-gray/10 rounded-full blur-xl animate-pulse delay-300"></div>
                <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-mono-white/3 rounded-full blur-xl animate-pulse delay-700"></div>
              </div>
              
              {/* Edit Cover Photo Button */}
              <div className="absolute top-4 right-4 z-10">
                <Button variant="secondary" size="sm" className="bg-mono-white/20 backdrop-blur-md hover:bg-mono-white/30 transition-all duration-200 text-mono-white border-mono-white/30">
                  <Camera className="h-4 w-4 mr-2" />
                  Edit Cover
                </Button>
              </div>
            </div>
            
            {/* Profile Info Section */}
            <div className="relative px-6 lg:px-8 pb-8 bg-white dark:bg-gray-950">
              {/* Profile Picture with Edit Option */}
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20 mb-6">
                <div className="relative group">
                  <div className="relative">
                    <UserProfile 
                      user={user} 
                      size="xl" 
                      showName={false}
                      variant="glass"
                      showStatusDot={true}
                      className="ring-4 ring-white dark:ring-gray-900 shadow-xl group-hover:ring-opacity-75 transition-all duration-300"
                    />
                    
                    {/* Online Status Indicator */}
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-mono-gray-700 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center shadow-lg">
                      <div className="w-3 h-3 bg-mono-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Hover Edit Button */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                      <Edit className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* User Name and Badges */}
                <div className="flex-1 text-center md:text-left space-y-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </h1>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    {user.providerData?.length > 0 && (
                      <Badge className="bg-mono-gray-800 text-mono-white border-0 shadow-sm py-1.5 hover:bg-mono-gray-700 transition-colors">
                        <span className="mr-1">✨</span>
                        {user.providerData[0].providerId === 'google.com' ? 'Google Account' : user.providerData[0].providerId}
                      </Badge>
                    )}
                    
                    {user.emailVerified && (
                      <Badge className="bg-mono-black text-mono-white border-0 shadow-sm py-1.5 hover:bg-mono-gray-900 transition-colors">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified Account
                      </Badge>
                    )}
                    
                    <Badge className="bg-mono-gray-600 text-mono-white border-0 shadow-sm py-1.5 hover:bg-mono-gray-500 transition-colors">
                      <User2 className="h-3 w-3 mr-1" />
                      Active User
                    </Badge>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="hidden md:flex gap-2">
                  <Button variant="outline" size="sm" className="h-9 shadow-sm border-gray-200 dark:border-gray-800">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
              
              {/* User Email Display */}
              {user.email && (
                <div className="max-w-3xl mx-auto md:mx-0 mb-6">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                    <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="flex-1 font-medium text-gray-700 dark:text-gray-300 text-sm">{user.email}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(user.email!, 'email')}
                      className="h-8 w-8 p-0 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
                    >
                      {copiedField === 'email' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* User Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto md:mx-0 mb-6">
                {userCreationTime && (
                  <div className="p-4 rounded-xl bg-mono-gray-50 dark:bg-mono-gray-900 border border-mono-gray-200 dark:border-mono-gray-800 hover:border-mono-gray-300 dark:hover:border-mono-gray-700 transition-all duration-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-mono-gray-200 dark:bg-mono-gray-800">
                        <Calendar className="h-4 w-4 text-mono-gray-700 dark:text-mono-gray-300" />
                      </div>
                      <span className="text-xs text-mono-gray-500 dark:text-mono-gray-400 uppercase font-medium">Member Since</span>
                    </div>
                    <p className="text-sm font-semibold text-mono-gray-900 dark:text-mono-white">{formatRelativeTime(userCreationTime)}</p>
                  </div>
                )}
                
                {lastSignInTime && (
                  <div className="p-4 rounded-xl bg-mono-gray-50 dark:bg-mono-gray-900 border border-mono-gray-200 dark:border-mono-gray-800 hover:border-mono-gray-300 dark:hover:border-mono-gray-700 transition-all duration-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-mono-gray-200 dark:bg-mono-gray-800">
                        <Activity className="h-4 w-4 text-mono-gray-700 dark:text-mono-gray-300" />
                      </div>
                      <span className="text-xs text-mono-gray-500 dark:text-mono-gray-400 uppercase font-medium">Last Active</span>
                    </div>
                    <p className="text-sm font-semibold text-mono-gray-900 dark:text-mono-white">{formatRelativeTime(lastSignInTime)}</p>
                  </div>
                )}
                
                <div className="p-4 rounded-xl bg-mono-gray-50 dark:bg-mono-gray-900 border border-mono-gray-200 dark:border-mono-gray-800 hover:border-mono-gray-300 dark:hover:border-mono-gray-700 transition-all duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-mono-gray-200 dark:bg-mono-gray-800">
                      <FileText className="h-4 w-4 text-mono-gray-700 dark:text-mono-gray-300" />
                    </div>
                    <span className="text-xs text-mono-gray-500 dark:text-mono-gray-400 uppercase font-medium">Sessions</span>
                  </div>
                  <p className="text-sm font-semibold text-mono-gray-900 dark:text-mono-white">12 active</p>
                </div>
                
                <div className="p-4 rounded-xl bg-mono-gray-50 dark:bg-mono-gray-900 border border-mono-gray-200 dark:border-mono-gray-800 hover:border-mono-gray-300 dark:hover:border-mono-gray-700 transition-all duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-mono-gray-200 dark:bg-mono-gray-800">
                      <UserCog className="h-4 w-4 text-mono-gray-700 dark:text-mono-gray-300" />
                    </div>
                    <span className="text-xs text-mono-gray-500 dark:text-mono-gray-400 uppercase font-medium">Status</span>
                  </div>
                  <p className="text-sm font-semibold text-mono-gray-900 dark:text-mono-white">Active</p>
                </div>
              </div>
              
              {/* User ID Display */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 max-w-lg">
                <User2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">User ID:</span>
                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono text-gray-700 dark:text-gray-300 flex-1">
                  {user.uid.slice(0, 10)}...{user.uid.slice(-6)}
                </code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard(user.uid, 'uid')}
                  className="h-6 w-6 p-0 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
                >
                  {copiedField === 'uid' ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Profile Tabs and Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card className="shadow-md overflow-hidden border-0 bg-white dark:bg-gray-950">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Account Settings</h3>
                </div>
                <nav className="p-2">
                  <ul className="space-y-1">
                    <li>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-left text-mono-gray-700 dark:text-mono-gray-300 hover:bg-mono-gray-100 dark:hover:bg-mono-gray-800"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </Button>
                    </li>
                    <li>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-left text-mono-gray-800 dark:text-mono-gray-200 hover:bg-mono-gray-100 dark:hover:bg-mono-gray-800"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-3" />
                        Delete Account
                      </Button>
                    </li>
                  </ul>
                </nav>
              </Card>
              
            </div>
            
          </div>
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
