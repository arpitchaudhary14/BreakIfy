/**
 * Computes the functional redirect URL for a short code.
 * In local development, targets backend port 5000 where the Express redirect controller lives.
 * In production, targets the active host / origin.
 */
export function getShortUrl(shortCode: string): string {
  if (typeof window === 'undefined') {
    return `http://localhost:5000/${shortCode}`;
  }

  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:5000/${shortCode}`;
  }

  return `${window.location.origin}/${shortCode}`;
}

/**
 * Returns a clean, readable display label for a short URL.
 */
export function getShortDisplay(shortCode: string): string {
  if (typeof window === 'undefined') {
    return `localhost:5000/${shortCode}`;
  }

  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `localhost:5000/${shortCode}`;
  }

  return `${window.location.host}/${shortCode}`;
}

