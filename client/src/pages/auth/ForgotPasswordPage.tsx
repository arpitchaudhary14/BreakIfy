import React, { useState } from 'react';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import breakifyLogo from '@assets/images/BreakIfy Logo.png';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { authApi } from '../../services/authApi';

export interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
  onNavigateToHome?: () => void;
}

export function ForgotPasswordPage({ onNavigateToLogin, onNavigateToHome }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authApi.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-mono-canvas dark:bg-mono-canvas-dark text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {onNavigateToHome && (
          <div className="mb-4">
            <button
              onClick={onNavigateToHome}
              className="inline-flex items-center space-x-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to home</span>
            </button>
          </div>
        )}
        <img
          src={breakifyLogo}
          alt="BreakIfy Logo"
          onClick={onNavigateToHome}
          className={`mx-auto h-12 w-auto object-contain select-none ${onNavigateToHome ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''}`}
        />
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Reset Password
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Enter your email to receive recovery instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            {isSubmitted ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Check your inbox
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  If an account exists for <strong className="text-zinc-900 dark:text-zinc-200">{email}</strong>, we have sent instructions to reset your password.
                </p>
                <Button variant="outline" size="sm" onClick={onNavigateToLogin} className="mt-2">
                  Return to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-900/50 flex items-start space-x-2.5 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Input
                  label="Account Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  autoFocus
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  isLoading={isLoading}
                >
                  Send Reset Link
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center"
                  onClick={onNavigateToLogin}
                  leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                >
                  Back to Sign In
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

