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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20">
          <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            
            {/* Enhanced Header with Floating Card Design */}
            <div className="relative">
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-3xl"></div>
              
              {/* Main Header Card */}
              <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shadow-2xl rounded-3xl">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                  <div className="absolute inset-0 bg-pattern animate-pulse"></div>
                </div>
                
                {/* Cover Section */}
                <div className="relative h-32 md:h-40 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
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
                  {/* Profile Picture and Basic Info */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-12 mb-6">
                    {/* Enhanced Avatar */}
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full opacity-30 group-hover:opacity-50 transition-opacity blur-sm"></div>
                      <Avatar className="relative h-20 w-20 md:h-24 md:w-24 border-4 border-white dark:border-gray-950 shadow-2xl">
                        <AvatarImage src={user.photoURL || undefined} alt={userData.displayName} className="object-cover" />
                        <AvatarFallback className="text-xl md:text-2xl font-bold bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white">
                          {userData.userInitials}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Status Indicator */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white dark:border-gray-950 flex items-center justify-center shadow-lg">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 text-center sm:text-left space-y-3">
                      <div className="space-y-2">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
                          {userData.displayName}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">{user.email}</p>
                      </div>
                      
                      {/* Enhanced Badges */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        {userData.isPremiumUser && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
                            <Crown className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                        
                        {user.emailVerified && (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        
                        {userData.isNewUser && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-md hover:shadow-lg transition-shadow animate-pulse">
                            <Star className="h-3 w-3 mr-1" />
                            New Member
                          </Badge>
                        )}
                        
                        {user.providerData?.[0]?.providerId === 'google.com' && (
                          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
                            <Zap className="h-3 w-3 mr-1" />
                            Google
                          </Badge>
                        )}
                        
                        <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 shadow-md hover:shadow-lg transition-shadow">
                          <Activity className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="flex items-center justify-center sm:justify-start gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {formatRelativeTime(userData.userCreationTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          <span>Active {formatRelativeTime(userData.lastSignInTime)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="shrink-0">
                      <ProfileEditorDialog 
                        trigger={
                          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all">
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

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Content - Profile Overview */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Profile Summary Card */}
                <Card className="border-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shadow-xl">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Profile Overview
                      </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Profile Details */}
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200/50 dark:border-blue-700/30">
                          <Label className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Display Name</Label>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                            {userData.displayName}
                          </p>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200/50 dark:border-purple-700/30">
                          <Label className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Email</Label>
                          <p className="text-base text-gray-900 dark:text-white mt-1 break-all">
                            {user.email}
                          </p>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-700/30">
                          <Label className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Member Since</Label>
                          <p className="text-base text-gray-900 dark:text-white mt-1">
                            {userData.userCreationTime?.toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            }) || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Account Stats */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border border-orange-200/50 dark:border-orange-700/30">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {userData.accountAgeInDays}
                            </div>
                            <div className="text-xs text-orange-600/70 dark:text-orange-400/70 uppercase tracking-wide">
                              Days Active
                            </div>
                          </div>
                          
                          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-200/50 dark:border-cyan-700/30">
                            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                              {user.providerData?.length || 1}
                            </div>
                            <div className="text-xs text-cyan-600/70 dark:text-cyan-400/70 uppercase tracking-wide">
                              Providers
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/50 dark:border-indigo-700/30">
                          <Label className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2 block">Account Status</Label>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                              <Activity className="h-3 w-3 mr-1" />
                              Online
                            </Badge>
                            {user.emailVerified && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {userData.isPremiumUser && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
                                <Crown className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Quick Actions Card */}
                <Card className="border-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shadow-xl">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      Quick Actions
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Edit Profile */}
                      <ProfileEditorDialog 
                        trigger={
                          <Button variant="outline" className="h-16 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/30 transition-colors group">
                            <Edit className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
                            <span className="text-sm font-medium">Edit Profile</span>
                          </Button>
                        }
                      />
                      
                      {/* Copy User ID */}
                      <Button 
                        variant="outline" 
                        className="h-16 flex-col gap-2 hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-950/30 transition-colors group"
                        onClick={() => copyToClipboard(user.uid, 'uid')}
                      >
                        {copiedField === 'uid' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Copy className="h-5 w-5 text-green-600 group-hover:text-green-700" />
                        )}
                        <span className="text-sm font-medium">Copy User ID</span>
                      </Button>
                      
                      {/* Copy Email */}
                      <Button 
                        variant="outline" 
                        className="h-16 flex-col gap-2 hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950/30 transition-colors group"
                        onClick={() => copyToClipboard(user.email!, 'email')}
                      >
                        {copiedField === 'email' ? (
                          <CheckCircle2 className="h-5 w-5 text-purple-600" />
                        ) : (
                          <Mail className="h-5 w-5 text-purple-600 group-hover:text-purple-700" />
                        )}
                        <span className="text-sm font-medium">Copy Email</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                
                {/* Account Settings Card */}
                <Card className="border-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shadow-xl">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      Account Settings
                    </h2>
                    
                    <div className="space-y-3">
                      <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                        <Bell className="h-4 w-4 mr-3 text-blue-600" />
                        Notifications
                      </Button>
                      
                      <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/30">
                        <Lock className="h-4 w-4 mr-3 text-purple-600" />
                        Privacy & Security
                      </Button>
                      
                      <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-950/30">
                        <Palette className="h-4 w-4 mr-3 text-green-600" />
                        Appearance
                      </Button>
                      
                      <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-950/30">
                        <Globe className="h-4 w-4 mr-3 text-orange-600" />
                        Language
                      </Button>
                      
                      <div className="border-t pt-3 mt-3 space-y-2">
                        <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={handleLogout}>
                          <LogOut className="h-4 w-4 mr-3 text-gray-500" />
                          Sign Out
                        </Button>
                        
                        <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setShowDeleteDialog(true)}>
                          <Trash2 className="h-4 w-4 mr-3" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* User Stats Card */}
                <Card className="border-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 backdrop-blur-xl shadow-xl">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5 text-blue-600" />
                      Account Stats
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Account Age</span>
                        </div>
                        <span className="text-sm font-semibold">{userData.accountAgeInDays} days</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Last Active</span>
                        </div>
                        <span className="text-sm font-semibold">{formatRelativeTime(userData.lastSignInTime)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium">Status</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
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