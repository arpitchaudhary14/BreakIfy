import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { MyLinksPage } from './pages/links/MyLinksPage';
import { QrStudioPage } from './pages/qr/QrStudioPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { AccountSettingsView } from './pages/settings/AccountSettingsView';
import { HistoryPage } from './pages/history/HistoryPage';
import { RecycleBinPage } from './pages/recycle-bin/RecycleBinPage';
import { LandingPage } from './pages/public/LandingPage';
import { PrivacyPolicyPage } from './pages/public/PrivacyPolicyPage';
import { TermsPage } from './pages/public/TermsPage';
import { ContactPage } from './pages/public/ContactPage';
import { CookieBanner } from './components/layout/CookieBanner';
import { EmptyState } from './components/ui/EmptyState';
import { Link2 } from 'lucide-react';

type ViewMode =
  | 'default'
  | 'dashboard'
  | 'landing'
  | 'login'
  | 'register'
  | 'forgot'
  | 'reset'
  | 'verify'
  | 'privacy'
  | 'terms'
  | 'contact';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [view, setView] = useState<ViewMode>('default');
  const [deletedNotification, setDeletedNotification] = useState<string | null>(null);

  // Detect URL query parameters or paths on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);

      if (pathname.includes('/verify-email') || params.has('verifyToken')) {
        setView('verify');
      } else if (
        pathname.includes('/reset-password') ||
        params.has('resetToken') ||
        (params.has('token') && !pathname.includes('/verify-email'))
      ) {
        setView('reset');
      } else if (pathname === '/privacy' || params.get('view') === 'privacy') {
        setView('privacy');
      } else if (pathname === '/terms' || params.get('view') === 'terms') {
        setView('terms');
      } else if (pathname === '/contact' || params.get('view') === 'contact') {
        setView('contact');
      } else {
        // Detect potential short link codes visited on the frontend origin
        const reservedPaths = ['/', '/login', '/register', '/api'];
        const isReserved = reservedPaths.some((r) => pathname === r || (r !== '/' && pathname.startsWith(r + '/')));
        if (pathname.length > 1 && !isReserved && !pathname.includes('.')) {
          const backendRedirect =
            window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
              ? `http://localhost:5000${pathname}${window.location.search}`
              : `https://api.breakify.site${pathname}${window.location.search}`;
          window.location.replace(backendRedirect);
          return;
        }
      }
    }
  }, []);

  // Show loading indicator during initial session probe
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mono-canvas dark:bg-mono-canvas-dark text-zinc-500">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-6 h-6 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Initializing BreakIfy...</span>
        </div>
      </div>
    );
  }

  // Handle explicit non-dashboard pages
  if (view === 'login') {
    return (
      <>
        <LoginPage
          onNavigateToRegister={() => setView('register')}
          onNavigateToForgot={() => setView('forgot')}
          onSuccess={() => setView('dashboard')}
          onNavigateToHome={() => setView('default')}
        />
        <CookieBanner onOpenPrivacyPolicy={() => setView('privacy')} />
      </>
    );
  }

  if (view === 'register') {
    return (
      <>
        <RegisterPage
          onNavigateToLogin={() => setView('login')}
          onSuccess={() => setView('login')}
          onNavigateToHome={() => setView('default')}
        />
        <CookieBanner onOpenPrivacyPolicy={() => setView('privacy')} />
      </>
    );
  }

  if (view === 'forgot') {
    return (
      <>
        <ForgotPasswordPage
          onNavigateToLogin={() => setView('login')}
          onNavigateToHome={() => setView('default')}
        />
        <CookieBanner onOpenPrivacyPolicy={() => setView('privacy')} />
      </>
    );
  }

  if (view === 'reset') {
    return (
      <>
        <ResetPasswordPage onNavigateToLogin={() => setView('login')} />
        <CookieBanner onOpenPrivacyPolicy={() => setView('privacy')} />
      </>
    );
  }

  if (view === 'verify') {
    return (
      <>
        <VerifyEmailPage onNavigateToDashboard={() => setView('dashboard')} />
        <CookieBanner onOpenPrivacyPolicy={() => setView('privacy')} />
      </>
    );
  }

  if (view === 'privacy') {
    return (
      <>
        <PrivacyPolicyPage
          onBack={() => setView(user ? 'dashboard' : 'default')}
          onNavigateToHome={() => setView('landing')}
        />
        <CookieBanner onOpenPrivacyPolicy={() => setView('privacy')} />
      </>
    );
  }

  if (view === 'terms') {
    return (
      <>
        <TermsPage
          onBack={() => setView(user ? 'dashboard' : 'default')}
          onNavigateToHome={() => setView('landing')}
        />
        <CookieBanner onOpenPrivacyPolicy={() => setView('privacy')} />
      </>
    );
  }

  if (view === 'contact') {
    return (
      <>
        <ContactPage
          onBack={() => setView(user ? 'dashboard' : 'default')}
          onNavigateToHome={() => setView('landing')}
        />
        <CookieBanner onOpenPrivacyPolicy={() => setView('privacy')} />
      </>
    );
  }

  // Display Landing Page if explicitly navigated to ('landing') by anyone,
  // or as the default view for unauthenticated visitors (including after logout or deletion)
  if (view === 'landing' || (!user && (view === 'default' || view === 'dashboard'))) {
    return (
      <>
        <LandingPage
          onOpenLogin={() => setView('login')}
          onOpenRegister={() => setView('register')}
          onNavigateToPrivacy={() => setView('privacy')}
          onNavigateToTerms={() => setView('terms')}
          onNavigateToContact={() => setView('contact')}
          onGoToDashboard={() => setView('dashboard')}
          deletedNotification={deletedNotification}
          onDismissNotification={() => setDeletedNotification(null)}
        />
        <CookieBanner onOpenPrivacyPolicy={() => setView('privacy')} />
      </>
    );
  }

  // Authenticated Dashboard (or explicit dashboard request)
  return (
    <>
      <AppShell
        onOpenAuth={() => setView('login')}
        onNavigateToHome={() => {
          setView('landing');
          window.location.hash = '';
          window.history.replaceState(null, '', '/');
        }}
        onNavigateToPrivacy={() => setView('privacy')}
        onNavigateToTerms={() => setView('terms')}
        onNavigateToContact={() => setView('contact')}
      >
        {({ activeTab, onQuickCreate }) => {
          switch (activeTab) {
            case 'overview':
              return <OverviewPage onQuickCreate={onQuickCreate} />;

            case 'my-links':
              return <MyLinksPage />;

            case 'qr-studio':
              return <QrStudioPage />;

            case 'analytics':
              return <AnalyticsPage />;

            case 'history':
              return <HistoryPage />;

            case 'recycle-bin':
              return <RecycleBinPage />;

            case 'settings':
              return (
                <AccountSettingsView
                  onAccountDeleted={() => {
                    setDeletedNotification('Your account and all associated short URLs have been permanently removed.');
                    setView('landing');
                    window.location.hash = '';
                    window.history.replaceState(null, '', '/');
                  }}
                />
              );

            default:
              return (
                <EmptyState
                  icon={<Link2 className="w-5 h-5" />}
                  title="Page Not Found"
                  description="The requested view does not exist in the dashboard."
                />
              );
          }
        }}
      </AppShell>
      <CookieBanner onOpenPrivacyPolicy={() => setView('privacy')} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
