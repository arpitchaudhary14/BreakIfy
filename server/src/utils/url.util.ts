import crypto from 'crypto';

const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const RESERVED_SLUGS = new Set([
  'api',
  'health',
  'auth',
  'users',
  'links',
  'login',
  'register',
  'dashboard',
  'overview',
  'my-links',
  'qr-studio',
  'analytics',
  'history',
  'settings',
  'admin',
  'assets',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'docs',
  'verify-email',
  'reset-password',
  'confirm-email-change',
]);

/**
 * Generate a cryptographically secure Base62 short code that always includes
 * random numbers and letters (typical of modern url shorteners like Bitly).
 */
export function generateShortCode(length = 7): string {
  while (true) {
    const bytes = crypto.randomBytes(length);
    let code = '';
    for (let i = 0; i < length; i++) {
      code += BASE62_ALPHABET[bytes[i] % BASE62_ALPHABET.length];
    }
    // Ensure code contains at least one digit and at least one letter, and not reserved
    if (/\d/.test(code) && /[a-zA-Z]/.test(code) && !RESERVED_SLUGS.has(code.toLowerCase())) {
      return code;
    }
  }
}

/**
 * Validates that an original URL is safe, valid RFC-compliant HTTP/HTTPS,
 * and does not point to internal/loopback IPs or cloud metadata (SSRF defense).
 */
export function validateSafeUrl(urlString: string): { isValid: boolean; error?: string; normalizedUrl?: string } {
  try {
    const parsed = new URL(urlString);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, error: 'Only http:// and https:// URLs are permitted.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Prevent loopback and local network access
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local')
    ) {
      return { isValid: false, error: 'Loopback and localhost destinations are forbidden.' };
    }

    // Prevent cloud instance metadata SSRF
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
      return { isValid: false, error: 'Internal infrastructure and cloud metadata URLs are forbidden.' };
    }

    // Private IPv4 ranges
    if (
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    ) {
      return { isValid: false, error: 'Private RFC 1918 internal IP addresses are forbidden.' };
    }

    // URL must have at least one dot in hostname unless it's a valid TLD
    if (!hostname.includes('.')) {
      return { isValid: false, error: 'Hostname must be a fully-qualified domain name.' };
    }

    return { isValid: true, normalizedUrl: parsed.toString() };
  } catch {
    return { isValid: false, error: 'Invalid URL format.' };
  }
}

/**
 * Checks whether a short code slug is valid (alphanumeric, dashes, underscores).
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length < 3 || slug.length > 30) {
    return false;
  }
  if (RESERVED_SLUGS.has(slug.toLowerCase())) {
    return false;
  }
  return /^[a-zA-Z0-9-_]+$/.test(slug);
}

