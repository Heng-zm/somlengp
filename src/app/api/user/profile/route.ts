import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser, checkRateLimit } from '@/lib/auth-middleware';
import { getUserProfileAdmin, updateUserProfileAdmin } from '@/lib/user-profile-admin-db';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
// GET - Retrieve user profile
async function getProfile(request: NextRequest, user: AuthenticatedUser): Promise<NextResponse> {
  try {
    // Rate limiting
    if (!checkRateLimit(user.uid, 30, 60000)) { // 30 requests per minute
      return NextResponse.json(
        { 
          error: 'Too many requests. Please wait a moment.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }
    const profile = await getUserProfileAdmin(user.uid);
    if (!profile) {
      // If profile doesn't exist, create one
      // This should normally be done during sign-in, but this is a fallback
      return NextResponse.json(
        { 
          error: 'Profile not found. Please sign in again.',
          code: 'PROFILE_NOT_FOUND'
        },
        { status: 404 }
      );
    }
    // Remove sensitive data before sending to client
    const safeProfile = {
      uid: profile.uid,
      userId: profile.userId,
      email: profile.email,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      createdAt: profile.createdAt.toISOString(),
      lastSignInTime: profile.lastSignInTime?.toISOString() || null,
      profileCreatedAt: profile.profileCreatedAt?.toISOString(),
      profileUpdatedAt: profile.profileUpdatedAt?.toISOString(),
    };
    return NextResponse.json({
      success: true,
      profile: safeProfile,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve profile',
        code: 'PROFILE_GET_ERROR'
      },
      { status: 500 }
    );
  }
}
// PATCH - Update user profile
async function updateUserProfileHandler(request: NextRequest, user: AuthenticatedUser): Promise<NextResponse> {
  try {
    // Rate limiting for updates (more restrictive)
    if (!checkRateLimit(`${user.uid}_update`, 10, 60000)) { // 10 updates per minute
      return NextResponse.json(
        { 
          error: 'Too many update requests. Please wait a moment.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }
    // Validate request data
    const allowedFields = ['displayName', 'photoURL'];
    const updates: Record<string, any> = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates[key] = value;
      }
    }
    // Validation rules
    if (updates.displayName !== undefined) {
      if (typeof updates.displayName !== 'string') {
        return NextResponse.json(
          { error: 'Display name must be a string', code: 'INVALID_DISPLAY_NAME_TYPE' },
          { status: 400 }
        );
      }
      if (updates.displayName.length > 50) {
        return NextResponse.json(
          { error: 'Display name must be 50 characters or less', code: 'DISPLAY_NAME_TOO_LONG' },
          { status: 400 }
        );
      }
      if (updates.displayName.trim().length === 0) {
        return NextResponse.json(
          { error: 'Display name cannot be empty', code: 'DISPLAY_NAME_EMPTY' },
          { status: 400 }
        );
      }
      // Sanitize display name
      updates.displayName = updates.displayName.trim();
    }
    if (updates.photoURL !== undefined) {
      if (updates.photoURL !== null && typeof updates.photoURL !== 'string') {
        return NextResponse.json(
          { error: 'Photo URL must be a string or null', code: 'INVALID_PHOTO_URL_TYPE' },
          { status: 400 }
        );
      }
      // Basic URL validation if not null
      if (updates.photoURL && !updates.photoURL.match(/^https?:\/\/.+/)) {
        return NextResponse.json(
          { error: 'Photo URL must be a valid HTTP/HTTPS URL', code: 'INVALID_PHOTO_URL' },
          { status: 400 }
        );
      }
    }
    // If no valid updates, return error
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'NO_VALID_UPDATES' },
        { status: 400 }
      );
    }
    // Update the profile in Firestore using Admin SDK
    await updateUserProfileAdmin(user.uid, updates);
    // Also update Firebase Auth profile if displayName or photoURL changed
    if (auth && auth.currentUser && (updates.displayName !== undefined || updates.photoURL !== undefined)) {
      try {
        const authUpdates: { displayName?: string; photoURL?: string } = {};
        if (updates.displayName !== undefined) authUpdates.displayName = updates.displayName;
        if (updates.photoURL !== undefined) authUpdates.photoURL = updates.photoURL;
        await updateProfile(auth.currentUser, authUpdates);
      } catch (authError) {
        // Continue - the Firestore update was successful
      }
    }
    // Get the updated profile
    const updatedProfile = await getUserProfileAdmin(user.uid);
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile ? {
        uid: updatedProfile.uid,
        userId: updatedProfile.userId,
        email: updatedProfile.email,
        displayName: updatedProfile.displayName,
        photoURL: updatedProfile.photoURL,
        profileUpdatedAt: updatedProfile.profileUpdatedAt?.toISOString(),
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update profile',
        code: 'PROFILE_UPDATE_ERROR'
      },
      { status: 500 }
    );
  }
}
// DELETE - Delete user profile (for account deletion)
async function deleteProfile(request: NextRequest, user: AuthenticatedUser): Promise<NextResponse> {
  try {
    // This should typically be called as part of account deletion process
    // Additional verification might be needed here
    // Rate limiting for deletion (very restrictive)
    if (!checkRateLimit(`${user.uid}_delete`, 2, 300000)) { // 2 attempts per 5 minutes
      return NextResponse.json(
        { 
          error: 'Too many deletion attempts. Please wait before trying again.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }
    // Note: This should ideally require additional authentication
    // and be part of a complete account deletion flow
    return NextResponse.json({
      success: false,
      error: 'Profile deletion must be performed through account deletion process',
      code: 'USE_ACCOUNT_DELETION'
    }, { status: 400 });
  } catch (error) {
    console.error('Error in profile deletion:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process deletion request',
        code: 'PROFILE_DELETE_ERROR'
      },
      { status: 500 }
    );
  }
}
// Export protected handlers
export const GET = withAuth(getProfile);
export const PATCH = withAuth(updateUserProfileHandler);
export const DELETE = withAuth(deleteProfile);