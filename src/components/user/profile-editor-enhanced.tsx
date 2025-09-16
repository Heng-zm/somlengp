"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Edit, 
  Camera, 
  Save, 
  X, 
  Upload,
  Loader2,
  AlertTriangle,
  Check,
  RefreshCw
} from 'lucide-react';

interface ProfileEditorProps {
  className?: string;
}

// Debounce utility function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Form validation constants
const VALIDATION_RULES = {
  displayName: {
    minLength: 2,
    maxLength: 50,
    required: true
  },
  photoURL: {
    urlPattern: /^https?:\/\/.+/
  },
  file: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  }
};

export function EnhancedProfileEditor({ className }: ProfileEditorProps) {
  const { user } = useAuth();
  
  // State management with better organization
  const [formState, setFormState] = useState({
    isEditing: false,
    isLoading: false,
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || '',
  });
  
  const [uiState, setUiState] = useState({
    previewURL: null as string | null,
    errors: {} as Record<string, string>,
    showUnsavedWarning: false,
    lastSaveAttempt: null as Date | null
  });
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Debounced values for validation
  const debouncedDisplayName = useDebounce(formState.displayName, 300);
  const debouncedPhotoURL = useDebounce(formState.photoURL, 500);

  if (!user) return null;

  // Memoized values for performance
  const hasChanges = useMemo(() => {
    return (
      formState.displayName !== (user.displayName || '') ||
      formState.photoURL !== (user.photoURL || '') ||
      uiState.previewURL !== null
    );
  }, [formState.displayName, formState.photoURL, uiState.previewURL, user.displayName, user.photoURL]);

  const userInitial = useMemo(() => {
    return (user.displayName || user.email || 'U').charAt(0).toUpperCase();
  }, [user.displayName, user.email]);

  // Validation function with memoization
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Display name validation
    if (!debouncedDisplayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (debouncedDisplayName.length < VALIDATION_RULES.displayName.minLength) {
      newErrors.displayName = `Display name must be at least ${VALIDATION_RULES.displayName.minLength} characters`;
    } else if (debouncedDisplayName.length > VALIDATION_RULES.displayName.maxLength) {
      newErrors.displayName = `Display name must be ${VALIDATION_RULES.displayName.maxLength} characters or less`;
    }

    // Photo URL validation
    if (debouncedPhotoURL && !VALIDATION_RULES.photoURL.urlPattern.test(debouncedPhotoURL)) {
      newErrors.photoURL = 'Photo URL must be a valid HTTP/HTTPS URL';
    }

    setUiState(prev => ({ ...prev, errors: newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [debouncedDisplayName, debouncedPhotoURL]);

  // Run validation when debounced values change
  useEffect(() => {
    if (formState.isEditing) {
      validateForm();
    }
  }, [debouncedDisplayName, debouncedPhotoURL, formState.isEditing, validateForm]);

  // File upload handler with improved error handling
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!VALIDATION_RULES.file.allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: `Please select an image file. Supported formats: ${VALIDATION_RULES.file.allowedTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()}`,
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > VALIDATION_RULES.file.maxSize) {
      const maxSizeMB = VALIDATION_RULES.file.maxSize / (1024 * 1024);
      toast({
        title: "File Too Large",
        description: `Image must be smaller than ${maxSizeMB}MB. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB`,
        variant: "destructive",
      });
      return;
    }

    // Create preview URL with cleanup
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUiState(prev => ({ ...prev, previewURL: result }));
      setFormState(prev => ({ ...prev, photoURL: result }));
      
      toast({
        title: "Image Uploaded",
        description: "Image preview loaded successfully. Don't forget to save your changes.",
        duration: 3000,
      });
    };
    
    reader.onerror = () => {
      toast({
        title: "Upload Failed",
        description: "Failed to read the selected file. Please try again.",
        variant: "destructive",
      });
    };
    
    reader.readAsDataURL(file);
    
    // Clear the input for future uploads
    event.target.value = '';
  }, []);

  // Enhanced save handler with better error handling and retry logic
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setFormState(prev => ({ ...prev, isLoading: true }));
    setUiState(prev => ({ ...prev, lastSaveAttempt: new Date() }));

    try {
      const updates: Record<string, any> = {};
      
      if (formState.displayName !== (user.displayName || '')) {
        updates.displayName = formState.displayName.trim();
      }
      
      if (formState.photoURL !== (user.photoURL || '')) {
        updates.photoURL = formState.photoURL || null;
      }

      // Get Firebase Auth token with retry
      let token: string;
      try {
        token = await user.getIdToken(true); // Force refresh
      } catch (tokenError) {
        throw new Error('Authentication failed. Please sign in again.');
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Session expired. Please sign in again.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment before trying again.');
        } else {
          throw new Error(data.error || `Failed to update profile (${response.status})`);
        }
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        duration: 4000,
        action: (
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        ),
      });

      setFormState(prev => ({ ...prev, isEditing: false }));
      setUiState(prev => ({ 
        ...prev, 
        previewURL: null, 
        errors: {},
        lastSaveAttempt: new Date()
      }));

      // Soft refresh the page to update user context
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      console.error('Profile update error:', error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile. Please try again.";
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={handleSave}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        ),
      });
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
      abortControllerRef.current = null;
    }
  }, [validateForm, formState.displayName, formState.photoURL, user]);

  // Cancel handler with unsaved changes warning
  const handleCancel = useCallback(() => {
    if (hasChanges) {
      setUiState(prev => ({ ...prev, showUnsavedWarning: true }));
    } else {
      cancelEdit();
    }
  }, [hasChanges]);

  const cancelEdit = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setFormState({
      isEditing: false,
      isLoading: false,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
    });
    
    setUiState({
      previewURL: null,
      errors: {},
      showUnsavedWarning: false,
      lastSaveAttempt: null
    });
  }, [user.displayName, user.photoURL]);

  const confirmCancel = useCallback(() => {
    cancelEdit();
  }, [cancelEdit]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Cleanup preview URL
      if (uiState.previewURL && uiState.previewURL.startsWith('data:')) {
        // For data URLs, no cleanup needed, but we can clear the state
        setUiState(prev => ({ ...prev, previewURL: null }));
      }
    };
  }, [uiState.previewURL]);

  return (
    <>
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Profile Information</h3>
          {!formState.isEditing && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFormState(prev => ({ ...prev, isEditing: true }))}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={uiState.previewURL || formState.photoURL || user.photoURL || undefined} 
                  alt={user.displayName || 'User'} 
                />
                <AvatarFallback className="text-lg">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              {formState.isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                  disabled={formState.isLoading}
                  aria-label="Change profile picture"
                >
                  <Camera className="h-3 w-3" />
                </button>
              )}
            </div>
            
            {formState.isEditing && (
              <div className="flex-1 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={formState.isLoading}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG, WebP up to 5MB
                </p>
                {uiState.lastSaveAttempt && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Last saved: {uiState.lastSaveAttempt.toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Display Name Section */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            {formState.isEditing ? (
              <div className="space-y-1">
                <Input
                  id="displayName"
                  value={formState.displayName}
                  onChange={(e) => {
                    setFormState(prev => ({ ...prev, displayName: e.target.value }));
                    // Clear error when user starts typing
                    if (uiState.errors.displayName) {
                      setUiState(prev => ({
                        ...prev,
                        errors: { ...prev.errors, displayName: '' }
                      }));
                    }
                  }}
                  placeholder="Enter your display name"
                  maxLength={VALIDATION_RULES.displayName.maxLength}
                  disabled={formState.isLoading}
                  className={uiState.errors.displayName ? 'border-destructive' : ''}
                  aria-describedby={uiState.errors.displayName ? 'displayName-error' : undefined}
                />
                {uiState.errors.displayName && (
                  <p id="displayName-error" className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {uiState.errors.displayName}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {formState.displayName.length}/{VALIDATION_RULES.displayName.maxLength} characters
                </p>
              </div>
            ) : (
              <p className="p-2 bg-muted rounded-md">
                {user.displayName || 'No display name set'}
              </p>
            )}
          </div>

          {/* Email Section (Read-only) */}
          <div className="space-y-2">
            <Label>Email Address</Label>
            <p className="p-2 bg-muted rounded-md text-muted-foreground">
              {user.email}
              <span className="ml-2 text-xs">(Cannot be changed)</span>
            </p>
          </div>

          {/* Photo URL Section (Advanced) */}
          {formState.isEditing && (
            <div className="space-y-2">
              <Label htmlFor="photoURL">Photo URL (Advanced)</Label>
              <div className="space-y-1">
                <Input
                  id="photoURL"
                  value={formState.photoURL}
                  onChange={(e) => {
                    setFormState(prev => ({ ...prev, photoURL: e.target.value }));
                    if (uiState.errors.photoURL) {
                      setUiState(prev => ({
                        ...prev,
                        errors: { ...prev.errors, photoURL: '' }
                      }));
                    }
                  }}
                  placeholder="https://example.com/photo.jpg"
                  disabled={formState.isLoading}
                  className={uiState.errors.photoURL ? 'border-destructive' : ''}
                  aria-describedby={uiState.errors.photoURL ? 'photoURL-error' : undefined}
                />
                {uiState.errors.photoURL && (
                  <p id="photoURL-error" className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {uiState.errors.photoURL}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Or upload a photo using the camera button above
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {formState.isEditing && (
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSave}
                disabled={formState.isLoading || !hasChanges || Object.keys(uiState.errors).some(key => uiState.errors[key])}
                className="gap-2"
              >
                {formState.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {formState.isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline"
                onClick={handleCancel}
                disabled={formState.isLoading}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={VALIDATION_RULES.file.allowedTypes.join(',')}
          onChange={handleFileUpload}
          className="hidden"
          aria-label="Select profile picture"
        />
      </Card>

      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={uiState.showUnsavedWarning} onOpenChange={(open) => setUiState(prev => ({ ...prev, showUnsavedWarning: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to cancel? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUiState(prev => ({ ...prev, showUnsavedWarning: false }))}>
              Continue Editing
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancel}
              className="bg-destructive hover:bg-destructive/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}