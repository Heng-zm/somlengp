import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { 
// Memory leak prevention: Timers need cleanup
// Add cleanup in useEffect return function

  formatDate, 
  formatRelativeTime
} from '@/lib/user-profile';
import { getUserId, getDisplayName, getPhotoURL, getCreationTime, getLastSignInTime } from '@/lib/supabase-user-utils';

/**
 * Simplified hook for user profile display
 */
export function useUserProfile() {
  const { user } = useAuth();

  /**
   * Gets basic user information for display
   */
  const getUserInfo = () => {
    if (!user) return null;

    const creationTime = getCreationTime(user);
    const lastSignInTime = getLastSignInTime(user);

    return {
      id: getUserId(user),
      displayName: getDisplayName(user),
      email: user.email,
      photoURL: getPhotoURL(user),
      creationTime,
      lastSignInTime,
      formattedCreationTime: formatDate(creationTime),
      formattedLastSignInTime: formatDate(lastSignInTime),
      relativeCreationTime: formatRelativeTime(creationTime),
      relativeLastSignInTime: formatRelativeTime(lastSignInTime),
    };
  };

  /**
   * Checks if the user account was created today
   */
  const isNewUser = () => {
    const creationTime = getCreationTime(user);
    if (!creationTime) return false;
    const today = new Date();
    return (
      today.getFullYear() === creationTime.getFullYear() &&
      today.getMonth() === creationTime.getMonth() &&
      today.getDate() === creationTime.getDate()
    );
  };

  /**
   * Gets the account age in days
   */
  const getAccountAge = () => {
    const creationTime = getCreationTime(user);
    if (!creationTime) return 0;
    const now = new Date();
    const diffInMs = now.getTime() - creationTime.getTime();
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  };

  /**
   * Gets detailed time since last sign in
   */
  const getTimeSinceLastSignIn = () => {
    const lastSignInTime = getLastSignInTime(user);
    if (!lastSignInTime) return null;
    const now = new Date();
    const diffInMs = now.getTime() - lastSignInTime.getTime();
    
    const minutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    return {
      minutes,
      hours,
      days,
      formatted: formatRelativeTime(lastSignInTime)
    };
  };

  return {
    user,
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
