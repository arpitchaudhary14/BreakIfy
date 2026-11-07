import React, { useState } from 'react';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import breakifyLogo from '@assets/images/BreakIfy Logo.png';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { authApi } from '../../services/authApi';

export interface ResetPasswordPageProps {
  onNavigateToLogin: () => void;
}

export function ResetPasswordPage({ onNavigateToLogin }: ResetPasswordPageProps) {
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || params.get('resetToken') || '';
    }
    return '';
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authApi.resetPassword({ token, password });
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setIsLoading(false);
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
          Set New Password
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Choose a strong password with at least 8 characters
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            {isSuccess ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Password Reset Complete
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Your password has been securely updated. You can now log in with your new credentials.
                </p>
                <Button variant="primary" size="md" onClick={onNavigateToLogin} className="w-full justify-center">
                  Sign in
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

                {!token && (
                  <Input
                    label="Reset Token"
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste reset token from email"
                    isMono
                  />
                )}

                <Input
                  label="New Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  isLoading={isLoading}
                >
                  Update Password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

