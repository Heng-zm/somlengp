import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  StorageError 
} from 'firebase/storage';
import { app } from '@/lib/firebase';

// Initialize Firebase Storage
let storage: ReturnType<typeof getStorage> | null = null;

// Initialize storage when app is available
if (app) {
  storage = getStorage(app);
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
 * Uploads a profile picture to Firebase Storage
 */
export async function uploadProfilePicture(userId: string, file: File): Promise<string> {
  try {
    // Check if storage is initialized
    if (!storage) {
      throw new Error('Firebase Storage not initialized');
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size must be less than 10MB');
    }

    // Optimize image
    const optimizedFile = await optimizeImage(file);
    
    // Create reference
    const timestamp = Date.now();
    const fileName = `profile_${timestamp}.jpg`;
    const storageRef = ref(storage, `profile-pictures/${userId}/${fileName}`);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, optimizedFile, {
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        userId: userId
      }
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    if (error instanceof StorageError) {
      switch (error.code) {
        case 'storage/unauthorized':
          throw new Error('You are not authorized to upload files');
        case 'storage/canceled':
          throw new Error('Upload was cancelled');
        case 'storage/quota-exceeded':
          throw new Error('Storage quota exceeded');
        case 'storage/invalid-format':
          throw new Error('Invalid file format');
        default:
          throw new Error('Upload failed. Please try again.');
      }
    }
    throw error;
  }
}

/**
 * Deletes an old profile picture from storage
 */
export async function deleteProfilePicture(photoURL: string): Promise<void> {
  try {
    // Check if storage is initialized
    if (!storage) {
      console.warn('Firebase Storage not initialized, skipping deletion');
      return;
    }

    // Only delete files from our storage
    if (!photoURL.includes('firebasestorage.googleapis.com')) {
      return; // Skip deletion for external URLs
    }

    // Extract the storage path from the URL
    const url = new URL(photoURL);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      throw new Error('Invalid storage URL');
    }
    
    const filePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, filePath);
    
    await deleteObject(storageRef);
  } catch (error) {
    console.warn('Failed to delete old profile picture:', error);
    // Don't throw error for deletion failures - not critical
  }
}

/**
 * Uploads and replaces profile picture
 */
export async function updateProfilePicture(userId: string, file: File, oldPhotoURL?: string): Promise<string> {
  try {
    // Upload new picture first
    const newPhotoURL = await uploadProfilePicture(userId, file);
    
    // Delete old picture (if it exists and is from our storage)
    if (oldPhotoURL) {
      try {
        await deleteProfilePicture(oldPhotoURL);
      } catch (error) {
        // Log but don't fail - new upload was successful
        console.warn('Failed to delete old profile picture:', error);
      }
    }
    
    return newPhotoURL;
  } catch (error) {
    console.error('Error updating profile picture:', error);
    throw error;
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