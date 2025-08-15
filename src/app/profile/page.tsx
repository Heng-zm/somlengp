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


export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();
  
  // State management
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      // Redirect to home page after successful account deletion
      router.push('/');
    } catch (error) {
      console.error('Delete account failed:', error);
      // Close the dialog on error
      setShowDeleteDialog(false);
    }
  };

  const userCreationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime) : null;
  const lastSignInTime = user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;
  

  return (
    <AuthGuard>
      <FeaturePageLayout title="Profile">
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
          {/* Enhanced Profile Header with Cover */}
          <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Cover Section */}
            <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative">
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            
            <CardContent className="-mt-16 relative pt-20 pb-8 px-4 md:px-6">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                {/* Enhanced Avatar */}
                <div className="relative shrink-0">
                  <UserProfile 
                    user={user} 
                    size="xl" 
                    showName={false}
                    className="ring-4 ring-white dark:ring-slate-800 shadow-2xl"
                  />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                {/* Enhanced User Info */}
                <div className="flex-1 text-center md:text-left space-y-4 min-w-0 w-full">
                  {/* User Name */}
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                      {user.displayName || user.email?.split('@')[0] || 'User'}
                    </h1>
                    {/* Show provider info if available */}
                    {user.providerData?.length > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Signed in via {user.providerData[0].providerId === 'google.com' ? 'Google' : user.providerData[0].providerId}
                      </p>
                    )}
                  </div>
                  
                  {/* Email Section */}
                  {user.email && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span className="font-medium break-all">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(user.email!, 'email')}
                            className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Copy email"
                          >
                            {copiedField === 'email' ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          {user.emailVerified && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* User Stats */}
                  <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 md:gap-6 text-sm">
                    {userCreationTime && (
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>Joined {formatRelativeTime(userCreationTime)}</span>
                      </div>
                    )}
                    {lastSignInTime && (
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Activity className="h-4 w-4 shrink-0" />
                        <span>Active {formatRelativeTime(lastSignInTime)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* User ID */}
                  <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-gray-400 dark:text-gray-500">
                    <User2 className="h-3 w-3" />
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono text-xs">
                      {user.uid.slice(0, 8)}...{user.uid.slice(-8)}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(user.uid, 'uid')}
                      className="h-5 w-5 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      {copiedField === 'uid' ? (
                        <CheckCircle2 className="h-2 w-2 text-green-600" />
                      ) : (
                        <Copy className="h-2 w-2" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Section */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-purple-600" />
                <span>Account Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="justify-start gap-3 h-12 text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/20 dark:hover:bg-amber-950/40"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
                
                <Button 
                  onClick={() => setShowDeleteDialog(true)}
                  variant="destructive"
                  className="justify-start gap-3 h-12 bg-red-500 hover:bg-red-600 text-white"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Account</span>
                </Button>
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
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthGuard>
  );
}
