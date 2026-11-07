import dns from 'dns/promises';
import net from 'net';

export interface HealthCheckResult {
  reachable: boolean;
  statusCode?: number;
  responseTimeMs: number;
  error?: string;
  checkedAt: string;
}

/**
 * Checks if an IPv4 address is in a reserved/private/internal range.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP treated as disallowed
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 10.0.0.0/8 (Private network)
  if (a === 10) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 100.64.0.0/10 (Shared address / CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 169.254.0.0/16 (Link local / Cloud Metadata)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (Private network)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0) return true;
  // 192.168.0.0/16 (Private network)
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 (Network benchmark tests)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;
  // 240.0.0.0/4 (Reserved)
  if (a >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address is in a reserved/private/internal range.
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback / Unspecified
  if (normalized === '::1' || normalized === '::') return true;

  // IPv4 mapped IPv6 (::ffff:127.0.0.1)
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.substring(7);
    if (net.isIPv4(ipv4Part)) {
      return isPrivateIPv4(ipv4Part);
    }
  }

  // Unique local address fc00::/7 (fc00... or fd00...)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // Link local fe80::/10
  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  ) {
    return true;
  }

  // Multicast ff00::/8
  if (normalized.startsWith('ff')) return true;

  return false;
}

/**
 * Validates that an IP address is a safe public IP.
 */
export function isSafePublicIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    return !isPrivateIPv4(ip);
  }
  if (net.isIPv6(ip)) {
    return !isPrivateIPv6(ip);
  }
  return false;
}

/**
 * Resolves a hostname and verifies all resolved IP addresses are safe public IPs.
 */
export async function validateSafeHost(hostname: string): Promise<{ isSafe: boolean; error?: string }> {
  // Disallow localhost keyword explicitly
  if (hostname.toLowerCase() === 'localhost' || hostname.toLowerCase().endsWith('.local') || hostname.toLowerCase().endsWith('.internal')) {
    return { isSafe: false, error: 'Access to localhost and local domains is strictly forbidden.' };
  }

  // If already an IP address
  if (net.isIP(hostname)) {
    if (!isSafePublicIp(hostname)) {
      return { isSafe: false, error: 'Destination IP is private, internal, or reserved.' };
    }
    return { isSafe: true };
  }

  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { isSafe: false, error: 'Hostname could not be resolved.' };
    }

    for (const record of addresses) {
      if (!isSafePublicIp(record.address)) {
        return {
          isSafe: false,
          error: `Resolved IP (${record.address}) is in a private or restricted network range.`,
        };
      }
    }

    return { isSafe: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'DNS lookup failed';
    return { isSafe: false, error: `DNS resolution failed: ${msg}` };
  }
}

/**
 * Checks reachability of a destination URL with SSRF protection and timeouts.
 */
export async function checkDestinationReachability(
  urlStr: string,
  timeoutMs: number = 5000
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const checkedAt = new Date().toISOString();

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return {
      reachable: false,
      responseTimeMs: 0,
      error: 'Malformed destination URL.',
      checkedAt,
    };
  }

  // Only allow HTTP/HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      reachable: false,
      responseTimeMs: 0,
      error: `Protocol '${parsed.protocol}' is not allowed. Only HTTP and HTTPS are permitted.`,
      checkedAt,
    };
  }

  // SSRF check
  const hostCheck = await validateSafeHost(parsed.hostname);
  if (!hostCheck.isSafe) {
    return {
      reachable: false,
      responseTimeMs: Date.now() - startTime,
      error: hostCheck.error || 'Blocked by SSRF protection policy.',
      checkedAt,
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      // First try HEAD for lightweight bandwidth usage
      response = await fetch(parsed.toString(), {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'BreakIfy-HealthChecker/1.0 (+https://breakify.site)',
        },
        redirect: 'follow',
      });
    } catch {
      // Fallback to GET if HEAD failed or was refused
      response = await fetch(parsed.toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'BreakIfy-HealthChecker/1.0 (+https://breakify.site)',
        },
        redirect: 'follow',
      });
    } finally {
      clearTimeout(timer);
    }

    const responseTimeMs = Date.now() - startTime;
    const statusCode = response.status;
    // Reachable if server responded with standard HTTP status code
    const reachable = statusCode < 400 || statusCode === 401 || statusCode === 403;

    return {
      reachable,
      statusCode,
      responseTimeMs,
      error: reachable ? undefined : `Destination responded with HTTP ${statusCode}`,
      checkedAt,
    };
  } catch (err: unknown) {
    const responseTimeMs = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : 'Connection failed';
    const isTimeout = msg.includes('aborted') || msg.includes('timeout');

    return {
      reachable: false,
      responseTimeMs,
      error: isTimeout ? `Request timed out after ${timeoutMs}ms` : `Connection error: ${msg}`,
      checkedAt,
    };
  }
}

