import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, Key, ArrowLeft } from 'lucide-react';
import breakifyLogo from '@assets/images/BreakIfy Logo.png';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';

export interface LoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateToForgot: () => void;
  onSuccess: () => void;
  onNavigateToHome?: () => void;
}

export function LoginPage({ onNavigateToRegister, onNavigateToForgot, onSuccess, onNavigateToHome }: LoginPageProps) {
  const { login, verify2FALogin, googleLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  // Google OAuth GIS
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [gisRendered, setGisRendered] = useState(false);

  useEffect(() => {
    if (!googleClientId) return;

    const setupGoogleGis = () => {
      const g = (window as any).google;
      if (g?.accounts?.id && googleButtonRef.current) {
        try {
          g.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: { credential: string }) => {
              if (response.credential) {
                setIsLoading(true);
                setError(null);
                try {
                  await googleLogin(response.credential);
                  onSuccess();
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : 'Google authentication verification failed.');
                } finally {
                  setIsLoading(false);
                }
              }
            },
          });

          g.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: googleButtonRef.current.clientWidth || 360,
            text: 'signin_with',
            shape: 'rectangular',
          });
          setGisRendered(true);
        } catch (e) {
          console.warn('Google Identity Services init error:', e);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      setupGoogleGis();
    } else {
      const timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(timer);
          setupGoogleGis();
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [googleClientId, googleLogin, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await login(email, password);
      if (res.requires2FA && res.tempToken) {
        setRequires2FA(true);
        setTempToken(res.tempToken);
      } else {
        onSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid login credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (useRecoveryCode) {
        if (!recoveryCode.trim()) {
          throw new Error('Please enter your recovery code');
        }
        await verify2FALogin(tempToken, undefined, recoveryCode.trim());
      } else {
        if (!twoFactorCode.trim()) {
          throw new Error('Please enter the 6-digit code');
        }
        await verify2FALogin(tempToken, twoFactorCode.trim());
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '2FA verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleFallbackClick = () => {
    if (!googleClientId) {
      setError(
        'Google OAuth requires VITE_GOOGLE_CLIENT_ID in client/.env and GOOGLE_CLIENT_ID in server/.env. Please configure them to enable 1-click Google Sign In.'
      );
    } else {
      const g = (window as any).google;
      if (g?.accounts?.id) {
        g.accounts.id.prompt();
      }
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
          {requires2FA ? 'Two-Factor Challenge' : 'Sign in to BreakIfy'}
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {requires2FA
            ? 'Additional verification required to access your account'
            : 'Manage short URLs, track analytics, and configure domains'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-900/50 flex items-start space-x-2.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {requires2FA ? (
              /* 2FA Challenge Form */
              <form onSubmit={handle2FASubmit} className="space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    {useRecoveryCode
                      ? 'Enter one of your 10 single-use emergency backup recovery codes.'
                      : 'Open your authenticator app (Google Authenticator, Authy) and enter your current 6-digit code.'}
                  </p>
                </div>

                {useRecoveryCode ? (
                  <Input
                    label="Recovery Backup Code"
                    type="text"
                    placeholder="XXXX-XXXX"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                    leftIcon={<Key className="w-4 h-4" />}
                    autoFocus
                    required
                  />
                ) : (
                  <Input
                    label="6-Digit Authenticator Code"
                    type="text"
                    placeholder="000000"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    leftIcon={<Key className="w-4 h-4" />}
                    autoFocus
                    required
                  />
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Verify and Sign In
                </Button>

                <div className="pt-2 flex justify-between text-xs text-zinc-500">
                  <button
                    type="button"
                    className="hover:underline text-zinc-600 dark:text-zinc-300"
                    onClick={() => {
                      setUseRecoveryCode(!useRecoveryCode);
                      setError(null);
                    }}
                  >
                    {useRecoveryCode ? 'Use 6-digit authenticator code instead' : 'Use emergency recovery code'}
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => {
                      setRequires2FA(false);
                      setTempToken('');
                      setError(null);
                    }}
                  >
                    Back to password login
                  </Button>
                </div>
              </form>
            ) : (
              /* Standard Credentials Login */
              <>
                {/* Official Google Identity Services Container */}
                <div className="flex flex-col items-center justify-center">
                  <div
                    ref={googleButtonRef}
                    className={`w-full flex justify-center ${gisRendered ? 'block' : 'hidden'}`}
                  />
                  {!gisRendered && (
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full justify-center"
                      onClick={handleGoogleFallbackClick}
                      disabled={isLoading}
                      leftIcon={
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      }
                    >
                      Sign in with Google
                    </Button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-mono-card dark:bg-mono-card-dark px-2 text-zinc-400">
                      Or continue with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail className="w-4 h-4" />}
                    required
                    autoComplete="email"
                  />

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={onNavigateToForgot}
                        className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      leftIcon={<Lock className="w-4 h-4" />}
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full justify-center mt-2"
                    disabled={isLoading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>
              </>
            )}

            <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
              >
                Create one now
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Ethics Pledge */}
        <div className="mt-4 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Our Privacy Guarantee</span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            We don't store your data permanently. We don't sell your data on dark web, with another companies out there in the market. We don't use your data for training of our models and ai agents.
          </p>
        </div>
      </div>
    </div>
  );
}
