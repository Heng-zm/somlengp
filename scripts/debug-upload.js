// Debug script to test upload functionality
console.log('Image Resize Upload Debug Script');
console.log('=====================================');

// Helper to simulate file upload testing
function debugUploadState() {
  console.log('Debugging upload state...');
  
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    console.log('Browser environment detected');
    console.log('User Agent:', navigator.userAgent);
    
    // Check for File API support
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      console.log('✅ File API is supported');
    } else {
      console.log('❌ File API is not fully supported');
    }
    
    // Check for drag and drop support
    if ('draggable' in document.createElement('div')) {
      console.log('✅ Drag and drop is supported');
    } else {
      console.log('❌ Drag and drop is not supported');
    }
    
    // Check localStorage for debugging
    try {
      const debugData = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        debugMode: true
      };
      localStorage.setItem('imageResize_debug', JSON.stringify(debugData));
      console.log('✅ Debug data saved to localStorage');
    } catch (error) {
      console.log('⚠️  Could not save to localStorage:', error);
    }
    
  } else {
    console.log('Node.js environment detected');
  }
}

// Export for use in the app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugUploadState };
} else if (typeof window !== 'undefined') {
  window.debugUploadState = debugUploadState;
}

// Run immediately
debugUploadState();