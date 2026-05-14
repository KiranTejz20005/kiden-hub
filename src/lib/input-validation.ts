/**
 * Input validation and sanitization utilities
 */

/**
 * Validate and sanitize search queries
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';
  
  // Remove leading/trailing whitespace
  let sanitized = query.trim();
  
  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, ' ');
  
  // Remove multiple consecutive spaces
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Limit length to 500 characters to prevent ReDoS attacks
  sanitized = sanitized.substring(0, 500);
  
  return sanitized;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  // Basic email validation - not RFC 5322 compliant but good enough for most cases
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate URL is safe (not javascript:, data:, etc.)
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML/markdown content to prevent XSS
 * This is a simple sanitizer - for production, use a library like DOMPurify
 */
export function sanitizeContent(content: string): string {
  if (!content || typeof content !== 'string') return '';
  
  // Remove script tags and their content
  let sanitized = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  
  // Remove event handlers from HTML
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol for security
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  return sanitized;
}

/**
 * Escape special characters for safe HTML rendering
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Validate workspace name format
 */
export function isValidWorkspaceName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  if (name.length < 1 || name.length > 255) return false;
  // Allow alphanumeric, spaces, and common special chars
  return /^[a-zA-Z0-9\s\-_&.,()]+$/.test(name);
}

/**
 * Rate limiting for form submissions
 */
export class FormSubmissionRateLimiter {
  private lastSubmitTime: number = 0;
  private minIntervalMs: number;

  constructor(minIntervalMs: number = 1000) {
    this.minIntervalMs = minIntervalMs;
  }

  canSubmit(): boolean {
    const now = Date.now();
    if (now - this.lastSubmitTime >= this.minIntervalMs) {
      this.lastSubmitTime = now;
      return true;
    }
    return false;
  }

  getWaitTimeMs(): number {
    return Math.max(0, this.minIntervalMs - (Date.now() - this.lastSubmitTime));
  }

  reset(): void {
    this.lastSubmitTime = 0;
  }
}
