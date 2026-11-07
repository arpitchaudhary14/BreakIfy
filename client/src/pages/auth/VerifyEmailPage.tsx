import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Mail, RotateCw } from 'lucide-react';
import breakifyLogo from '@assets/images/BreakIfy Logo.png';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { authApi } from '../../services/authApi';

export interface VerifyEmailPageProps {
  onNavigateToDashboard: () => void;
}

export function VerifyEmailPage({ onNavigateToDashboard }: VerifyEmailPageProps) {
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const handleVerify = async (tokenToUse: string) => {
    if (!tokenToUse) return;
    setIsLoading(true);
    setError(null);

    try {
      await authApi.verifyEmail(tokenToUse);
      setIsVerified(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Email verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      handleVerify(token);
    }
  }, []);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    try {
      const res = await authApi.resendVerification(resendEmail);
      setResendSuccess(res.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-mono-canvas dark:bg-mono-canvas-dark text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img
          src={breakifyLogo}
          alt="BreakIfy Logo"
          className="mx-auto h-12 w-auto object-contain select-none"
        />
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Email Verification
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Confirming your email address activates full link routing
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            {isVerified ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Email Verified Successfully!
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Your BreakIfy account is now fully verified and operational.
                </p>
                <Button variant="primary" size="md" onClick={onNavigateToDashboard} className="w-full justify-center">
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-900/50 flex items-start space-x-2.5 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {resendSuccess && (
                  <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/50 flex items-start space-x-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{resendSuccess}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <Input
                    label="Verification Token"
                    placeholder="Paste 64-character token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    isMono
                  />
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full justify-center"
                    onClick={() => handleVerify(token)}
                    isLoading={isLoading}
                    disabled={!token}
                  >
                    Verify Email
                  </Button>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Need a new link?
                  </div>
                  <form onSubmit={handleResend} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter account email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      leftIcon={<Mail className="w-3.5 h-3.5" />}
                      className="py-1.5"
                    />
                    <Button type="submit" variant="secondary" size="sm" leftIcon={<RotateCw className="w-3 h-3" />}>
                      Resend
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

