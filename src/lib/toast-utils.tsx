import { toast } from '@/hooks/use-toast';

// Modern toast utility functions with emoji icons for enhanced UX

export const showSuccessToast = (title: string, description?: string) => {
  return toast({
    variant: "success",
    title: `✅ ${title}`,
    description,
  });
};

export const showErrorToast = (title: string, description?: string) => {
  return toast({
    variant: "error",
    title: `❌ ${title}`,
    description,
  });
};

export const showWarningToast = (title: string, description?: string) => {
  return toast({
    variant: "warning",
    title: `⚠️ ${title}`,
    description,
  });
};

export const showInfoToast = (title: string, description?: string) => {
  return toast({
    variant: "info",
    title: `ℹ️ ${title}`,
    description,
  });
};

export const showLoadingToast = (title: string, description?: string) => {
  return toast({
    title: `⏳ ${title}`,
    description,
  });
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

// File processing toast functions
export const showFileProcessingSuccessToast = (action: string, fileName?: string, fileCount?: number) => {
  let title: string;
  let description: string;
  
  if (fileCount && fileCount > 1) {
    title = "✅ Files Processed Successfully!";
    description = `${fileCount} files have been ${action} successfully and are ready for download.`;
  } else if (fileName) {
    title = "✅ File Processing Complete!";
    description = `${fileName} has been ${action} successfully. Your file is ready!`;
  } else {
    title = "✅ Processing Complete!";
    description = `File has been ${action} successfully and is ready for download.`;
  }
  
  return toast({
    variant: "success",
    title,
    description,
  });
};

export const showFileProcessingErrorToast = (error: string, fileName?: string) => {
  const title = fileName ? `❌ Failed to Process ${fileName}` : "❌ File Processing Failed";
  return toast({
    variant: "error",
    title,
    description: `${error} Please try again or contact support if the issue persists.`,
  });
};

export const showFileProcessingStartToast = (action: string, fileCount?: number) => {
  const title = fileCount && fileCount > 1 
    ? `⏳ Processing ${fileCount} Files...` 
    : "⏳ Processing File...";
  const description = `Your ${action} operation is in progress. This may take a moment.`;
  return toast({
    title,
    description,
  });
};

export const showFileUploadSuccessToast = (fileName: string, fileCount?: number) => {
  const title = fileCount && fileCount > 1 
    ? `✅ ${fileCount} Files Uploaded!` 
    : "✅ File Uploaded Successfully!";
  const description = fileCount && fileCount > 1 
    ? `${fileCount} files have been uploaded and are ready for processing.`
    : `${fileName} has been uploaded successfully. Ready to proceed!`;
  return toast({
    variant: "success",
    title,
    description,
  });
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

// Additional utility functions
export const showNotificationToast = (title: string, message: string, isImportant = false) => {
  return toast({
    variant: isImportant ? "info" : "default",
    title: `🔔 ${title}`,
    description: message,
  });
};

export const showConfirmationToast = (action: string, details?: string) => {
  return showSuccessToast(
    "Action Confirmed", 
    `${action}${details ? ` - ${details}` : ''}`
  );
};

export const showProgressToast = (title: string, progress: number, total?: number) => {
  const progressText = total 
    ? `${progress}/${total}` 
    : `${Math.round(progress)}%`;
  
  return toast({
    title: `⏳ ${title} (${progressText})`,
  });
};

export const showUpdateAvailableToast = (version: string) => {
  return showInfoToast(
    "📥 Update Available", 
    `Version ${version} is now available. Click to update your application.`
  );
};
