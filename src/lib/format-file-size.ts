/**
 * Formats file size in bytes to a human-readable string
 * @param bytes - The file size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string (e.g., "1.23 MB", "456 KB", "2.1 GB")
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formats multiple files total size
 * @param files - Array of files or file sizes in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted total size string
 */
export function formatTotalFileSize(files: (File | number)[], decimals = 2): string {
  const totalBytes = files.reduce((total: number, file) => {
    return total + (file instanceof File ? file.size : file);
  }, 0);
  
  return formatFileSize(totalBytes, decimals);
}
