/**
 * File upload security validation
 */

// Whitelist of safe MIME types and extensions
const SAFE_FILE_TYPES = {
  // Documents
  'application/pdf': ['pdf'],
  'text/plain': ['txt', 'text'],
  'text/markdown': ['md', 'markdown'],
  'application/json': ['json'],
  'text/csv': ['csv'],
  
  // Office documents
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  
  // Code
  'text/javascript': ['js', 'mjs'],
  'text/typescript': ['ts'],
  'application/x-typescript': ['ts'],
  'text/x-python': ['py'],
  'text/html': ['html', 'htm'],
  'text/css': ['css'],
  'application/xml': ['xml'],
  
  // Images
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'image/webp': ['webp'],
  'image/svg+xml': ['svg'],
  
  // Video
  'video/mp4': ['mp4'],
  'video/quicktime': ['mov'],
  'video/x-msvideo': ['avi'],
  'video/webm': ['webm'],
  
  // Audio
  'audio/mpeg': ['mp3'],
  'audio/wav': ['wav'],
  'audio/ogg': ['ogg'],
};

const BLOCKED_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'com', 'dll', 'msi', 'app',  // Executables
  'sh', 'bash', 'zsh', 'fish', 'ps1',                // Scripts
  'jar', 'class',                                     // Java
  'scr', 'pif', 'vbs', 'js',                         // Legacy dangerous
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileType(file: File): FileValidationResult {
  // 1. Check MIME type is safe
  if (!SAFE_FILE_TYPES[file.type as keyof typeof SAFE_FILE_TYPES]) {
    // Try to validate by extension as fallback
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !Object.values(SAFE_FILE_TYPES).some(exts => exts.includes(extension))) {
      return {
        valid: false,
        error: `File type "${file.type}" not allowed. Supported types: documents, images, videos, and code files.`
      };
    }
  }

  // 2. Check extension is not blocked
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension && BLOCKED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `File extension ".${extension}" is not allowed for security reasons.`
    };
  }

  // 3. Check filename doesn't contain dangerous patterns
  if (/[<>:"|?*\x00-\x1f]/g.test(file.name)) {
    return {
      valid: false,
      error: 'Filename contains invalid characters.'
    };
  }

  return { valid: true };
}

export function validateFileSize(file: File, maxSizeMB: number = 50): FileValidationResult {
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`
    };
  }
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty.'
    };
  }
  return { valid: true };
}

export function sanitizeFilename(filename: string): string {
  // Remove any path traversal attempts
  const basename = filename.split(/[\/\\]/).pop() || 'file';
  
  // Remove dangerous characters but keep extension
  const parts = basename.split('.');
  const name = parts.slice(0, -1).join('.')
    .replace(/[<>:"|?*\x00-\x1f]/g, '_')
    .substring(0, 200); // Limit to 200 chars
  const ext = parts[parts.length - 1]?.substring(0, 20) || '';
  
  return `${name}${ext ? '.' + ext : ''}`;
}

/**
 * Rate limiting helper for file uploads
 */
export class FileUploadRateLimiter {
  private uploads: number[] = [];
  private maxUploads: number;
  private windowMs: number;

  constructor(maxUploads: number = 10, windowMs: number = 60000) {
    this.maxUploads = maxUploads;
    this.windowMs = windowMs;
  }

  isAllowed(): boolean {
    const now = Date.now();
    
    // Remove old uploads outside the window
    this.uploads = this.uploads.filter(timestamp => now - timestamp < this.windowMs);
    
    // Check if limit reached
    if (this.uploads.length >= this.maxUploads) {
      return false;
    }
    
    // Record this upload
    this.uploads.push(now);
    return true;
  }

  getRemainingTime(): number {
    if (this.uploads.length < this.maxUploads) return 0;
    const oldestUpload = this.uploads[0];
    return Math.max(0, this.windowMs - (Date.now() - oldestUpload));
  }
}
