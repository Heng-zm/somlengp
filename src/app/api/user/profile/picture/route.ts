import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser, checkRateLimit } from '@/lib/auth-middleware';
import { updateProfilePicture } from '@/lib/storage';
import { updateUserProfile, getUserProfile } from '@/lib/user-profile-db';
// POST - Upload new profile picture
async function uploadProfilePicture(request: NextRequest, user: AuthenticatedUser): Promise<NextResponse> {
  try {
    // Rate limiting for uploads (very restrictive)
    if (!checkRateLimit(`${user.uid}_upload`, 5, 300000)) { // 5 uploads per 5 minutes
      return NextResponse.json(
        { 
          error: 'Too many upload requests. Please wait before uploading again.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }
    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data', code: 'INVALID_CONTENT_TYPE' },
        { status: 400 }
      );
    }
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse form data', code: 'INVALID_FORM_DATA' },
        { status: 400 }
      );
    }
    const file = formData.get('file') as File;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided or invalid file', code: 'NO_FILE' },
        { status: 400 }
      );
    }
    // Validate file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json(
        { error: 'File size must be less than 10MB', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }
    // Get current profile to get old photo URL
    let currentProfile;
    try {
      currentProfile = await getUserProfile(user.uid);
    } catch (error) {
      // Continue without old photo URL
    }
    // Upload to Supabase Storage
    let photoURL: string;
    try {
      photoURL = await updateProfilePicture(
        user.uid, 
        file, 
        currentProfile?.photoURL || undefined
      );
    } catch (uploadError) {
      console.error('Storage upload error:', uploadError);
      if (uploadError instanceof Error) {
        if (uploadError.message.includes('unauthorized')) {
          return NextResponse.json(
            { error: 'You are not authorized to upload files', code: 'UNAUTHORIZED_UPLOAD' },
            { status: 403 }
          );
        }
        if (uploadError.message.includes('quota')) {
          return NextResponse.json(
            { error: 'Storage quota exceeded', code: 'QUOTA_EXCEEDED' },
            { status: 507 }
          );
        }
      }
      return NextResponse.json(
        { error: 'Failed to upload image. Please try again.', code: 'UPLOAD_FAILED' },
        { status: 500 }
      );
    }
    // Update user profile with new photo URL
    try {
      await updateUserProfile(user.uid, { photoURL });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      // Upload succeeded but database update failed
      // In a production app, you might want to delete the uploaded file
      return NextResponse.json(
        { error: 'Image uploaded but profile update failed', code: 'DB_UPDATE_FAILED' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Profile picture updated successfully',
      photoURL,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload profile picture',
        code: 'UPLOAD_ERROR'
      },
      { status: 500 }
    );
  }
}
// DELETE - Remove profile picture
async function removeProfilePicture(request: NextRequest, user: AuthenticatedUser): Promise<NextResponse> {
  try {
    // Rate limiting for deletions
    if (!checkRateLimit(`${user.uid}_delete_picture`, 10, 60000)) { // 10 deletions per minute
      return NextResponse.json(
        { 
          error: 'Too many deletion requests.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }
    // Update user profile to remove photo URL
    await updateUserProfile(user.uid, { photoURL: null });
    return NextResponse.json({
      success: true,
      message: 'Profile picture removed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Profile picture removal error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to remove profile picture',
        code: 'REMOVAL_ERROR'
      },
      { status: 500 }
    );
  }
}
// Export protected handlers
export const POST = withAuth(uploadProfilePicture);
export const DELETE = withAuth(removeProfilePicture);