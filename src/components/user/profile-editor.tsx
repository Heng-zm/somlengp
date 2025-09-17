"use client";

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
// Dialog components removed - not currently used
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
// Performance optimization needed: Consider memoizing inline event handlers, dynamic classNames
// Use useMemo for objects/arrays and useCallback for functions

  Edit, 
  Camera, 
  Save, 
  X, 
  Upload,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface ProfileEditorProps {
  className?: string;
}

export function ProfileEditor({ className }: ProfileEditorProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  // Removed unused pendingClose state
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  // Check if there are unsaved changes
  const hasChanges = () => {
    return (
      displayName !== (user.displayName || '') ||
      photoURL !== (user.photoURL || '') ||
      previewURL !== null
    );
  };

  // Validate form data
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.length > 50) {
      newErrors.displayName = 'Display name must be 50 characters or less';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    if (photoURL && !photoURL.match(/^https?:\/\/.+/)) {
      newErrors.photoURL = 'Photo URL must be a valid HTTP/HTTPS URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewURL(result);
      // For now, we'll use the data URL. In production, you'd upload to Firebase Storage
      setPhotoURL(result);
    };
    reader.readAsDataURL(file);
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const updates: Record<string, any> = {};
      
      if (displayName !== (user.displayName || '')) {
        updates.displayName = displayName.trim();
      }
      
      if (photoURL !== (user.photoURL || '')) {
        updates.photoURL = photoURL || null;
      }

      // Get Firebase Auth token
      const token = await user.getIdToken();

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        duration: 3000,
      });

      setIsEditing(false);
      setPreviewURL(null);
      setErrors({});

      // Force user context to refresh
      window.location.reload();

    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasChanges()) {
      setShowUnsavedWarning(true);
    } else {
      cancelEdit();
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDisplayName(user.displayName || '');
    setPhotoURL(user.photoURL || '');
    setPreviewURL(null);
    setErrors({});
    setShowUnsavedWarning(false);
  };

  const confirmCancel = () => {
    cancelEdit();
  };

  return (
    <>
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Profile Information</h3>
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
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
                  src={previewURL || photoURL || user.photoURL || undefined} 
                  alt={user.displayName || 'User'} 
                />
                <AvatarFallback className="text-lg">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors"
                  disabled={isLoading}
                >
                  <Camera className="h-3 w-3" />
                </button>
              )}
            </div>
            
            {isEditing && (
              <div className="flex-1 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG up to 5MB
                </p>
              </div>
            )}
          </div>

          {/* Display Name Section */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            {isEditing ? (
              <div className="space-y-1">
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (errors.displayName) {
                      const newErrors = { ...errors };
                      delete newErrors.displayName;
                      setErrors(newErrors);
                    }
                  }}
                  placeholder="Enter your display name"
                  maxLength={50}
                  disabled={isLoading}
                  className={errors.displayName ? 'border-destructive' : ''}
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.displayName}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {displayName.length}/50 characters
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
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="photoURL">Photo URL (Advanced)</Label>
              <div className="space-y-1">
                <Input
                  id="photoURL"
                  value={photoURL}
                  onChange={(e) => {
                    setPhotoURL(e.target.value);
                    if (errors.photoURL) {
                      const newErrors = { ...errors };
                      delete newErrors.photoURL;
                      setErrors(newErrors);
                    }
                  }}
                  placeholder="https://example.com/photo.jpg"
                  disabled={isLoading}
                  className={errors.photoURL ? 'border-destructive' : ''}
                />
                {errors.photoURL && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.photoURL}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Or upload a photo using the camera button above
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSave}
                disabled={isLoading || !hasChanges()}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
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
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </Card>

      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
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
            <AlertDialogCancel onClick={() => setShowUnsavedWarning(false)}>
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