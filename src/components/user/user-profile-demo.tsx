"use client";

import { useAuth } from '@/contexts/auth-context';
import { useUserProfile, useDateTime } from '@/hooks/use-user-profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from './user-profile';
import { Calendar, Clock, User, Zap } from 'lucide-react';
import { formatAccountAge } from '@/lib/user-profile';
// Performance optimization needed: Consider memoizing dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions


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
  const accountCreationDate = user.metadata.creationTime ? new Date(user.metadata.creationTime) : null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4">
      {/* Current Time Display with gradient background */}
      <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-400/10 dark:via-indigo-400/10 dark:to-purple-400/10"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Current Time</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700/30">
              <p className="text-3xl font-mono font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">{currentTimeFormatted}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                <span className="font-medium">Timestamp:</span> <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">{currentTime.getTime()}</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Variants Showcase */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg">
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Profile Variants</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Large Profile with Glass Effect */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Glass Variant - Large</h3>
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-200/30 dark:border-blue-700/30">
                <UserProfile user={user} size="lg" variant="glass" showStatusDot={true} />
              </div>
            </div>
            
            {/* Card Variant with User ID */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Card Variant - Medium</h3>
              <UserProfile user={user} size="md" variant="card" showUserId />
            </div>
            
            {/* Minimal Variant with Activity Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Minimal with Activity</h3>
              <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200/30 dark:border-green-700/30">
                <UserProfile user={user} size="sm" variant="minimal" showLastSignIn showCreationDate />
              </div>
            </div>
            
            {/* Default Variant */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Default Variant</h3>
              <div className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border border-gray-200/30 dark:border-gray-700/30">
                <UserProfile user={user} size="md" showUserId showStatusDot={true} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed User Information */}
      {userInfo && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-emerald-50/30 to-blue-50/30 dark:from-gray-900 dark:via-emerald-900/10 dark:to-blue-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 shadow-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Detailed Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enhanced Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User ID Card */}
              <div className="group p-4 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border border-gray-200/50 dark:border-gray-700/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">User ID</span>
                  <Badge variant="outline" className="font-mono bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 border-gray-300 dark:border-gray-600">
                    {userInfo.id.substring(0, 8)}...
                  </Badge>
                </div>
              </div>

              {/* Account Age Card */}
              <div className="group p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/30 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Account Age</span>
                  <Badge className={`${accountAge < 7 ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-gradient-to-r from-blue-500 to-indigo-600"} text-white border-0 shadow-sm`}>
                    {formatAccountAge(accountCreationDate)}
                    {isNewUser() && " 🎉"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Timestamp Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Creation Time Card */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/30 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wide">Account Created</h4>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{userInfo.relativeCreationTime}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-blue-100/50 dark:bg-blue-900/30 px-2 py-1 rounded">
                      {userInfo.formattedCreationTime}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 shadow-sm">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Last Sign In Card */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200/50 dark:border-emerald-700/30 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Last Sign In</h4>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{userInfo.relativeLastSignInTime}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-emerald-100/50 dark:bg-emerald-900/30 px-2 py-1 rounded">
                      {userInfo.formattedLastSignInTime}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 shadow-sm">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>


            {/* Time Since Last Sign In Details */}
            {timeSinceLastSignIn && (
              <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-700/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-amber-900 dark:text-amber-100">Activity Breakdown</h4>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-amber-900/20 border border-amber-200/30 dark:border-amber-700/30 text-center">
                    <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">{timeSinceLastSignIn.minutes}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide font-medium">Minutes</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-amber-900/20 border border-amber-200/30 dark:border-amber-700/30 text-center">
                    <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">{timeSinceLastSignIn.hours}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide font-medium">Hours</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-amber-900/20 border border-amber-200/30 dark:border-amber-700/30 text-center">
                    <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">{timeSinceLastSignIn.days}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide font-medium">Days</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-amber-900/20 border border-amber-200/30 dark:border-amber-700/30 text-center lg:col-span-1 col-span-2">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{timeSinceLastSignIn.formatted}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide font-medium">Formatted</p>
                  </div>
                </div>
              </div>
            )}

            {/* New User Celebration */}
            {isNewUser() && (
              <div className="p-6 rounded-xl bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-teal-600/20"></div>
                <div className="relative z-10 text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                      <Zap className="h-6 w-6 text-white animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">Welcome, New User! 🎉</h3>
                  <p className="text-green-100">Your account was created today. Welcome to our community!</p>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm">
                    <Zap className="h-3 w-3 mr-1" />
                    Joined Today!
                  </Badge>
                </div>
                
                {/* Animated decorative elements */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full animate-bounce delay-300"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 bg-white/10 rounded-full animate-pulse delay-700"></div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
