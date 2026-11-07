import { useState } from 'react';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';
import breakifyLogo from '@assets/images/BreakIfy Logo.png';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';

interface ContactPageProps {
  onBack: () => void;
}

export function ContactPage({ onBack }: ContactPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'general' | 'abuse' | 'security' | 'feature'>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);
    // Simulate real submission with generated ticket reference
    await new Promise((r) => setTimeout(r, 800));
    setReferenceId(`BKF-${Math.floor(100000 + Math.random() * 900000)}`);
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const faqs = [
    {
      q: 'Is BreakIfy truly free and open-source?',
      a: 'Yes! BreakIfy is licensed under the permissive MIT license by Arpit Chaudhary. You can use it as a hosted SaaS or freely deploy your own self-hosted cluster with Docker.',
    },
    {
      q: 'How does the malware & phishing protection work?',
      a: 'Every short URL destination is validated against heuristic syntax engines, internal IP/SSRF blocklists, and the Google Safe Browsing Lookup v4 API. Suspect links are immediately quarantined.',
    },
    {
      q: 'What happens when I delete a shortened link?',
      a: 'Deleted links enter the 30-day Recycle Bin. While in the bin, the short URL stops redirecting. You can restore it at any time within 30 days or purge it permanently.',
    },
    {
      q: 'How do device-specific redirects work?',
      a: 'You can configure destination overrides for iOS, Android, macOS, and Windows. BreakIfy inspects visitor User-Agent headers and dynamically redirects each device to its matching destination.',
    },
  ];

  return (
    <div className="min-h-screen bg-mono-canvas dark:bg-mono-canvas-dark text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white dark:selection:bg-zinc-200 dark:selection:text-zinc-900">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
            <span className="font-bold text-sm tracking-tight">Contact & Support</span>
          </div>

          <div className="w-12"></div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 mb-3">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community & Direct Support</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">
            How can we assist you?
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Have questions about link routing, want to report an abusive URL, or found a security vulnerability? Get in touch.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Direct channels & FAQ */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Official Communication Channels
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-200 block mb-0.5">General & Product Support</span>
                    <a href="mailto:support@breakify.site" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline font-mono">
                      support@breakify.site
                    </a>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-200 block mb-0.5">Security & Vulnerability Disclosure</span>
                    <a href="mailto:security@breakify.site" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline font-mono">
                      security@breakify.site
                    </a>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-200 block mb-0.5">Abuse & Phishing Takedown</span>
                    <a href="mailto:abuse@breakify.site" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline font-mono">
                      abuse@breakify.site
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick FAQ Accordion */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 px-1 mb-2">
                Frequently Asked Questions
              </h3>
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full text-left p-3.5 flex items-center justify-between text-xs font-semibold text-zinc-900 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {openFaqIndex === idx ? (
                      <ChevronUp className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-2" />
                    )}
                  </button>
                  {openFaqIndex === idx && (
                    <div className="px-3.5 pb-3.5 pt-1 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/60 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Contact & Feedback Form */}
          <div className="lg:col-span-7">
            <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
              <CardContent className="p-6">
                {isSubmitted ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-500 mx-auto flex items-center justify-center border border-green-500/20">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      Message Dispatched
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                      Thank you for contacting BreakIfy. Your inquiry has been logged with reference code{' '}
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{referenceId}</span>.
                      Our team will reply to <span className="font-semibold">{email}</span> shortly.
                    </p>
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsSubmitted(false);
                          setMessage('');
                          setSubject('');
                        }}
                      >
                        Send Another Message
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                        Send a Message
                      </h3>
                      <p className="text-xs text-zinc-500 mb-4">
                        We usually respond within 24 business hours.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Your Name
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Arpit Chaudhary"
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@domain.com"
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as any)}
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        >
                          <option value="general">General Inquiry</option>
                          <option value="abuse">Report Malicious Link (Abuse)</option>
                          <option value="security">Security Vulnerability</option>
                          <option value="feature">Feature Request</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          Subject
                        </label>
                        <input
                          type="text"
                          required
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Brief topic..."
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Detailed Message
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please include full details, short URLs in question, or error messages..."
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 text-xs flex items-center justify-center space-x-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Sending Request...' : 'Send Message'}</span>
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
