import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for storage operations
let supabaseStorage: ReturnType<typeof createClient> | null = null;

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseAnonKey) {
    supabaseStorage = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (error) {
  console.warn('Supabase Storage client not initialized:', error);
}

const STORAGE_BUCKET = 'profile-pictures';
const storage: null = null; // Keep for backwards compatibility

class StorageError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}
/**
 * Optimizes an image file before upload
 */
export async function optimizeImage(file: File, maxWidth = 400, maxHeight = 400, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to optimize image'));
            return;
          }
          const optimizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(optimizedFile);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}
/**
 * Uploads a profile picture to Supabase Storage
 */
export async function uploadProfilePicture(userId: string, file: File): Promise<string> {
  if (!supabaseStorage) {
    throw new StorageError('Supabase Storage not initialized', 'STORAGE_NOT_CONFIGURED');
  }
  
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${userId}/${timestamp}.${extension}`;
    
    // Upload to Supabase Storage
    const { data, error } = await (supabaseStorage as any).storage
      .from(STORAGE_BUCKET)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      throw new StorageError(error.message, 'UPLOAD_ERROR');
    }
    
    // Get the public URL
    const { data: publicUrlData } = (supabaseStorage as any).storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filename);
    
    if (!publicUrlData?.publicUrl) {
      throw new StorageError('Failed to get public URL', 'PUBLIC_URL_ERROR');
    }
    
    return publicUrlData.publicUrl;
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError('Failed to upload profile picture', 'UPLOAD_FAILED');
  }
}
/**
 * Deletes an old profile picture from Supabase Storage
 */
export async function deleteProfilePicture(photoURL: string): Promise<void> {
  if (!supabaseStorage || !photoURL) {
    return; // Nothing to delete or storage not configured
  }
  
  try {
    // Extract the filename from the URL
    const url = new URL(photoURL);
    const pathname = url.pathname;
    
    // Extract the filename from the path (after /storage/v1/object/public/profile-pictures/)
    const bucketPath = '/storage/v1/object/public/' + STORAGE_BUCKET + '/';
    const startIndex = pathname.indexOf(bucketPath);
    
    if (startIndex === -1) {
      console.warn('Could not parse photo URL for deletion:', photoURL);
      return;
    }
    
    const filename = pathname.substring(startIndex + bucketPath.length);
    
    if (!filename) {
      console.warn('No filename found in photo URL:', photoURL);
      return;
    }
    
    // Delete from Supabase Storage
    const { error } = await (supabaseStorage as any).storage
      .from(STORAGE_BUCKET)
      .remove([filename]);
    
    if (error) {
      console.warn('Failed to delete profile picture:', error);
      // Don't throw error for deletion failures - it's not critical
    }
  } catch (error) {
    console.warn('Error deleting profile picture:', error);
    // Don't throw error for deletion failures - it's not critical
  }
}
/**
 * Uploads and replaces profile picture using Supabase Storage
 */
export async function updateProfilePicture(userId: string, file: File, oldPhotoURL?: string): Promise<string> {
  try {
    // Delete the old profile picture if it exists
    if (oldPhotoURL) {
      await deleteProfilePicture(oldPhotoURL);
    }
    
    // Upload the new profile picture
    const newPhotoURL = await uploadProfilePicture(userId, file);
    
    return newPhotoURL;
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError('Failed to update profile picture', 'UPDATE_FAILED');
  }
}
/**
 * Validates image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select an image file' };
  }
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'Image must be smaller than 10MB' };
  }
  // Check file extension
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(`.${ext}`));
  if (!hasValidExtension) {
    return { valid: false, error: 'Please use JPG, PNG, GIF, or WebP format' };
  }
  return { valid: true };
}
/**
 * Creates a preview URL for image file
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to create preview'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}