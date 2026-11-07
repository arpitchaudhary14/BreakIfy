import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';

const KNOWN_BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /slurp/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /duckduckbot/i,
  /baiduspider/i,
  /headlesschrome/i,
  /lighthouse/i,
  /bytespider/i,
  /applebot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /discordbot/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /postmanruntime/i,
  /go-http-client/i,
  /apache-httpclient/i,
  /axios/i,
];

/**
 * Detects whether an incoming user-agent is an automated crawler or bot.
 */
export function detectBot(userAgent?: string): boolean {
  if (!userAgent || !userAgent.trim()) {
    return false;
  }
  return KNOWN_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * Generates an anonymous visitor session ID.
 */
export function generateSessionId(): string {
  return `sid_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Generates a privacy-preserving pseudonymous visitor hash.
 * Combines IP address, user agent, salt, and daily date bucket,
 * ensuring unique visitors can be estimated accurately for that day
 * without ever storing or persisting raw IP addresses.
 */
export function generateVisitorHash(
  ip: string,
  userAgent = '',
  salt = 'breakify_telemetry_salt'
): string {
  const dayBucket = new Date().toISOString().slice(0, 10);
  const raw = `${ip.trim()}::${userAgent.trim()}::${salt}::${dayBucket}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
}

/**
 * Normalizes HTTP Referer header into a clean, human-readable domain name or 'Direct'.
 */
export function normalizeReferrer(rawReferer?: string): string {
  if (!rawReferer || !rawReferer.trim()) {
    return 'Direct';
  }

  try {
    const parsed = new URL(rawReferer.trim());
    let host = parsed.hostname.toLowerCase();

    // Strip common subdomains
    if (host.startsWith('www.')) {
      host = host.slice(4);
    }
    if (host.startsWith('m.')) {
      host = host.slice(2);
    }
    if (host.startsWith('l.')) {
      host = host.slice(2);
    }
    if (host.startsWith('lm.')) {
      host = host.slice(3);
    }

    // Map common social link wrappers
    if (host === 't.co') return 'x.com';
    if (host === 'lnkd.in') return 'linkedin.com';
    if (host === 'youtu.be') return 'youtube.com';

    return host || 'Direct';
  } catch {
    return 'Direct';
  }
}

/**
 * Extracts browser name and operating system from user-agent string.
 */
export function parseBrowserAndOs(userAgent?: string): { browser: string; os: string } {
  if (!userAgent) {
    return { browser: 'Other', os: 'Other' };
  }

  const parser = new UAParser(userAgent);
  const browserResult = parser.getBrowser();
  const osResult = parser.getOS();

  const browser = browserResult.name ? browserResult.name.trim() : 'Other';
  const os = osResult.name ? osResult.name.trim() : 'Other';

  return { browser, os };
}

