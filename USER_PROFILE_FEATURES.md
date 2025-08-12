# User Profile Features with DateTime and User ID

This document describes the new user profile features that have been added to the application, including datetime handling, user ID management, and profile creation tracking.

## Overview

The application now includes comprehensive user profile management with the following features:

- **User ID Display**: Show Firebase user IDs in the interface
- **DateTime Tracking**: Track account creation, last sign-in, and profile timestamps
- **Profile Creation**: Automatically create user profiles in Firestore
- **Profile Updates**: Track when profiles are updated
- **Relative Time Display**: Show user-friendly relative timestamps (e.g., "2 hours ago")
- **Formatted Timestamps**: Display full formatted timestamps

## Files Added/Modified

### New Files Created:
1. `src/lib/user-profile.ts` - Core user profile utility functions
2. `src/hooks/use-user-profile.ts` - React hooks for user profile management
3. `src/components/user/user-profile-demo.tsx` - Demo component showcasing features

### Modified Files:
1. `src/lib/types.ts` - Extended with user profile types
2. `src/contexts/auth-context.tsx` - Integrated profile creation and timestamp tracking
3. `src/app/profile/page.tsx` - Enhanced profile page with datetime information
4. `src/components/user/user-profile.tsx` - Extended with optional datetime display

## Core Features

### 1. User Profile Types

```typescript
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastSignInTime: Date | null;
  profileCreatedAt?: Date;
  profileUpdatedAt?: Date;
}
```

### 2. Automatic Profile Creation

When a user signs in, the system automatically:
- Checks if a user profile exists in Firestore
- Creates a new profile if one doesn't exist
- Updates the last sign-in time for existing users
- Tracks profile creation and update timestamps

### 3. DateTime Utilities

#### Format Functions:
- `formatDate(date)` - Returns formatted date string
- `formatRelativeTime(date)` - Returns relative time (e.g., "2 hours ago")

#### User Info Functions:
- `getUserId(user)` - Gets the Firebase user ID
- `getUserCreationTime(user)` - Gets account creation timestamp
- `getUserLastSignInTime(user)` - Gets last sign-in timestamp

### 4. Profile Management Functions

#### Core Functions:
```typescript
// Create a new user profile
await createUserProfile(user);

// Get an existing profile
const profile = await getUserProfile(uid);

// Update a profile
await updateUserProfile(uid, { displayName: 'New Name' });

// Update last sign-in time
await updateLastSignInTime(uid);
```

## Usage Examples

### Basic Profile Display

```jsx
import { UserProfile } from '@/components/user/user-profile';

// Basic profile with name and avatar
<UserProfile user={user} />

// Profile with user ID
<UserProfile user={user} showUserId />

// Profile with datetime information
<UserProfile 
  user={user} 
  showLastSignIn 
  showCreationDate 
/>
```

### Using the Custom Hook

```jsx
import { useUserProfile } from '@/hooks/use-user-profile';

function MyComponent() {
  const { 
    user, 
    userProfile, 
    getUserInfo, 
    isNewUser, 
    getAccountAge 
  } = useUserProfile();
  
  const userInfo = getUserInfo();
  const accountAge = getAccountAge();
  
  return (
    <div>
      <p>User ID: {userInfo?.id}</p>
      <p>Account Age: {accountAge} days</p>
      {isNewUser() && <p>Welcome, new user! 🎉</p>}
    </div>
  );
}
```

### DateTime Hook

```jsx
import { useDateTime } from '@/hooks/use-user-profile';

function CurrentTime() {
  const { currentTime, formatted } = useDateTime();
  
  return (
    <div>
      <p>Current time: {formatted}</p>
      <p>Timestamp: {currentTime.getTime()}</p>
    </div>
  );
}
```

## Profile Page Features

The enhanced profile page now displays:

1. **User Avatar & Name** - Large profile display with online indicator
2. **User ID Badge** - Shows the Firebase user ID
3. **Account Information Card** with:
   - Account creation date (relative and formatted)
   - Last sign-in time (relative and formatted)
   - Profile creation timestamp
   - Profile update timestamp (if different from creation)

## Demo Component

Use the `UserProfileDemo` component to see all features in action:

```jsx
import { UserProfileDemo } from '@/components/user/user-profile-demo';

function DemoPage() {
  return <UserProfileDemo />;
}
```

## Database Structure

User profiles are stored in Firestore under the `users` collection:

```
users/{uid} {
  uid: string,
  email: string | null,
  displayName: string | null,
  photoURL: string | null,
  createdAt: Timestamp,
  lastSignInTime: Timestamp | null,
  profileCreatedAt: Timestamp,
  profileUpdatedAt: Timestamp
}
```

## Security Rules

Make sure your Firestore security rules allow users to read/write their own profiles:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Features Highlights

- ✅ **User ID Display** - Show Firebase user IDs with badges
- ✅ **DateTime Creation** - Track when accounts and profiles are created
- ✅ **Last Sign-in Tracking** - Monitor user activity
- ✅ **Profile Updates** - Track profile modifications
- ✅ **Relative Time Display** - User-friendly time formats
- ✅ **New User Detection** - Identify users who joined today
- ✅ **Account Age Calculation** - Calculate days since account creation
- ✅ **Enhanced Profile Component** - Flexible profile display options
- ✅ **Custom Hooks** - Easy-to-use React hooks
- ✅ **Comprehensive Demo** - Example component showing all features

## Next Steps

You can now:
1. Sign in to see automatic profile creation
2. Visit the profile page to view detailed timestamp information
3. Use the enhanced UserProfile component throughout your app
4. Leverage the custom hooks for profile management
5. Extend the profile types with additional fields as needed

The system is designed to be extensible and provides a solid foundation for user profile management with comprehensive datetime tracking.
