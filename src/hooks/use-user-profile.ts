import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from '@/contexts/auth-context';
import { 
  getUserProfile, 
  updateUserProfile, 
  formatDate, 
  formatRelativeTime,
  getUserId,
  getUserCreationTime,
  getUserLastSignInTime
} from '@/lib/user-profile';
import { UserProfile } from '@/lib/types';

/**
 * Custom hook for managing user profiles
 */
export function useUserProfile() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Updates the current user's profile
   */
  const updateProfile = async (updates: Partial<Omit<UserProfile, 'uid' | 'createdAt' | 'profileCreatedAt'>>) => {
    if (!user) {
      setError('No user logged in');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      await updateUserProfile(user.uid, updates);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gets formatted user information
   */
  const getUserInfo = () => {
    if (!user) return null;

    const creationTime = getUserCreationTime(user);
    const lastSignInTime = getUserLastSignInTime(user);

    return {
      id: getUserId(user),
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      creationTime,
      lastSignInTime,
      formattedCreationTime: formatDate(creationTime),
      formattedLastSignInTime: formatDate(lastSignInTime),
      relativeCreationTime: formatRelativeTime(creationTime),
      relativeLastSignInTime: formatRelativeTime(lastSignInTime),
      profileCreatedAt: userProfile?.profileCreatedAt,
      profileUpdatedAt: userProfile?.profileUpdatedAt,
      formattedProfileCreatedAt: formatDate(userProfile?.profileCreatedAt),
      formattedProfileUpdatedAt: formatDate(userProfile?.profileUpdatedAt),
      relativeProfileCreatedAt: formatRelativeTime(userProfile?.profileCreatedAt),
      relativeProfileUpdatedAt: formatRelativeTime(userProfile?.profileUpdatedAt),
    };
  };

  /**
   * Checks if the user profile was created today
   */
  const isNewUser = () => {
    if (!userProfile?.profileCreatedAt) return false;
    const today = new Date();
    const profileDate = new Date(userProfile.profileCreatedAt);
    return (
      today.getFullYear() === profileDate.getFullYear() &&
      today.getMonth() === profileDate.getMonth() &&
      today.getDate() === profileDate.getDate()
    );
  };

  /**
   * Gets the user's account age in days
   */
  const getAccountAge = () => {
    if (!user?.metadata.creationTime) return 0;
    const creationDate = new Date(user.metadata.creationTime);
    const now = new Date();
    const diffInMs = now.getTime() - creationDate.getTime();
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  };

  /**
   * Gets time since last sign in
   */
  const getTimeSinceLastSignIn = () => {
    if (!user?.metadata.lastSignInTime) return null;
    const lastSignIn = new Date(user.metadata.lastSignInTime);
    const now = new Date();
    const diffInMs = now.getTime() - lastSignIn.getTime();
    return {
      milliseconds: diffInMs,
      seconds: Math.floor(diffInMs / 1000),
      minutes: Math.floor(diffInMs / (1000 * 60)),
      hours: Math.floor(diffInMs / (1000 * 60 * 60)),
      days: Math.floor(diffInMs / (1000 * 60 * 60 * 24)),
      formatted: formatRelativeTime(lastSignIn)
    };
  };

  return {
    user,
    userProfile,
    loading,
    error,
    updateProfile,
    getUserInfo,
    isNewUser,
    getAccountAge,
    getTimeSinceLastSignIn,
    // Utility functions
    formatDate,
    formatRelativeTime,
  };
}

/**
 * Hook specifically for getting current date/time information
 */
export function useDateTime() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return {
    currentTime,
    formatted: formatDate(currentTime),
    iso: currentTime.toISOString(),
    timestamp: currentTime.getTime(),
    relative: formatRelativeTime(currentTime), // This will always be "Just now"
  };
}
