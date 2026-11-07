import geoip from 'geoip-lite';

export interface GeoLocationResult {
  country: string | null;
  region?: string | null;
  city?: string | null;
  source: 'header' | 'geoip' | 'fallback';
}

/**
 * Resolves client country code using edge headers or MaxMind GeoIP offline database.
 * Does not claim precise GPS-level accuracy; returns ISO 2-letter country code.
 */
export function lookupCountry(
  ip: string,
  headers?: Record<string, string | string[] | undefined>
): GeoLocationResult {
  // 1. Check CDN / Edge Reverse Proxy Country Headers
  if (headers) {
    const headerCountry =
      headers['cf-ipcountry'] ||
      headers['x-country-code'] ||
      headers['cloudfront-viewer-country'] ||
      headers['x-vercel-ip-country'];

    if (headerCountry && typeof headerCountry === 'string' && headerCountry.length === 2 && headerCountry !== 'XX') {
      return {
        country: headerCountry.toUpperCase(),
        source: 'header',
      };
    }
  }

  // 2. Offline GeoIP database lookup
  if (ip && ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('192.168.') && !ip.startsWith('10.')) {
    try {
      const geo = geoip.lookup(ip);
      if (geo && geo.country) {
        return {
          country: geo.country.toUpperCase(),
          region: geo.region,
          city: geo.city,
          source: 'geoip',
        };
      }
    } catch {
      // Fall through on any geoip parsing exception
    }
  }

  // 3. Fallback for local development/private network
  return {
    country: null,
    source: 'fallback',
  };
}

