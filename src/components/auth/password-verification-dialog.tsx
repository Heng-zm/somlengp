"use client";

import { useState, useCallback } from 'react';
import { Eye, EyeOff, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThreeDotsLoader } from '@/components/shared/three-dots-loader';

interface PasswordVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerifyAndDelete: (password: string) => Promise<boolean>;
  userEmail?: string;
  isLoading?: boolean;
}

export function PasswordVerificationDialog({
  open,
  onOpenChange,
  onVerifyAndDelete,
  userEmail,
  isLoading = false
}: PasswordVerificationDialogProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setPassword('');
    setShowPassword(false);
    setError(null);
    onOpenChange(false);
  }, [isSubmitting, onOpenChange]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await onVerifyAndDelete(password);
      if (success) {
        // Account deleted successfully, dialog will be closed by parent
        setPassword('');
        setShowPassword(false);
      } else {
        setError('Failed to delete account. Please try again.');
      }
    } catch (error) {
      console.error('Password verification failed:', error);
      setError('Invalid password or authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [password, onVerifyAndDelete]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
              <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <DialogTitle className="text-center text-xl font-semibold">
            Verify Your Identity
          </DialogTitle>
          
          <DialogDescription className="text-center text-sm text-gray-600 dark:text-gray-400">
            For your security, please enter your password to confirm account deletion.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Warning Alert */}
          <Alert className="border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
            </AlertDescription>
          </Alert>

          {/* Email Display */}
          {userEmail && (
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Account: <span className="font-medium text-gray-900 dark:text-gray-100">{userEmail}</span>
              </p>
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="pr-10"
                disabled={isSubmitting}
                autoComplete="current-password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={togglePasswordVisibility}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
                <span className="sr-only">
                  {showPassword ? 'Hide password' : 'Show password'}
                </span>
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!password.trim() || isSubmitting || isLoading}
              className="w-full sm:w-auto"
            >
              {isSubmitting || isLoading ? (
                <>
                  <ThreeDotsLoader />
                  <span className="ml-2">Deleting Account...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
