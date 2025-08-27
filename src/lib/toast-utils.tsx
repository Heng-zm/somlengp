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
      
      const title = fileCount && fileCount > 1 
        ? `⏳ Processing ${fileCount} Files...` 
        : "⏳ Processing File...";
      const description = `Your ${action} operation is in progress. This may take a moment.`;
      
      return safeToast('default', title, description, { type: 'file-processing-start', action, fileCount });
    },
    null,
    { operation: 'showFileProcessingStartToast', action, fileCount }
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

export const showConfirmationToast = (action: string, details?: string) => {
  return safeSync(
    () => {
      if (!action || typeof action !== 'string') {
        throw new ValidationError('Action must be a non-empty string', { action });
      }
      
      return showSuccessToast(
        "Action Confirmed", 
        `${action}${details ? ` - ${details}` : ''}`
      );
    },
    null,
    { operation: 'showConfirmationToast', action, details }
  ).data;
};

export const showProgressToast = (title: string, progress: number, total?: number) => {
  return safeSync(
    () => {
      if (!title || typeof title !== 'string') {
        throw new ValidationError('Title must be a non-empty string', { title });
      }
      
      if (typeof progress !== 'number' || progress < 0) {
        throw new ValidationError('Progress must be a non-negative number', { progress });
      }
      
      if (total && (typeof total !== 'number' || total <= 0)) {
        throw new ValidationError('Total must be a positive number', { total });
      }
      
      const progressText = total 
        ? `${Math.min(progress, total)}/${total}` 
        : `${Math.min(Math.round(progress), 100)}%`;
      
      return safeToast('default', `⏳ ${title} (${progressText})`, undefined, 
        { type: 'progress', progress, total });
    },
    null,
    { operation: 'showProgressToast', title, progress, total }
  ).data;
};

export const showUpdateAvailableToast = (version: string) => {
  return showInfoToast(
    "📥 Update Available", 
    `Version ${version} is now available. Click to update your application.`
  );
};
