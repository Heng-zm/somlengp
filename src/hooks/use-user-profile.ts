import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { 
  formatDate, 
  formatRelativeTime
} from '@/lib/user-profile';

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

    const creationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime) : null;
    const lastSignInTime = user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;

    return {
      id: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
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
    if (!user?.metadata.creationTime) return false;
    const today = new Date();
    const creationDate = new Date(user.metadata.creationTime);
    return (
      today.getFullYear() === creationDate.getFullYear() &&
      today.getMonth() === creationDate.getMonth() &&
      today.getDate() === creationDate.getDate()
    );
  };

  /**
   * Gets the account age in days
   */
  const getAccountAge = () => {
    if (!user?.metadata.creationTime) return 0;
    const now = new Date();
    const creationDate = new Date(user.metadata.creationTime);
    const diffInMs = now.getTime() - creationDate.getTime();
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  };

  /**
   * Gets detailed time since last sign in
   */
  const getTimeSinceLastSignIn = () => {
    if (!user?.metadata.lastSignInTime) return null;
    const now = new Date();
    const lastSignInDate = new Date(user.metadata.lastSignInTime);
    const diffInMs = now.getTime() - lastSignInDate.getTime();
    
    const minutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    return {
      minutes,
      hours,
      days,
      formatted: formatRelativeTime(lastSignInDate)
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
