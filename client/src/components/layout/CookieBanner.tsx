import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface CookieBannerProps {
  onOpenPrivacyPolicy: () => void;
}

export function CookieBanner({ onOpenPrivacyPolicy }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('breakify_cookie_consent');
      if (!consent) {
        // Show banner after brief delay
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('breakify_cookie_consent', JSON.stringify({
        essential: true,
        analytics: true,
        timestamp: new Date().toISOString(),
      }));
    } catch {
      // ignore
    }
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem('breakify_cookie_consent', JSON.stringify({
        essential: true,
        analytics: false,
        timestamp: new Date().toISOString(),
      }));
    } catch {
      // ignore
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-2xl backdrop-blur-lg">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
              <Cookie className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cookie & Telemetry Settings</h4>
          </div>
          <button
            onClick={handleEssentialOnly}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
          BreakIfy uses essential cookies for secure session authentication (JWT) and anonymized telemetry (hashed IP, device type) for link click analytics. We never sell your data.
        </p>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={onOpenPrivacyPolicy}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline decoration-zinc-400"
          >
            Privacy Policy
          </button>

          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEssentialOnly}
              className="text-xs py-1 px-2.5 h-8"
            >
              Essential Only
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAcceptAll}
              className="text-xs py-1 px-3 h-8"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
