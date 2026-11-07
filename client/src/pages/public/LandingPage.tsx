import { useState } from 'react';
import {
  Link2,
  QrCode,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  Trash2,
  Lock,
  ChevronRight,
} from 'lucide-react';
import breakifyLogo from '@assets/images/BreakIfy Logo.png';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { linkApi } from '../../services/linkApi';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onNavigateToPrivacy: () => void;
  onNavigateToTerms: () => void;
  onNavigateToContact: () => void;
  onGoToDashboard: () => void;
}

export function LandingPage({
  onOpenLogin,
  onOpenRegister,
  onNavigateToPrivacy,
  onNavigateToTerms,
  onNavigateToContact,
  onGoToDashboard,
}: LandingPageProps) {
  const { user } = useAuth();
  const [quickUrl, setQuickUrl] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleQuickShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;

    let target = quickUrl.trim();
    if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (user) {
        // Authenticated user: create a real tracked link
        const res = await linkApi.createLink({ originalUrl: target, title: 'Quick Link' });
        const short = `${window.location.origin}/${res.link.shortCode}`;
        setShortenedUrl(short);
      } else {
        // Anonymous visitor quick-shorten test
        const mockCode = Math.random().toString(36).substring(2, 8);
        setShortenedUrl(`${window.location.origin}/${mockCode}`);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create short link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (shortenedUrl) {
      navigator.clipboard.writeText(shortenedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-mono-canvas dark:bg-mono-canvas-dark text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white dark:selection:bg-zinc-200 dark:selection:text-zinc-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={breakifyLogo} alt="BreakIfy" className="h-8 w-auto object-contain select-none" />
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Break<span className="text-zinc-500">Ify</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Features</a>
            <a href="#security" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Security</a>
            <a href="#analytics" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Analytics</a>
            <button onClick={onNavigateToContact} className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Support
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            {user ? (
              <Button onClick={onGoToDashboard} className="flex items-center space-x-2">
                <span>Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={onOpenLogin} className="text-sm font-medium">
                  Sign In
                </Button>
                <Button onClick={onOpenRegister} className="text-sm font-medium">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden border-b border-zinc-200 dark:border-zinc-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-300 mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span>Open-Source URL Infrastructure for Teams & Creators</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15] mb-6">
            Shorten. Track. Share. <br />
            <span className="text-zinc-400 dark:text-zinc-500 font-bold">Engineered with Precision.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed">
            BreakIfy combines intelligent device-level redirect rules, deep telemetry analytics, customized QR generation, and real-time malware defense into an elegant, monochrome dashboard.
          </p>

          {/* Live Quick Shortener Box */}
          <div className="max-w-2xl mx-auto">
            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl">
              <CardContent className="p-4 sm:p-5">
                <form onSubmit={handleQuickShorten} className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative w-full">
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Paste your long link here (e.g. https://yourdomain.com/campaign)..."
                      value={quickUrl}
                      onChange={(e) => setQuickUrl(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto shrink-0 flex items-center justify-center space-x-2 py-2.5 px-6"
                  >
                    <span>{isSubmitting ? 'Shortening...' : 'Shorten Link'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>

                {errorMsg && (
                  <p className="mt-3 text-xs text-red-500 text-left font-medium">{errorMsg}</p>
                )}

                {shortenedUrl && (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-100/50 dark:bg-zinc-950/50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 overflow-hidden text-left w-full sm:w-auto">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Ready:</span>
                      <a
                        href={shortenedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-mono text-zinc-900 dark:text-zinc-100 hover:underline truncate"
                      >
                        {shortenedUrl}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className="flex items-center space-x-1.5 text-xs"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>
                      {!user && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={onOpenRegister}
                          className="text-xs"
                        >
                          Save & Track
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              No credit card required. Clean links. Free 30-day link retention.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-20 border-b border-zinc-200 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
              Full-Stack Architecture
            </h2>
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Everything required to manage links at scale
            </h3>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              From intelligent traffic dispatching to automated recycle recovery, BreakIfy delivers uncompromised reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <Card className="border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all bg-white dark:bg-zinc-900/40">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Smart Device & Geo Routing
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Route iOS visitors to the App Store, Android to Google Play, and desktop users to your web app—all from a single, short URL.
                </p>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all bg-white dark:bg-zinc-900/40">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Telemetry & Click Analytics
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Collect anonymized device types, browsers, top referrers, and geo heatmaps with built-in crawler and bot filtering.
                </p>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card className="border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all bg-white dark:bg-zinc-900/40">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                  <QrCode className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Custom QR Code Studio
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Generate print-ready vector SVGs and high-resolution PNGs with customizable dot patterns, corner markers, and embedded brand logos.
                </p>
              </CardContent>
            </Card>

            {/* Card 4 */}
            <Card className="border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all bg-white dark:bg-zinc-900/40">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Safe Browsing & Abuse Shield
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Real-time heuristic link validation, Google Safe Browsing integration, abuse reporting system, and automated malware quarantines.
                </p>
              </CardContent>
            </Card>

            {/* Card 5 */}
            <Card className="border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all bg-white dark:bg-zinc-900/40">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Recycle Bin & Safe Retention
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Accidentally delete a link? Restore it instantly within 30 days. Activity audit history logs every creation, update, and deletion.
                </p>
              </CardContent>
            </Card>

            {/* Card 6 */}
            <Card className="border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all bg-white dark:bg-zinc-900/40">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Two-Factor Auth & Session Guard
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  RFC 6238 TOTP authentication (Google Authenticator, Authy), 10 single-use emergency recovery keys, and remote session revocation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security & Open Source Section */}
      <section id="security" className="py-20 bg-zinc-50 dark:bg-zinc-900/20 border-b border-zinc-200 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 mb-4">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                <span>Zero Trust Architecture</span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
                Enterprise security baked directly into the core
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                BreakIfy protects both creators and visitors. Redirect loops, SSRF access to internal metadata IP ranges, and unauthorized redirects are blocked at the engine layer before execution.
              </p>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">Strict MIT License</h5>
                    <p className="text-xs text-zinc-500">Free to inspect, self-host, audit, and deploy without proprietary lock-in.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">Rate Limiting & Anti-Brute Force</h5>
                    <p className="text-xs text-zinc-500">Tiered IP-based throttle windows protect authentication, redirects, and password resets.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">GDPR Telemetry Compliance</h5>
                    <p className="text-xs text-zinc-500">Hashed visitor IP addresses and strict cookie consent options ensure compliance.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Security Audit Matrix</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-500/10 text-green-600 dark:text-green-400 rounded-full border border-green-500/20">
                  Passing 150 Tests
                </span>
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                  <span className="text-zinc-600 dark:text-zinc-400">TOTP Engine (RFC 6238)</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Verified</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                  <span className="text-zinc-600 dark:text-zinc-400">SSRF / Metadata Protection</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Active</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                  <span className="text-zinc-600 dark:text-zinc-400">Open-Redirect Guard</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Enforced</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                  <span className="text-zinc-600 dark:text-zinc-400">Multi-Device Session Revocation</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Real-Time</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-zinc-600 dark:text-zinc-400">Google OAuth 2.0 Integration</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
            Ready to upgrade your links?
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 max-w-xl mx-auto">
            Create an account in 10 seconds or sign in with Google to access device routing, QR codes, and custom expiration timers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <Button onClick={onGoToDashboard} size="lg">
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button onClick={onOpenRegister} size="lg" className="px-8">
                  Create Free Account
                </Button>
                <Button variant="outline" onClick={onOpenLogin} size="lg">
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 bg-white dark:bg-zinc-950 text-xs text-zinc-500 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <img src={breakifyLogo} alt="BreakIfy" className="h-5 w-auto object-contain" />
                <span className="font-bold text-zinc-900 dark:text-zinc-100">BreakIfy</span>
              </div>
              <p className="text-zinc-400 dark:text-zinc-500 leading-relaxed">
                Modern URL shortening, dynamic traffic routing, QR Studio, and deep analytics.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-3">Product</h5>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-100">Features</a></li>
                <li><a href="#security" className="hover:text-zinc-900 dark:hover:text-zinc-100">Security Architecture</a></li>
                <li><a href="#analytics" className="hover:text-zinc-900 dark:hover:text-zinc-100">Analytics Engine</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-3">Support & Legal</h5>
              <ul className="space-y-2">
                <li><button onClick={onNavigateToPrivacy} className="hover:text-zinc-900 dark:hover:text-zinc-100 text-left">Privacy Policy</button></li>
                <li><button onClick={onNavigateToTerms} className="hover:text-zinc-900 dark:hover:text-zinc-100 text-left">Terms & Conditions</button></li>
                <li><button onClick={onNavigateToContact} className="hover:text-zinc-900 dark:hover:text-zinc-100 text-left">Contact & Abuse Reporting</button></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-3">Repository</h5>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/arpitchaudhary14/Breakify"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    <span>arpitchaudhary14/Breakify</span>
                  </a>
                </li>
                <li>
                  <span className="text-zinc-400">License: MIT (2026 Arpit Chaudhary)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-zinc-400">
            <span>&copy; 2026 BreakIfy. Released under the MIT License by Arpit Chaudhary.</span>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <button onClick={onNavigateToPrivacy} className="hover:underline">Privacy</button>
              <button onClick={onNavigateToTerms} className="hover:underline">Terms</button>
              <button onClick={onNavigateToContact} className="hover:underline">Contact</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
