import { ShieldCheck, ArrowLeft, Lock, Database, Eye, Server, RefreshCw } from 'lucide-react';
import breakifyLogo from '@assets/images/BreakIfy Logo.png';
import { Button } from '../../components/ui/Button';

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

export function PrivacyPolicyPage({ onBack }: PrivacyPolicyPageProps) {
  return (
    <div className="min-h-screen bg-mono-canvas dark:bg-mono-canvas-dark text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white dark:selection:bg-zinc-200 dark:selection:text-zinc-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div
            onClick={onBack}
            className="flex items-center space-x-2 cursor-pointer hover:opacity-85 transition-opacity"
            title="Go to Home"
          >
            <img src={breakifyLogo} alt="BreakIfy" className="h-6 w-auto object-contain" />
            <span className="font-bold text-sm tracking-tight">BreakIfy Legal</span>
          </div>

          <div className="w-12"></div>
        </div>
      </header>

      {/* Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-8 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" />
            <span>GDPR & CCPA Aligned</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
            Privacy Policy
          </h1>
          <p className="text-xs text-zinc-500">
            Last Updated: January 2026 &bull; BreakIfy Open-Source Platform
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center space-x-2">
              <Eye className="w-4 h-4 text-zinc-500" />
              <span>1. Overview & Commitment</span>
            </h2>
            <p>
              BreakIfy (&quot;we&quot;, &quot;our&quot;, or &quot;the platform&quot;) is committed to transparent, privacy-centric data collection. As an open-source URL management and telemetry platform, we collect only data necessary to fulfill link routing, security scanning, bot detection, and aggregate analytics. We do not sell, rent, or monetize your personal or analytics information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center space-x-2">
              <Database className="w-4 h-4 text-zinc-500" />
              <span>2. Information We Collect</span>
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Account Credentials:</strong> When creating an account or logging in via Google OAuth, we store your name, email address, password hash (via bcrypt with work factor 12), and avatar URL.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Short Link Metadata:</strong> Destination URLs, custom aliases, device-specific destination overrides, QR code design parameters, tags, and link expiration timestamps.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">Telemetry & Analytics Data:</strong> When an internet user clicks a shortened link, BreakIfy parses the request headers to extract user-agent metadata (browser, OS, device type), HTTP referrer domain, and ISO country code via GeoIP databases.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-zinc-200">IP Addresses:</strong> To comply with strict privacy laws, IP addresses used for analytics are hashed or masked using one-way cryptographic SHA-256 digests. Raw visitor IP addresses are not stored long-term in analytics records.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-zinc-500" />
              <span>3. Two-Factor Authentication & Security</span>
            </h2>
            <p>
              When Two-Factor Authentication (TOTP) is activated, your RFC 6238 secret key is stored in your account database record. Single-use emergency recovery codes are cryptographically hashed before persistence. Active browser sessions log the operating system, approximate login timestamp, and remote IP address to allow users to review and revoke unauthorized devices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center space-x-2">
              <Server className="w-4 h-4 text-zinc-500" />
              <span>4. Cookies & Browser Storage</span>
            </h2>
            <p className="mb-2">BreakIfy uses minimal cookies:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400">
              <li>
                <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">accessToken</code>: HttpOnly, Secure, Lax SameSite cookie for API authorization (15-minute lifespan).
              </li>
              <li>
                <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">refreshToken</code>: HttpOnly cookie scoped strictly to the refresh route (7-day lifespan).
              </li>
              <li>
                <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">breakify_cookie_consent</code>: LocalStorage entry preserving your consent choice.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-zinc-500" />
              <span>5. Data Retention & Recycle Bin</span>
            </h2>
            <p>
              When a link is deleted, it is moved to the Recycle Bin and retained for 30 days before permanent deletion. History audit logs can be selectively or entirely deleted by the account owner at any time without impacting active shortened URLs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">
              6. Your Rights & Contact Information
            </h2>
            <p className="mb-4">
              Under GDPR, CCPA, and applicable laws, you hold the right to export your complete link inventory (via CSV Export), request account deletion, or disable telemetry logging.
            </p>
            <p className="text-xs text-zinc-500">
              For privacy-related inquiries, data erasure requests, or bug bounty disclosures:
              <br />
              <strong className="text-zinc-900 dark:text-zinc-200">Email:</strong> privacy@breakify.site or security@breakify.site
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs text-zinc-500">
          <span>&copy; 2026 BreakIfy. Arpit Chaudhary.</span>
          <Button variant="outline" size="sm" onClick={onBack}>
            Back to Application
          </Button>
        </div>
      </main>
    </div>
  );
}
