"use client";

import { useAuth } from '@/contexts/auth-context';
import { useUserProfile, useDateTime } from '@/hooks/use-user-profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from './user-profile';
import { Clock, User, Calendar, Zap } from 'lucide-react';

/**
 * Demo component showcasing the user profile features
 */
export function UserProfileDemo() {
  const { user } = useAuth();
  const { getUserInfo, isNewUser, getAccountAge, getTimeSinceLastSignIn } = useUserProfile();
  const { currentTime, formatted: currentTimeFormatted } = useDateTime();

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Please sign in to view profile features</p>
        </CardContent>
      </Card>
    );
  }

  const userInfo = getUserInfo();
  const accountAge = getAccountAge();
  const timeSinceLastSignIn = getTimeSinceLastSignIn();

  return (
    <div className="space-y-6">
      {/* Current Time Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Current Time</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-mono">{currentTimeFormatted}</p>
            <p className="text-sm text-gray-500">
              Timestamp: {currentTime.getTime()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Basic Profile Display */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UserProfile user={user} size="lg" />
          <UserProfile user={user} size="md" showUserId />
          <UserProfile user={user} size="sm" showLastSignIn showCreationDate />
        </CardContent>
      </Card>

      {/* Detailed User Information */}
      {userInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Detailed Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User ID and Status */}
            <div className="flex items-center justify-between">
              <span className="font-medium">User ID</span>
              <Badge variant="outline" className="font-mono">
                {userInfo.id}
              </Badge>
            </div>

            {/* Account Age */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Account Age</span>
              <Badge variant={accountAge < 7 ? "default" : "secondary"}>
                {accountAge} days
                {isNewUser() && " 🎉"}
              </Badge>
            </div>

            {/* Creation Time */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Created</span>
              <div className="text-right">
                <p className="text-sm">{userInfo.relativeCreationTime}</p>
                <p className="text-xs text-gray-500 font-mono">
                  {userInfo.formattedCreationTime}
                </p>
              </div>
            </div>

            {/* Last Sign In */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Last Sign In</span>
              <div className="text-right">
                <p className="text-sm">{userInfo.relativeLastSignInTime}</p>
                <p className="text-xs text-gray-500 font-mono">
                  {userInfo.formattedLastSignInTime}
                </p>
              </div>
            </div>

            {/* Profile Timestamps */}
            {userInfo.profileCreatedAt && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Profile Created</span>
                <div className="text-right">
                  <p className="text-sm">{userInfo.relativeProfileCreatedAt}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {userInfo.formattedProfileCreatedAt}
                  </p>
                </div>
              </div>
            )}

            {userInfo.profileUpdatedAt && userInfo.profileUpdatedAt !== userInfo.profileCreatedAt && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Profile Updated</span>
                <div className="text-right">
                  <p className="text-sm">{userInfo.relativeProfileUpdatedAt}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {userInfo.formattedProfileUpdatedAt}
                  </p>
                </div>
              </div>
            )}

            {/* Time Since Last Sign In Details */}
            {timeSinceLastSignIn && (
              <div className="pt-4 border-t">
                <p className="font-medium mb-2">Time Since Last Sign In</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Minutes:</span> {timeSinceLastSignIn.minutes}
                  </div>
                  <div>
                    <span className="text-gray-500">Hours:</span> {timeSinceLastSignIn.hours}
                  </div>
                  <div>
                    <span className="text-gray-500">Days:</span> {timeSinceLastSignIn.days}
                  </div>
                  <div>
                    <span className="text-gray-500">Formatted:</span> {timeSinceLastSignIn.formatted}
                  </div>
                </div>
              </div>
            )}

            {/* New User Badge */}
            {isNewUser() && (
              <div className="flex items-center justify-center pt-4">
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  <Zap className="h-3 w-3 mr-1" />
                  New User Today!
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
