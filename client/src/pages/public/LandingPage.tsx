import { useState } from 'react';
import {
  Link2,
  QrCode,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  Trash2,
  Lock,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Activity,
  TrendingUp,
} from 'lucide-react';
import breakifyLogo from '@assets/images/BreakIfy Logo.png';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Dialog } from '../../components/ui/Dialog';
import { useAuth } from '../../context/AuthContext';
import { linkApi } from '../../services/linkApi';
import { getShortUrl } from '../../utils/urlHelper';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onNavigateToPrivacy: () => void;
  onNavigateToTerms: () => void;
  onNavigateToContact: () => void;
  onGoToDashboard: () => void;
  deletedNotification?: string | null;
  onDismissNotification?: () => void;
}

export function LandingPage({
  onOpenLogin,
  onOpenRegister,
  onNavigateToPrivacy,
  onNavigateToTerms,
  onNavigateToContact,
  onGoToDashboard,
  deletedNotification,
  onDismissNotification,
}: LandingPageProps) {
  const { user } = useAuth();
  const [quickUrl, setQuickUrl] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const [accountDeletedMsg, setAccountDeletedMsg] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('breakify_account_deleted');
      if (stored) return stored;
    }
    return deletedNotification || null;
  });

  const handleDismissNotification = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('breakify_account_deleted');
    }
    setAccountDeletedMsg(null);
    if (onDismissNotification) onDismissNotification();
  };

  const faqs = [
    {
      q: 'Is BreakIfy free to use?',
      a: 'Yes! BreakIfy provides essential short link creation, dynamic QR codes, analytics, and password protection completely free with no hidden charges.',
    },
    {
      q: 'How fast are BreakIfy redirect speeds?',
      a: 'BreakIfy routes short links using optimized database indexes and lightweight redirect engines, delivering instantaneous sub-20 millisecond responses.',
    },
    {
      q: 'Can I password-protect my links and set expiration dates?',
      a: 'Yes. You can lock any short link behind a secure password and set strict expiration timestamps or maximum click quotas. Once expired or limit is reached, BreakIfy blocks access automatically.',
    },
    {
      q: 'What happens when I delete a shortened link?',
      a: 'When you delete a link, it is immediately moved to your personal Recycle Bin for 30 days. You can restore it anytime with a single click or permanently destroy it whenever you choose.',
    },
    {
      q: 'How does Malware & Phishing protection work?',
      a: 'Every URL submitted to BreakIfy is analyzed against safety threat registries and heuristic security patterns to prevent phishing campaigns, malicious downloads, and open-redirect vulnerabilities.',
    },
    {
      q: 'Do you sell my data or train AI models on it?',
      a: "No, absolutely never. We don't store your data permanently without your control. We don't sell your data on the dark web or to any third-party companies. We don't use your data for training AI models or autonomous agents.",
    },
    {
      q: 'Can I design and download custom QR codes?',
      a: 'Yes! BreakIfy includes a full Dynamic QR Studio allowing you to customize dot styles, corner markers, brand colors, and embed custom logos with vector SVG and PNG downloads.',
    },
    {
      q: 'Can I import and export links in bulk?',
      a: 'Yes. You can export all your links, click telemetry, and QR data to CSV at any time, or use the CSV batch upload tool to create hundreds of short links simultaneously.',
    },
  ];

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
      const res = await linkApi.createLink({ originalUrl: target, title: 'Quick Link' });
      const short = getShortUrl(res.link.shortCode);
      setShortenedUrl(short);
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
            <a href="#analytics" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Analytics</a>
            <a href="#security" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Security</a>
            <a href="#faq" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">FAQs</a>
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
            BreakIfy combines lightning-fast redirects, deep click analytics, customizable QR codes, and real-time link protection into an elegant, monochrome dashboard.
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
                  <Link2 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Fast Shortening & Custom Slugs
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Generate instant, clean short URLs or customize human-readable aliases with built-in collision prevention.
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

      {/* Real-Time Telemetry & Analytics Engine Section */}
      <section id="analytics" className="py-20 border-b border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Live Traffic Telemetry</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Real-Time Sync</span>
              </div>

              {/* Sample Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 bg-white dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                  <div className="text-[11px] text-zinc-500 mb-0.5">Total Clicks</div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">24,891</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5" /> +14.2%
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                  <div className="text-[11px] text-zinc-500 mb-0.5">Active Links</div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">182</div>
                  <div className="text-[10px] text-zinc-400 mt-1">99.98% Health</div>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                  <div className="text-[11px] text-zinc-500 mb-0.5">Avg CTR</div>
                  <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">136.7</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Engaged</div>
                </div>
              </div>

              {/* Integrity & Zero-Fabrication matrix */}
              <div className="space-y-2.5 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/60">
                  <span>Cryptographic Salt Hash</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">SHA-256 + Daily Salt</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/60">
                  <span>Bot & Crawler Filtering</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Automated Shield</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/60">
                  <span>Synthetic Data Ratio</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">0.0% (Zero Fabricated)</span>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 mb-4">
                <BarChart3 className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                <span>Next-Gen Analytics Engine</span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
                Precision link intelligence without privacy intrusions
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                BreakIfy tracks every user interaction with complete zero-knowledge privacy. Monitor click growth, referrer sources, and device breakdowns in real-time without invasive tracking pixels or selling analytics to data brokers.
              </p>
              <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex items-start space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Real-time click streams computed strictly from verified HTTP requests.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Automated crawler filtering so scrapers don't pollute your telemetry.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Export instant CSV reports with click trends for external reporting.</span>
                </div>
              </div>
              <div className="mt-8">
                {user ? (
                  <Button onClick={onGoToDashboard}>
                    View Dashboard Telemetry <ChevronRight className="w-4 h-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button onClick={onOpenRegister}>
                    Explore Live Analytics <ChevronRight className="w-4 h-4 ml-1.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Zero Trust Section */}
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
                    <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">Zero-Trust Architecture</h5>
                    <p className="text-xs text-zinc-500">Engineered from the ground up for speed, reliability, and enterprise-grade data protection.</p>
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

          {/* Privacy & Data Ethics Guarantee Banner */}
          <div className="mt-12 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Our Data Safety & Ethics Pledge</span>
                </div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Your privacy is absolute. Zero compromises.
                </h4>
              </div>
              <button
                onClick={onNavigateToPrivacy}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 underline"
              >
                Read full Privacy Policy &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-1.5">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Zero Permanent Storage</div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  We don't store your data permanently. You have full control over data retention, recycle bins, and permanent deletion anytime.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-1.5">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Zero Data Selling</div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  We don't sell your data on dark web, with another companies out there in the market. Your records and visitors are never commoditized.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-1.5">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Zero AI Training</div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  We don't use your data for training of our models and ai agents. Your private URLs and metadata remain strictly yours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section id="faq" className="py-20 bg-zinc-50 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 mb-4">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
              <span>Questions & Answers</span>
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Frequently Asked Questions
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Everything you need to know about BreakIfy links, privacy, and infrastructure.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full py-4 px-5 text-left flex items-center justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
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
            Create an account in 10 seconds or sign in with Google to access QR codes, click telemetry, and custom expiration timers.
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
                Modern URL shortening, custom QR Studio, and real-time click telemetry.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-3">Product</h5>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-100">Core Features</a></li>
                <li><a href="#analytics" className="hover:text-zinc-900 dark:hover:text-zinc-100">Telemetry & Analytics</a></li>
                <li><a href="#security" className="hover:text-zinc-900 dark:hover:text-zinc-100">Security Architecture</a></li>
                <li><a href="#faq" className="hover:text-zinc-900 dark:hover:text-zinc-100">Help & FAQs</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-zinc-900 dark:text-zinc-200 mb-3">Solutions</h5>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-100">Dynamic QR Studio</a></li>
                <li><a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-100">Custom Slugs & Aliases</a></li>
                <li><a href="#security" className="hover:text-zinc-900 dark:hover:text-zinc-100">Zero Data Selling Pledge</a></li>
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
          </div>

          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-zinc-400">
            <span>&copy; 2026 BreakIfy. All Rights Reserved.</span>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <button onClick={onNavigateToPrivacy} className="hover:underline">Privacy</button>
              <button onClick={onNavigateToTerms} className="hover:underline">Terms</button>
              <button onClick={onNavigateToContact} className="hover:underline">Contact</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Account Deletion Confirmation Dialog */}
      <Dialog
        isOpen={!!accountDeletedMsg}
        onClose={handleDismissNotification}
        title="Account Deleted"
        description="Permanent removal confirmation"
        maxWidth="sm"
        footer={
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={handleDismissNotification}
          >
            Got it
          </Button>
        }
      >
        <div className="py-4 flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Account Deleted Successfully
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
              {accountDeletedMsg}
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
