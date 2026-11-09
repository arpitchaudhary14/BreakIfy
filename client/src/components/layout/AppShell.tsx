import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar, NavItemKey } from './Sidebar';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Search, Link2, Check, AlertCircle } from 'lucide-react';
import { linkApi } from '../../services/linkApi';
import { getShortUrl, getShortDisplay } from '../../utils/urlHelper';

interface AppShellProps {
  onOpenAuth?: () => void;
  onNavigateToHome?: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToContact?: () => void;
  children: (props: {
    activeTab: NavItemKey;
    setActiveTab: (tab: NavItemKey) => void;
    onQuickCreate: () => void;
  }) => React.ReactNode;
}

export function AppShell({
  onOpenAuth,
  onNavigateToHome,
  onNavigateToPrivacy,
  onNavigateToTerms,
  onNavigateToContact,
  children,
}: AppShellProps) {
  const [activeTab, setActiveTab] = useState<NavItemKey>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Quick form state
  const [targetUrl, setTargetUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdShortUrl, setCreatedShortUrl] = useState<string | null>(null);

  const handleQuickCreateSubmit = async () => {
    if (!targetUrl.trim()) return;
    setIsCreating(true);
    setCreateError(null);

    let finalUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    try {
      const res = await linkApi.createLink({
        originalUrl: finalUrl,
        customSlug: customSlug.trim() || undefined,
      });

      const fullShort = getShortUrl(res.link.shortCode);
      setCreatedShortUrl(fullShort);
      navigator.clipboard.writeText(fullShort).catch(() => {});

      // Dispatch event to refresh links in any view
      window.dispatchEvent(new CustomEvent('link-created', { detail: res.link }));

      setTimeout(() => {
        setIsCreateOpen(false);
        setTargetUrl('');
        setCustomSlug('');
        setCreatedShortUrl(null);
      }, 4000);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create short link');
    } finally {
      setIsCreating(false);
    }
  };

  // Global keyboard shortcut listener for CMD+K / CTRL+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-mono-canvas dark:bg-mono-canvas-dark text-mono-text-primary dark:text-mono-text-primary-dark flex flex-col transition-colors duration-200">
      {/* Top Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={onOpenAuth}
        onNavigateToSettings={() => setActiveTab('settings')}
        onNavigateToHome={onNavigateToHome}
      />

      {/* Main Workspace: Sidebar + Content */}
      <div className="flex-1 flex w-full">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onQuickCreate={() => setIsCreateOpen(true)}
        />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          {children({
            activeTab,
            setActiveTab,
            onQuickCreate: () => setIsCreateOpen(true),
          })}
        </main>
      </div>

      {/* Quick Search Dialog (⌘K) */}
      <Dialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        title="Command Palette & Quick Search"
        description="Jump to links, analytics, or platform tools"
        maxWidth="md"
      >
        <div className="space-y-4">
          <Input
            autoFocus
            placeholder="Type a command or search..."
            leftIcon={<Search className="w-4 h-4" />}
          />

          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 py-1">
              Quick Navigation
            </div>
            <button
              onClick={() => {
                setActiveTab('overview');
                setIsSearchOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center justify-between text-zinc-700 dark:text-zinc-300"
            >
              <span>Go to Overview Dashboard</span>
              <kbd className="text-[10px] text-zinc-400">↵</kbd>
            </button>
            <button
              onClick={() => {
                setActiveTab('my-links');
                setIsSearchOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center justify-between text-zinc-700 dark:text-zinc-300"
            >
              <span>View All Shortened Links</span>
              <kbd className="text-[10px] text-zinc-400">↵</kbd>
            </button>
            <button
              onClick={() => {
                setActiveTab('settings');
                setIsSearchOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center justify-between text-zinc-700 dark:text-zinc-300"
            >
              <span>Account & Security Settings</span>
              <kbd className="text-[10px] text-zinc-400">↵</kbd>
            </button>
          </div>
        </div>
      </Dialog>

      {/* Quick Create Link Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Short Link"
        description="Generate an instant trackable short link"
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateOpen(false);
                setCreateError(null);
                setCreatedShortUrl(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleQuickCreateSubmit}
              disabled={!targetUrl || isCreating}
              isLoading={isCreating}
            >
              {isCreating ? 'Shortening...' : 'Shorten URL'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {createError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          {createdShortUrl && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>
                  Copied:{' '}
                  <a
                    href={createdShortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    {createdShortUrl}
                  </a>
                </span>
              </div>
            </div>
          )}

          <Input
            label="Destination URL"
            placeholder="https://example.com/very/long/campaign-url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            leftIcon={<Link2 className="w-4 h-4" />}
            autoFocus
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Custom Alias (Optional)
            </label>
            <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden focus-within:ring-1 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-600">
              <span className="inline-flex items-center px-3 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 font-mono select-none">
                {getShortDisplay('')}
              </span>
              <input
                type="text"
                placeholder="promo-2026"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Leave blank to automatically generate a collision-safe 7-character code.
            </p>
          </div>
        </div>
      </Dialog>
      {/* Application Footer with Copyright */}
      <footer className="w-full py-4 px-4 sm:px-6 lg:px-8 border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
        <div className="flex items-center space-x-2">
          <span>&copy; 2026 BreakIfy. All Rights Reserved.</span>
        </div>
        <div className="flex items-center space-x-4">
          {onNavigateToHome && (
            <button
              onClick={onNavigateToHome}
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Home
            </button>
          )}
          {onNavigateToPrivacy && (
            <button
              onClick={onNavigateToPrivacy}
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Privacy Policy
            </button>
          )}
          {onNavigateToTerms && (
            <button
              onClick={onNavigateToTerms}
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Terms & Conditions
            </button>
          )}
          {onNavigateToContact && (
            <button
              onClick={onNavigateToContact}
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Contact Support
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
