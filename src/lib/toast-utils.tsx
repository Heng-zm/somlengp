import { toast } from '@/hooks/use-toast';
import { safeSync, ValidationError, errorHandler } from './error-utils';

// Modern toast utility functions with emoji icons for enhanced UX
// All functions include comprehensive error handling and input validation

// Constants for validation
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_FILE_NAME_LENGTH = 100;

/**
 * Validates and sanitizes toast input parameters
 */
function validateToastInput(
  title: string, 
  description?: string, 
  context: Record<string, any> = {}
): { sanitizedTitle: string; sanitizedDescription?: string } {
  // Validate title
  if (!title || typeof title !== 'string') {
    throw new ValidationError('Toast title must be a non-empty string', { title, ...context });
  }
  
  let sanitizedTitle = title.trim();
  if (sanitizedTitle.length === 0) {
    throw new ValidationError('Toast title cannot be empty after trimming', { title, ...context });
  }
  
  // Truncate title if too long
  if (sanitizedTitle.length > MAX_TITLE_LENGTH) {
    console.warn(`Toast title truncated from ${sanitizedTitle.length} to ${MAX_TITLE_LENGTH} characters`);
    sanitizedTitle = sanitizedTitle.substring(0, MAX_TITLE_LENGTH - 3) + '...';
  }
  
  let sanitizedDescription = description;
  if (description !== undefined) {
    if (typeof description !== 'string') {
      throw new ValidationError('Toast description must be a string', { description, ...context });
    }
    
    sanitizedDescription = description.trim();
    
    // Truncate description if too long
    if (sanitizedDescription.length > MAX_DESCRIPTION_LENGTH) {
      console.warn(`Toast description truncated from ${sanitizedDescription.length} to ${MAX_DESCRIPTION_LENGTH} characters`);
      sanitizedDescription = sanitizedDescription.substring(0, MAX_DESCRIPTION_LENGTH - 3) + '...';
    }
  }
  
  return { sanitizedTitle, sanitizedDescription };
}

/**
 * Safe wrapper for creating toast notifications with error handling
 */
function safeToast(
  variant: string,
  title: string,
  description?: string,
  context: Record<string, any> = {}
): ReturnType<typeof toast> | null {
  const { data: result, error } = safeSync(
    () => {
      const { sanitizedTitle, sanitizedDescription } = validateToastInput(title, description, context);
      
      return toast({
        variant: variant as any,
        title: sanitizedTitle,
        description: sanitizedDescription,
      });
    },
    null,
    { operation: 'createToast', variant, ...context }
  );
  
  if (error) {
    errorHandler.handle(error, { function: 'safeToast', variant, title: title?.substring(0, 50) });
    
    // Create fallback toast with safe content
    try {
      return toast({
        variant: 'destructive' as any,
        title: 'Error',
        description: 'Failed to display toast message',
      });
    } catch (fallbackError) {
      console.error('Even fallback toast failed:', fallbackError);
      return null;
    }
  }
  
  return result;
}

export const showSuccessToast = (title: string, description?: string) => {
  return safeToast('success', `✅ ${title}`, description, { type: 'success' });
};

export const showErrorToast = (title: string, description?: string) => {
  return safeToast('error', `❌ ${title}`, description, { type: 'error' });
};

export const showWarningToast = (title: string, description?: string) => {
  return safeToast('warning', `⚠️ ${title}`, description, { type: 'warning' });
};

export const showInfoToast = (title: string, description?: string) => {
  return safeToast('info', `ℹ️ ${title}`, description, { type: 'info' });
};

export const showLoadingToast = (title: string, description?: string) => {
  return safeToast('default', `⏳ ${title}`, description, { type: 'loading' });
};

// Specialized toast functions for common use cases
export const showAuthSuccessToast = (action: string) => {
  return showSuccessToast(
    "🛡️ Authentication Success", 
    `Successfully ${action}! Welcome back.`
  );
};

export const showAuthErrorToast = (error: string) => {
  return showErrorToast(
    "🔒 Authentication Error", 
    error
  );
};

// File processing toast functions with enhanced error handling
export const showFileProcessingSuccessToast = (action: string, fileName?: string, fileCount?: number) => {
  return safeSync(
    () => {
      // Validate inputs
      if (!action || typeof action !== 'string') {
        throw new ValidationError('Action must be a non-empty string', { action });
      }
      
      if (fileName && typeof fileName !== 'string') {
        throw new ValidationError('fileName must be a string', { fileName });
      }
      
      if (fileCount && (!Number.isInteger(fileCount) || fileCount <= 0)) {
        throw new ValidationError('fileCount must be a positive integer', { fileCount });
      }
      
      // Sanitize filename
      const safeFileName = fileName ? fileName.substring(0, MAX_FILE_NAME_LENGTH) : undefined;
      
      let title: string;
      let description: string;
      
      if (fileCount && fileCount > 1) {
        title = "✅ Files Processed Successfully!";
        description = `${fileCount} files have been ${action} successfully and are ready for download.`;
      } else if (safeFileName) {
        title = "✅ File Processing Complete!";
        description = `${safeFileName} has been ${action} successfully. Your file is ready!`;
      } else {
        title = "✅ Processing Complete!";
        description = `File has been ${action} successfully and is ready for download.`;
      }
      
      return safeToast('success', title, description, { type: 'file-processing', action, fileName: safeFileName, fileCount });
    },
    null,
    { operation: 'showFileProcessingSuccessToast', action, fileName, fileCount }
  ).data;
};

export const showFileProcessingErrorToast = (error: string, fileName?: string) => {
  return safeSync(
    () => {
      if (!error || typeof error !== 'string') {
        throw new ValidationError('Error message must be a non-empty string', { error });
      }
      
      const safeFileName = fileName ? fileName.substring(0, MAX_FILE_NAME_LENGTH) : undefined;
      const title = safeFileName ? `❌ Failed to Process ${safeFileName}` : "❌ File Processing Failed";
      
      return safeToast('error', title, `${error} Please try again or contact support if the issue persists.`, 
        { type: 'file-processing-error', error, fileName: safeFileName });
    },
    null,
    { operation: 'showFileProcessingErrorToast', error, fileName }
  ).data;
};

export const showFileProcessingStartToast = (action: string, fileCount?: number) => {
  return safeSync(
    () => {
      if (!action || typeof action !== 'string') {
        throw new ValidationError('Action must be a non-empty string', { action });
      }
      
      if (fileCount && (!Number.isInteger(fileCount) || fileCount <= 0)) {
        throw new ValidationError('fileCount must be a positive integer', { fileCount });
      }
      
      let title: string;
      let description: string;
      
      if (fileCount && fileCount > 1) {
        title = "🔄 Processing Files...";
        description = `Starting to ${action} ${fileCount} files. Please wait...`;
      } else {
        title = "🔄 Processing File...";
        description = `Starting to ${action} your file. This may take a moment...`;
      }
      
      return safeToast('info', title, description, { type: 'file-processing-start', action, fileCount });
    },
    null,
    { operation: 'showFileProcessingStartToast', action, fileCount }
  ).data;
};

// Progress notification functions
export const showProgressToast = (title: string, progress: number, description?: string) => {
  return safeSync(
    () => {
      if (!title || typeof title !== 'string') {
        throw new ValidationError('Title must be a non-empty string', { title });
      }
      
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        throw new ValidationError('Progress must be a number between 0 and 100', { progress });
      }
      
      const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
      const progressDesc = description ? `${description} [${progressBar}] ${Math.round(progress)}%` : `${progressBar} ${Math.round(progress)}%`;
      
      return safeToast('info', `🔄 ${title}`, progressDesc, { type: 'progress', progress });
    },
    null,
    { operation: 'showProgressToast', title, progress }
  ).data;
};

export const showConfirmationToast = (
  title: string, 
  description: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
) => {
  return safeSync(
    () => {
      if (!title || typeof title !== 'string') {
        throw new ValidationError('Title must be a non-empty string', { title });
      }
      
      if (!description || typeof description !== 'string') {
        throw new ValidationError('Description must be a non-empty string', { description });
      }
      
      if (typeof onConfirm !== 'function') {
        throw new ValidationError('onConfirm must be a function', { onConfirm });
      }
      
      return toast({
        variant: 'warning' as any,
        title: `⚠️ ${title}`,
        description,
        action: (
          <div className="flex gap-2">
            <button
              onClick={() => {
                onConfirm();
                // The toast will auto-dismiss
              }}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
            >
              {confirmText}
            </button>
            <button
              onClick={() => {
                onCancel?.();
                // The toast will auto-dismiss
              }}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
            >
              {cancelText}
            </button>
          </div>
        ) as any,
      });
    },
    null,
    { operation: 'showConfirmationToast', title }
  ).data;
};

export const showBatchOperationToast = (
  operation: string,
  total: number,
  completed: number,
  failed: number = 0
) => {
  return safeSync(
    () => {
      if (!operation || typeof operation !== 'string') {
        throw new ValidationError('Operation must be a non-empty string', { operation });
      }
      
      if (!Number.isInteger(total) || total <= 0) {
        throw new ValidationError('Total must be a positive integer', { total });
      }
      
      if (!Number.isInteger(completed) || completed < 0) {
        throw new ValidationError('Completed must be a non-negative integer', { completed });
      }
      
      if (!Number.isInteger(failed) || failed < 0) {
        throw new ValidationError('Failed must be a non-negative integer', { failed });
      }
      
      const progress = Math.round((completed / total) * 100);
      const remaining = total - completed - failed;
      
      let variant: string;
      let emoji: string;
      let title: string;
      
      if (completed === total && failed === 0) {
        variant = 'success';
        emoji = '✅';
        title = `${operation} Complete!`;
      } else if (failed > 0 && completed + failed === total) {
        variant = 'warning';
        emoji = '⚠️';
        title = `${operation} Complete with Errors`;
      } else {
        variant = 'info';
        emoji = '🔄';
        title = `${operation} in Progress`;
      }
      
      const description = `${completed}/${total} completed${failed > 0 ? `, ${failed} failed` : ''}${remaining > 0 ? `, ${remaining} remaining` : ''}`;
      
      return safeToast(variant, `${emoji} ${title}`, description, { 
        type: 'batch-operation', 
        operation, 
        total, 
        completed, 
        failed 
      });
    },
    null,
    { operation: 'showBatchOperationToast', operationType: operation, total, completed, failed }
  ).data;
};

export const showNetworkStatusToast = (isOnline: boolean, wasOffline: boolean = false) => {
  return safeSync(
    () => {
      if (typeof isOnline !== 'boolean') {
        throw new ValidationError('isOnline must be a boolean', { isOnline });
      }
      
      if (isOnline) {
        if (wasOffline) {
          return showSuccessToast(
            '🌐 Connection Restored',
            'You are back online! All features are now available.'
          );
        }
      } else {
        return showErrorToast(
          '📴 Connection Lost',
          'You are currently offline. Some features may not be available.'
        );
      }
      
      return null;
    },
    null,
    { operation: 'showNetworkStatusToast', isOnline, wasOffline }
  ).data;
};

export const showUpdateAvailableToast = (version: string, onUpdate?: () => void) => {
  return safeSync(
    () => {
      if (!version || typeof version !== 'string') {
        throw new ValidationError('Version must be a non-empty string', { version });
      }
      
      return toast({
        variant: 'info' as any,
        title: '🆕 Update Available',
        description: `Version ${version} is now available with new features and improvements.`,
        action: onUpdate ? (
          <button
            onClick={onUpdate}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
          >
            Update Now
          </button>
        ) as any : undefined,
      });
    },
    null,
    { operation: 'showUpdateAvailableToast', version }
  ).data;
};

export const showMaintenanceToast = (message: string, scheduledTime?: Date) => {
  return safeSync(
    () => {
      if (!message || typeof message !== 'string') {
        throw new ValidationError('Message must be a non-empty string', { message });
      }
      
      let description = message;
      if (scheduledTime) {
        const timeStr = scheduledTime.toLocaleString();
        description += ` Scheduled for ${timeStr}.`;
      }
      
      return showWarningToast(
        '🔧 Maintenance Notice',
        description
      );
    },
    null,
    { operation: 'showMaintenanceToast', message, scheduledTime }
  ).data;
};

export const showPermissionToast = (permission: string, granted: boolean, required: boolean = true) => {
  return safeSync(
    () => {
      if (!permission || typeof permission !== 'string') {
        throw new ValidationError('Permission must be a non-empty string', { permission });
      }
      
      if (typeof granted !== 'boolean') {
        throw new ValidationError('Granted must be a boolean', { granted });
      }
      
      if (granted) {
        return showSuccessToast(
          `🔑 ${permission} Permission Granted`,
          'You can now use all features that require this permission.'
        );
      } else {
        const variant = required ? 'error' : 'warning';
        const description = required 
          ? `This permission is required for the feature to work properly. Please grant access in your browser settings.`
          : `Some features may be limited without this permission.`;
        
        return safeToast(variant, `🚫 ${permission} Permission Denied`, description, { 
          type: 'permission', 
          permission, 
          granted, 
          required 
        });
      }
    },
    null,
    { operation: 'showPermissionToast', permission, granted, required }
  ).data;
};

// Custom toast with action buttons
export const showActionToast = (
  title: string,
  description: string,
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>
) => {
  return safeSync(
    () => {
      if (!title || typeof title !== 'string') {
        throw new ValidationError('Title must be a non-empty string', { title });
      }
      
      if (!Array.isArray(actions) || actions.length === 0) {
        throw new ValidationError('Actions must be a non-empty array', { actions });
      }
      
      actions.forEach((action, index) => {
        if (!action.label || typeof action.label !== 'string') {
          throw new ValidationError(`Action ${index} must have a label`, { action, index });
        }
        if (typeof action.onClick !== 'function') {
          throw new ValidationError(`Action ${index} onClick must be a function`, { action, index });
        }
      });
      
      return toast({
        variant: 'default' as any,
        title,
        description,
        action: (
          <div className="flex gap-2">
            {actions.map((action, index) => {
              const baseClass = "px-3 py-1 rounded text-sm transition-colors";
              let variantClass = "";
              
              switch (action.variant) {
                case 'primary':
                  variantClass = "bg-blue-500 text-white hover:bg-blue-600";
                  break;
                case 'danger':
                  variantClass = "bg-red-500 text-white hover:bg-red-600";
                  break;
                default:
                  variantClass = "bg-gray-500 text-white hover:bg-gray-600";
              }
              
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`${baseClass} ${variantClass}`}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        ) as any,
      });
    },
    null,
    { operation: 'showActionToast', title, actionsCount: actions.length }
  ).data;
};

// Typing indicator toast
export const showTypingIndicatorToast = (user: string) => {
  return safeSync(
    () => {
      if (!user || typeof user !== 'string') {
        throw new ValidationError('User must be a non-empty string', { user });
      }
      
      return safeToast('info', '💬 Typing...', `${user} is typing a message...`, { type: 'typing-indicator', user });
    },
    null,
    { operation: 'showTypingIndicatorToast', user }
  ).data;
};

// Achievement toast
export const showAchievementToast = (achievement: string, description?: string) => {
  return safeSync(
    () => {
      if (!achievement || typeof achievement !== 'string') {
        throw new ValidationError('Achievement must be a non-empty string', { achievement });
      }
      
      return safeToast('success', `🏆 ${achievement}`, description || 'Congratulations on your achievement!', {
        type: 'achievement',
        achievement
      });
    },
    null,
    { operation: 'showAchievementToast', achievement }
  ).data;
};

// System notification toast
export const showSystemToast = (title: string, description?: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
  return safeSync(
    () => {
      if (!title || typeof title !== 'string') {
        throw new ValidationError('Title must be a non-empty string', { title });
      }
      
      const priorityEmojis = {
        low: 'ℹ️',
        medium: '📢',
        high: '⚠️',
        critical: '🚨'
      };
      
      const variant = priority === 'critical' ? 'destructive' : priority === 'high' ? 'warning' : 'info';
      
      return safeToast(variant, `${priorityEmojis[priority]} ${title}`, description, {
        type: 'system',
        priority
      });
    },
    null,
    { operation: 'showSystemToast', title, priority }
  ).data;
};

export const showFileUploadSuccessToast = (fileName: string, fileCount?: number) => {
  return safeSync(
    () => {
      if (!fileName || typeof fileName !== 'string') {
        throw new ValidationError('fileName must be a non-empty string', { fileName });
      }
      
      if (fileCount && (!Number.isInteger(fileCount) || fileCount <= 0)) {
        throw new ValidationError('fileCount must be a positive integer', { fileCount });
      }
      
      const safeFileName = fileName.substring(0, MAX_FILE_NAME_LENGTH);
      
      const title = fileCount && fileCount > 1 
        ? `✅ ${fileCount} Files Uploaded!` 
        : "✅ File Uploaded Successfully!";
      const description = fileCount && fileCount > 1 
        ? `${fileCount} files have been uploaded and are ready for processing.`
        : `${safeFileName} has been uploaded successfully. Ready to proceed!`;
        
      return safeToast('success', title, description, { type: 'file-upload', fileName: safeFileName, fileCount });
    },
    null,
    { operation: 'showFileUploadSuccessToast', fileName, fileCount }
  ).data;
};

export const showFileValidationErrorToast = (fileName: string, reason: string) => {
  return showWarningToast(
    "Invalid File Format", 
    `${fileName} cannot be processed: ${reason}. Please select a valid file format.`
  );
};

export const showFileSizeErrorToast = (fileName: string, maxSize: string) => {
  return showWarningToast(
    "File Too Large", 
    `${fileName} exceeds the maximum file size limit of ${maxSize}. Please choose a smaller file.`
  );
};

export const showNetworkErrorToast = () => {
  return showErrorToast("Network Error", "Please check your internet connection and try again.");
};

export const showValidationErrorToast = (field: string) => {
  return showWarningToast("Validation Error", `Please check the ${field} field and try again.`);
};

// Text-to-Speech specific toast functions
export const showTTSSuccessToast = (voiceName?: string) => {
  const title = "🎵 Audio Generated Successfully!";
  const description = voiceName 
    ? `Your text has been converted to speech using ${voiceName}. Audio is ready for playback or download!`
    : "Your text has been converted to speech successfully. Audio is ready for playback or download!";
  return showSuccessToast(title, description);
};

export const showTTSErrorToast = (error: string, voiceName?: string) => {
  const title = "Audio Generation Failed";
  const description = voiceName 
    ? `Failed to generate speech with ${voiceName}: ${error} Please try again or select a different voice.`
    : `Audio generation failed: ${error} Please try again.`;
  return showErrorToast(title, description);
};

export const showTTSProcessingToast = (voiceName?: string) => {
  const title = "🎙️ Generating Audio...";
  const description = voiceName 
    ? `Converting your text to speech using ${voiceName}. This may take a moment.`
    : "Converting your text to speech. This may take a moment.";
  return showLoadingToast(title, description);
};

export const showTTSInputRequiredToast = () => {
  return showWarningToast(
    "✏️ Text Required", 
    "Please enter some text to generate audio. The text field cannot be empty."
  );
};

export const showTTSTextTooLongToast = (maxLength: number) => {
  return showWarningToast(
    "📏 Text Too Long", 
    `Text exceeds the maximum length of ${maxLength} characters. Please shorten your text and try again.`
  );
};

export const showVoicePreviewErrorToast = (voiceName: string) => {
  return showErrorToast(
    "Voice Preview Failed", 
    `Unable to generate preview for ${voiceName}. Please try again or select a different voice.`
  );
};

export const showVoicePreviewSuccessToast = (voiceName: string) => {
  return showSuccessToast(
    "🎧 Voice Preview Ready!", 
    `Preview audio for ${voiceName} is ready. Click play to listen.`
  );
};

// AI Assistant and shared component toast functions
export const showAIAssistantErrorToast = (error: string, isAuthenticated = true) => {
  const title = "AI Assistant Error";
  let description: string;
  
  if (!isAuthenticated) {
    description = "Please sign in to use the AI Assistant. Authentication is required for this feature.";
  } else if (error.toLowerCase().includes('quota')) {
    description = "API quota exceeded. Please try again later or contact support.";
  } else if (error.toLowerCase().includes('safety')) {
    description = "Your message was filtered for safety. Please rephrase your request.";
  } else if (error.toLowerCase().includes('network')) {
    description = "Network error occurred. Please check your connection and try again.";
  } else {
    description = `${error} Please try again or contact support if the problem persists.`;
  }
  
  return showErrorToast(title, description);
};

export const showAIAssistantSuccessToast = (action: string) => {
  return showSuccessToast(
    "🤖 AI Assistant Ready!", 
    `${action} Your AI assistant is ready to help with questions, creative tasks, and more!`
  );
};

export const showMessageCopiedToast = () => {
  return showSuccessToast(
    "📋 Copied to Clipboard!", 
    "Message has been copied to your clipboard successfully."
  );
};

export const showCopyErrorToast = () => {
  return showErrorToast(
    "Copy Failed", 
    "Unable to copy message to clipboard. Please try selecting and copying manually."
  );
};

export const showAuthRequiredToast = (feature: string) => {
  return showWarningToast(
    "🔐 Authentication Required", 
    `Please sign in to use ${feature}. This feature requires user authentication.`
  );
};

export const showConnectionLostToast = () => {
  return showWarningToast(
    "📡 Connection Lost", 
    "Lost connection to the server. Please check your internet connection and try again."
  );
};

export const showConnectionRestoredToast = () => {
  return showSuccessToast(
    "📡 Connection Restored!", 
    "Connection to the server has been restored. You can continue using the application."
  );
};

export const showFeatureUnavailableToast = (feature: string) => {
  return showWarningToast(
    "🚧 Feature Unavailable", 
    `${feature} is currently unavailable. Please try again later or contact support.`
  );
};

export const showMaintenanceModeToast = () => {
  return showInfoToast(
    "🔧 Maintenance Mode", 
    "The system is currently under maintenance. Some features may be temporarily unavailable."
  );
};

export const showDataSavedToast = (dataType: string) => {
  return showSuccessToast(
    "💾 Data Saved Successfully!", 
    `Your ${dataType} has been saved and will be preserved for future sessions.`
  );
};

export const showDataLoadedToast = (dataType: string) => {
  return showSuccessToast(
    "📂 Data Loaded!", 
    `Your ${dataType} has been loaded successfully. You can continue where you left off.`
  );
};

export const showExportSuccessToast = (format: string, fileName?: string) => {
  const title = "📤 Export Complete!";
  const description = fileName 
    ? `${fileName} has been exported as ${format.toUpperCase()} and is ready for download.`
    : `Your data has been exported as ${format.toUpperCase()} successfully.`;
  return showSuccessToast(title, description);
};

export const showImportSuccessToast = (format: string, itemCount?: number) => {
  const title = "📥 Import Complete!";
  const description = itemCount 
    ? `Successfully imported ${itemCount} items from ${format.toUpperCase()} file.`
    : `Your ${format.toUpperCase()} file has been imported successfully.`;
  return showSuccessToast(title, description);
};

// Additional utility functions with error handling
export const showNotificationToast = (title: string, message: string, isImportant = false) => {
  return safeToast(
    isImportant ? 'info' : 'default',
    `🔔 ${title}`,
    message,
    { type: 'notification', isImportant }
  );
};

// Advanced toast functions for modern UI
export const showAdvancedToast = (options: {
  variant?: 'modern' | 'cyberpunk' | 'organic' | 'sunset' | 'aurora' | 'cosmic' | 'ethereal' | 'holographic' | 'retro' | 'midnight';
  title: string;
  description?: string;
  icon?: string;
  progress?: number;
  priority?: 'whisper' | 'normal' | 'attention' | 'urgent' | 'critical';
  animation?: 'slide' | 'fade' | 'scale' | 'bounce' | 'flip' | 'elastic' | 'spring';
  autoHide?: boolean;
  hideDelay?: number;
  showTimestamp?: boolean;
  onAction?: () => void;
  actionLabel?: string;
}) => {
  return safeSync(
    () => {
      if (!options.title || typeof options.title !== 'string') {
        throw new ValidationError('Title must be a non-empty string', { title: options.title });
      }
      
      return toast({
        variant: 'default' as any,
        title: options.title,
        description: options.description,
        // Additional properties would be handled by the advanced toast component
      });
    },
    null,
    { operation: 'showAdvancedToast', variant: options.variant }
  ).data;
};

export const showCelebrationToast = (title: string, description?: string) => {
  return showAdvancedToast({
    variant: 'holographic',
    title: `🎉 ${title}`,
    description,
    icon: 'celebration',
    priority: 'attention',
    animation: 'bounce',
    showTimestamp: true,
    hideDelay: 8000
  });
};

export const showCyberpunkToast = (title: string, description?: string) => {
  return showAdvancedToast({
    variant: 'cyberpunk',
    title: `⚡ ${title}`,
    description,
    icon: 'default',
    priority: 'attention',
    animation: 'elastic',
    showTimestamp: true,
    hideDelay: 6000
  });
};

export const showProgressToastAdvanced = (title: string, progress: number, options?: {
  variant?: 'modern' | 'organic' | 'cyberpunk';
  description?: string;
  onComplete?: () => void;
}) => {
  return safeSync(
    () => {
      if (!title || typeof title !== 'string') {
        throw new ValidationError('Title must be a non-empty string', { title });
      }
      
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        throw new ValidationError('Progress must be a number between 0 and 100', { progress });
      }
      
      return showAdvancedToast({
        variant: options?.variant || 'modern',
        title,
        description: options?.description,
        progress,
        icon: progress === 100 ? 'success' : 'loading',
        priority: progress === 100 ? 'attention' : 'normal',
        animation: progress === 100 ? 'bounce' : 'fade',
        autoHide: progress === 100,
        onAction: progress === 100 ? options?.onComplete : undefined,
        actionLabel: progress === 100 ? 'View Results' : undefined,
        showTimestamp: progress === 100
      });
    },
    null,
    { operation: 'showProgressToastAdvanced', progress }
  ).data;
};

export const showUrgentToast = (title: string, description: string, options?: {
  onAction?: () => void;
  actionLabel?: string;
  criticalLevel?: boolean;
}) => {
  return safeSync(
    () => {
      if (!title || typeof title !== 'string') {
        throw new ValidationError('Title must be a non-empty string', { title });
      }
      
      return showAdvancedToast({
        variant: 'midnight',
        title: `🚨 ${title}`,
        description,
        icon: 'warning',
        priority: options?.criticalLevel ? 'critical' : 'urgent',
        animation: 'bounce',
        autoHide: false,
        onAction: options?.onAction,
        actionLabel: options?.actionLabel || 'Take Action',
        showTimestamp: true
      });
    },
    null,
    { operation: 'showUrgentToast' }
  ).data;
};

export const showMinimalToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  return showAdvancedToast({
    variant: 'ethereal',
    title: `${icons[type]} ${message}`,
    priority: 'whisper',
    animation: 'fade',
    hideDelay: 3000
  });
};

export const showInteractiveToast = (title: string, description: string, actions: Array<{
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}>) => {
  return safeSync(
    () => {
      if (!title || typeof title !== 'string') {
        throw new ValidationError('Title must be a non-empty string', { title });
      }
      
      if (!Array.isArray(actions) || actions.length === 0) {
        throw new ValidationError('Actions must be a non-empty array', { actions });
      }
      
      // For now, we'll use the first action as the primary action
      const primaryAction = actions[0];
      
      return showAdvancedToast({
        variant: 'modern',
        title,
        description,
        icon: 'info',
        priority: 'attention',
        animation: 'spring',
        autoHide: false,
        onAction: primaryAction.onClick,
        actionLabel: primaryAction.label,
        showTimestamp: true
      });
    },
    null,
    { operation: 'showInteractiveToast', actionsCount: actions.length }
  ).data;
};

export const showThemeToast = (theme: 'aurora' | 'sunset' | 'cosmic' | 'organic', title: string, description?: string) => {
  const themeConfig = {
    aurora: { icon: '🌌', animation: 'elastic' as const },
    sunset: { icon: '🌅', animation: 'fade' as const },
    cosmic: { icon: '✨', animation: 'spring' as const },
    organic: { icon: '🌱', animation: 'bounce' as const }
  };
  
  const config = themeConfig[theme];
  
  return showAdvancedToast({
    variant: theme,
    title: `${config.icon} ${title}`,
    description,
    priority: 'attention',
    animation: config.animation,
    showTimestamp: true,
    hideDelay: 7000
  });
};

// Utility for creating toast sequences/chains
export const showToastSequence = async (toasts: Array<{
  title: string;
  description?: string;
  variant?: string;
  delay?: number;
}>) => {
  return safeSync(
    async () => {
      for (let i = 0; i < toasts.length; i++) {
        const toastConfig = toasts[i];
        
        showAdvancedToast({
          variant: (toastConfig.variant as any) || 'modern',
          title: toastConfig.title,
          description: toastConfig.description,
          icon: i === 0 ? 'info' : 'default',
          priority: i === toasts.length - 1 ? 'attention' : 'normal',
          animation: 'slide',
          hideDelay: 4000 + (i * 1000)
        });
        
        if (i < toasts.length - 1 && toastConfig.delay) {
          await new Promise(resolve => setTimeout(resolve, toastConfig.delay));
        }
      }
    },
    null,
    { operation: 'showToastSequence', count: toasts.length }
  );
};

// Smart toast that adapts based on user preferences
export const showSmartToast = (title: string, description?: string, options?: {
  urgency?: 'low' | 'medium' | 'high';
  category?: 'system' | 'user' | 'error' | 'success';
  adaptToTheme?: boolean;
}) => {
  return safeSync(
    () => {
      const urgency = options?.urgency || 'medium';
      const category = options?.category || 'system';
      
      let variant: any = 'modern';
      let priority: any = 'normal';
      let animation: any = 'slide';
      let hideDelay = 5000;
      
      // Adapt based on urgency
      if (urgency === 'high') {
        variant = 'midnight';
        priority = 'urgent';
        animation = 'bounce';
        hideDelay = 8000;
      } else if (urgency === 'low') {
        variant = 'ethereal';
        priority = 'whisper';
        animation = 'fade';
        hideDelay = 3000;
      }
      
      // Adapt based on category
      if (category === 'error') {
        variant = 'sunset';
        priority = 'urgent';
      } else if (category === 'success') {
        variant = 'organic';
        priority = 'attention';
      }
      
      return showAdvancedToast({
        variant,
        title,
        description,
        priority,
        animation,
        hideDelay,
        showTimestamp: urgency !== 'low'
      });
    },
    null,
    { operation: 'showSmartToast', urgency: options?.urgency, category: options?.category }
  ).data;
};



