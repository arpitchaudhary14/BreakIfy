import { FileText, ArrowLeft, AlertTriangle, ShieldCheck, CheckCircle2, Ban } from 'lucide-react';
import breakifyLogo from '@assets/images/BreakIfy Logo.png';
import { Button } from '../../components/ui/Button';

interface TermsPageProps {
  onBack: () => void;
}

export function TermsPage({ onBack }: TermsPageProps) {
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
            <FileText className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" />
            <span>Acceptable Use & Terms of Service</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
            Terms & Conditions
          </h1>
          <p className="text-xs text-zinc-500">
            Effective Date: January 2026 &bull; BreakIfy Platform
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-zinc-500" />
              <span>1. Agreement to Terms</span>
            </h2>
            <p>
              By accessing or using the BreakIfy platform, API endpoints, or shortened redirect URLs, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you must discontinue access immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center space-x-2">
              <Ban className="w-4 h-4 text-red-500" />
              <span>2. Strict Acceptable Use Policy (Zero Tolerance)</span>
            </h2>
            <p className="mb-2">
              BreakIfy strictly prohibits shortening, redirecting, or distributing URLs associated with the following activities:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400">
              <li>Phishing, credential harvesting, or fraudulent brand impersonation.</li>
              <li>Malware, ransomware, exploit kits, spyware, or malicious file downloads.</li>
              <li>Spam, automated bulk email campaigns violating CAN-SPAM or GDPR, or click fraud.</li>
              <li>Circumvention of security controls, SSRF attacks against internal network endpoints (e.g. AWS/GCP cloud metadata), or open redirect loops.</li>
              <li>Illegal content, contraband, or material violating copyright or trademark laws.</li>
            </ul>
            <p className="mt-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg">
              Violation of this policy will result in immediate link deactivation, permanent domain blacklisting, and account termination without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-zinc-500" />
              <span>3. Link Deactivation & Abuse Review</span>
            </h2>
            <p>
              BreakIfy operates automated heuristic engines and leverages security registries including Google Safe Browsing. Short links flagged as abusive or malicious are instantly quarantined. Anyone may report a suspicious link via our Abuse Portal or by emailing abuse@breakify.site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-zinc-500" />
              <span>4. Service Availability & MIT License Disclaimer</span>
            </h2>
            <p className="mb-3">
              The software is provided &quot;AS IS&quot;, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
            <p className="text-xs text-zinc-500">
              Under no circumstances shall the author (Arpit Chaudhary) or BreakIfy contributors be liable for any claim, damages, or other liability arising from the use of the platform or external destination URLs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">
              5. Contact & Governance
            </h2>
            <p>
              For legal inquiries, intellectual property notices (DMCA), or governance queries, contact:
              <br />
              <strong className="text-zinc-900 dark:text-zinc-200">Legal Contact:</strong> legal@breakify.site &bull; abuse@breakify.site
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs text-zinc-500">
          <span>&copy; 2026 BreakIfy. Released under MIT License.</span>
          <Button variant="outline" size="sm" onClick={onBack}>
            Back to Application
          </Button>
        </div>
      </main>
    </div>
  );
}
