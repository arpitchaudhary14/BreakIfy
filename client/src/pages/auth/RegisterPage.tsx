import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, User, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import breakifyLogo from '@assets/images/BreakIfy Logo.png';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';

export interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onSuccess: () => void;
  onNavigateToHome?: () => void;
}

export function RegisterPage({ onNavigateToLogin, onSuccess, onNavigateToHome }: RegisterPageProps) {
  const { register, googleLogin } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Google OAuth GIS
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '361332577055-ojacfd95aiebgmhff69uh11l8f6qtdc3.apps.googleusercontent.com';
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
            text: 'signup_with',
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

  const handleGoogleFallbackClick = () => {
    if (!googleClientId) {
      setError(
        'Google 1-Click Sign-In is currently being connected. Please use the email and password registration below.'
      );
    } else {
      const g = (window as any).google;
      if (g?.accounts?.id) {
        g.accounts.id.prompt();
      }
    }
  };

  // Password requirements calculation
  const hasMinLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMatch = password === confirmPassword && password.length > 0;
  const isPasswordValid = hasMinLength && hasLower && hasUpper && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please satisfy all password complexity requirements.');
      return;
    }
    if (!isMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const msg = await register(name, email, password);
      setSuccessMessage(`${msg} Redirecting to login...`);
      setTimeout(() => {
        onNavigateToLogin();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
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
          Create BreakIfy Account
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Enterprise link shortening, branded domains, and analytics
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

            {successMessage && (
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/50 flex items-start space-x-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

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
                  Sign up with Google
                </Button>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-mono-card dark:bg-mono-card-dark px-2 text-zinc-400">
                  Or register with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Vance"
                leftIcon={<User className="w-4 h-4" />}
                autoComplete="name"
              />

              <Input
                label="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                leftIcon={<Mail className="w-4 h-4" />}
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
              />

              {/* Password strength checklist */}
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-1.5 text-[11px]">
                <div className="font-semibold text-zinc-600 dark:text-zinc-400">Password requirements:</div>
                <div className="grid grid-cols-2 gap-1 text-zinc-500">
                  <span className={hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                    • 8+ characters
                  </span>
                  <span className={hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                    • 1 uppercase letter
                  </span>
                  <span className={hasLower ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                    • 1 lowercase letter
                  </span>
                  <span className={hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                    • 1 number
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Account
              </Button>
            </form>
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

        <p className="mt-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Already have an account?{' '}
          <button
            onClick={onNavigateToLogin}
            className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
