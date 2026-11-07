import { logger } from './logger.js';

export interface UrlSafetyCheckResult {
  isSafe: boolean;
  isMalicious: boolean;
  threatType: 'phishing' | 'malware' | 'unwanted' | 'suspicious' | 'safe';
  riskScore: number; // 0 - 100
  reasons: string[];
  provider: string;
  checkedAt: string;
}

export interface IUrlReputationProvider {
  name: string;
  isAvailable(): boolean;
  check(url: string): Promise<UrlSafetyCheckResult>;
}

// High-risk TLDs commonly utilized in automated spam and disposable phishing attacks
const HIGH_RISK_TLDS = new Set([
  '.zip',
  '.mov',
  '.kim',
  '.stream',
  '.top',
  '.gq',
  '.cf',
  '.ml',
  '.tk',
  '.fit',
  '.click',
  '.work',
  '.xyz',
  '.cc',
  '.buzz',
  '.country',
]);

// Highly targeted brands frequently targeted in URL impersonation attacks
const IMPERSONATION_KEYWORDS = [
  'paypal',
  'appleid',
  'metamask',
  'binance',
  'coinbase',
  'wellsfargo',
  'chasebank',
  'netflix-billing',
  'microsoft-login',
  'ledger-live',
  'phantom-wallet',
  'steamcommunity-login',
  'discord-nitro-gift',
  'verify-kyc',
  'crypto-airdrop',
];

// Dangerous executable and script file signatures in URL destinations
const EXECUTABLE_EXTENSIONS = /\.(exe|scr|bat|cmd|vbs|vbe|js|jse|wsf|wsh|ps1|apk|msi|hta|reg)$/i;

/**
 * High-signal offline heuristic threat analyzer.
 * Evaluates domain structure, brand impersonation patterns, executable payload delivery,
 * and open-redirect chaining without external dependencies.
 */
export class HeuristicUrlPatternProvider implements IUrlReputationProvider {
  name = 'heuristic-pattern-analyzer';

  isAvailable(): boolean {
    return true;
  }

  async check(urlStr: string): Promise<UrlSafetyCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;
    const checkedAt = new Date().toISOString();

    let parsed: URL;
    try {
      parsed = new URL(urlStr);
    } catch {
      return {
        isSafe: false,
        isMalicious: true,
        threatType: 'suspicious',
        riskScore: 100,
        reasons: ['Malformed or invalid URL syntax'],
        provider: this.name,
        checkedAt,
      };
    }

    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    const search = parsed.search.toLowerCase();

    // 1. Embedded credentials check (e.g., https://admin:password@evil.com)
    if (parsed.username || parsed.password) {
      riskScore += 45;
      reasons.push('Contains embedded credentials / basic authentication in URL.');
    }

    // 2. Executable payload in path
    if (EXECUTABLE_EXTENSIONS.test(pathname) || EXECUTABLE_EXTENSIONS.test(search)) {
      riskScore += 75;
      reasons.push('Destination directs to an executable file extension or dangerous script download.');
    }

    // 3. High-risk TLD check
    const matchedTld = Array.from(HIGH_RISK_TLDS).find((tld) => hostname.endsWith(tld));
    if (matchedTld) {
      riskScore += 30;
      reasons.push(`Uses high-abuse top-level domain (${matchedTld}).`);
    }

    // 4. Targeted brand impersonation in hostname
    for (const brand of IMPERSONATION_KEYWORDS) {
      if (hostname.includes(brand)) {
        // Legitimate brand check (e.g., paypal.com is safe, but paypal-security.xyz is not)
        const isOfficial =
          hostname === `${brand}.com` ||
          hostname.endsWith(`.${brand}.com`) ||
          hostname === `${brand}.org` ||
          hostname.endsWith(`.${brand}.org`);

        if (!isOfficial) {
          riskScore += 60;
          reasons.push(`Detected brand impersonation pattern for '${brand}'.`);
          break;
        }
      }
    }

    // 5. Homoglyph / Punycode Internationalized Domain Name lookalikes (xn--)
    if (hostname.startsWith('xn--') || hostname.includes('.xn--')) {
      riskScore += 45;
      reasons.push('Punycode homograph lookalike domain detected.');
    }

    // 6. Excessive subdomain nesting (e.g. login.secure.verify.account.xyz.com)
    const dotCount = (hostname.match(/\./g) || []).length;
    if (dotCount >= 4) {
      riskScore += 25;
      reasons.push('Excessive subdomain nesting detected.');
    }

    // 7. Obfuscated or numeric IP in hostname
    if (/^0x[0-9a-fA-F]+$/i.test(hostname) || /^\d{8,12}$/.test(hostname)) {
      riskScore += 60;
      reasons.push('Obfuscated hexadecimal or dword IP address in hostname.');
    }

    // 8. Open redirect chaining signature (e.g. /redirect?target= or /out.php?url=)
    if (
      pathname.includes('/redirect') ||
      pathname.includes('/login/redirect') ||
      search.includes('redirect_url=http') ||
      search.includes('target=http') ||
      search.includes('url=http')
    ) {
      riskScore += 25;
      reasons.push('Destination contains open-redirect query patterns.');
    }

    // High confidence threshold for malware/phishing to avoid false positives on weak signals
    const isMalicious = riskScore >= 70;
    const isSafe = riskScore < 40;

    let threatType: UrlSafetyCheckResult['threatType'] = 'safe';
    if (riskScore >= 70) {
      threatType = reasons.some((r) => r.includes('executable')) ? 'malware' : 'phishing';
    } else if (riskScore >= 40) {
      threatType = 'suspicious';
    }

    return {
      isSafe,
      isMalicious,
      threatType,
      riskScore: Math.min(100, riskScore),
      reasons,
      provider: this.name,
      checkedAt,
    };
  }
}

/**
 * Google Safe Browsing Lookup API v4 Provider.
 * Activates automatically when GOOGLE_SAFE_BROWSING_API_KEY is configured in env.
 */
export class GoogleSafeBrowsingProvider implements IUrlReputationProvider {
  name = 'google-safe-browsing';

  isAvailable(): boolean {
    return Boolean(process.env.GOOGLE_SAFE_BROWSING_API_KEY && process.env.GOOGLE_SAFE_BROWSING_API_KEY.trim());
  }

  async check(urlStr: string): Promise<UrlSafetyCheckResult> {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    const checkedAt = new Date().toISOString();

    if (!apiKey) {
      return {
        isSafe: true,
        isMalicious: false,
        threatType: 'safe',
        riskScore: 0,
        reasons: ['Google Safe Browsing key not configured.'],
        provider: this.name,
        checkedAt,
      };
    }

    try {
      const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
      const payload = {
        client: {
          clientId: 'breakify-link-manager',
          clientVersion: '1.0.0',
        },
        threatInfo: {
          threatTypes: [
            'MALWARE',
            'SOCIAL_ENGINEERING',
            'UNWANTED_SOFTWARE',
            'POTENTIALLY_HARMFUL_APPLICATION',
          ],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url: urlStr }],
        },
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) {
        throw new Error(`Google Safe Browsing responded with HTTP ${res.status}`);
      }

      const data = (await res.json()) as { matches?: Array<{ threatType: string }> };

      if (data.matches && data.matches.length > 0) {
        const primaryMatch = data.matches[0].threatType;
        const reasons = data.matches.map((m) => `Flagged by Google Safe Browsing as ${m.threatType}`);
        const isMalware = primaryMatch.includes('MALWARE');

        return {
          isSafe: false,
          isMalicious: true,
          threatType: isMalware ? 'malware' : 'phishing',
          riskScore: 98,
          reasons,
          provider: this.name,
          checkedAt,
        };
      }

      return {
        isSafe: true,
        isMalicious: false,
        threatType: 'safe',
        riskScore: 0,
        reasons: ['No threats found in Google Safe Browsing registry.'],
        provider: this.name,
        checkedAt,
      };
    } catch (err: unknown) {
      logger.warn('Google Safe Browsing lookup failed, falling back to heuristic engine', {
        error: err instanceof Error ? err.message : String(err),
      });
      return {
        isSafe: true,
        isMalicious: false,
        threatType: 'safe',
        riskScore: 0,
        reasons: ['External lookup unavailable; fallen back to heuristics.'],
        provider: this.name,
        checkedAt,
      };
    }
  }
}

/**
 * Composite URL Security Coordinator.
 * Evaluates both live reputation APIs and internal heuristic engines with in-memory caching.
 */
export class UrlSafetyService {
  private heuristicProvider = new HeuristicUrlPatternProvider();
  private gsbProvider = new GoogleSafeBrowsingProvider();
  private cache = new Map<string, { result: UrlSafetyCheckResult; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  async checkUrl(url: string): Promise<UrlSafetyCheckResult> {
    const cached = this.cache.get(url);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    // 1. Run heuristic analyzer
    const heuristicResult = await this.heuristicProvider.check(url);

    // 2. If GSB is available and configured, query it
    let finalResult = heuristicResult;
    if (this.gsbProvider.isAvailable()) {
      const gsbResult = await this.gsbProvider.check(url);
      if (gsbResult.isMalicious) {
        finalResult = gsbResult;
      }
    }

    // Cache the outcome
    this.cache.set(url, {
      result: finalResult,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    return finalResult;
  }
}

export const urlSafetyService = new UrlSafetyService();

