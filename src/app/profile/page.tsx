"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { FeaturePageLayout } from '@/layouts/feature-page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogOut, User2, Clock, Calendar, UserCheck } from 'lucide-react';
import { UserProfile } from '@/components/user/user-profile';
import { formatDate, formatRelativeTime } from '@/lib/user-profile';

export default function ProfilePage() {
  const router = useRouter();
  const { user, userProfile, logout } = useAuth();

  if (!user) return null;

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

  const userCreationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime) : null;
  const lastSignInTime = user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;

  return (
    <AuthGuard>
      <FeaturePageLayout title="Profile">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Main Profile Card */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
              <CardContent className="p-8">
                <div className="flex flex-col items-center space-y-6">
                  {/* Large Profile Display */}
                  <div className="relative flex flex-col items-center">
                    <UserProfile 
                      user={user} 
                      size="xl" 
                      showName={false}
                      className="mb-4"
                    />
                    {/* Online indicator */}
                    <div className="absolute -bottom-1 -right-8 h-8 w-8 rounded-full bg-green-500 border-4 border-white dark:border-gray-800 shadow-lg" />
                  </div>

                  {/* User Name and Email */}
                  <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {user.displayName || 'User'}
                    </h1>
                    {user.email && (
                      <p className="text-lg text-gray-600 dark:text-gray-300">
                        {user.email}
                      </p>
                    )}
                    {/* User ID Badge */}
                    <Badge variant="secondary" className="font-mono text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      <User2 className="h-3 w-3 mr-1" />
                      ID: {user.uid}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Information Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Account Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Account Creation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">Account Created</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatRelativeTime(userCreationTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-gray-500">
                      {formatDate(userCreationTime)}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Last Sign In */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">Last Sign In</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatRelativeTime(lastSignInTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-gray-500">
                      {formatDate(lastSignInTime)}
                    </p>
                  </div>
                </div>

                {userProfile && (
                  <>
                    <Separator />
                    
                    {/* Profile Created */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <User2 className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="font-medium">Profile Created</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatRelativeTime(userProfile.profileCreatedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-gray-500">
                          {formatDate(userProfile.profileCreatedAt)}
                        </p>
                      </div>
                    </div>

                    {userProfile.profileUpdatedAt && userProfile.profileUpdatedAt !== userProfile.profileCreatedAt && (
                      <>
                        <Separator />
                        
                        {/* Profile Updated */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <div>
                              <p className="font-medium">Profile Updated</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {formatRelativeTime(userProfile.profileUpdatedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono text-gray-500">
                              {formatDate(userProfile.profileUpdatedAt)}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-center">
                  <Button 
                    onClick={handleLogout}
                    variant="outline"
                    className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/20"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </FeaturePageLayout>
    </AuthGuard>
  );
}
