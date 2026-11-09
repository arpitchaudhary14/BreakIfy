import React, { useState, useEffect, useRef } from 'react';
import { Search, Menu, Command, Settings, LogOut, LogIn, Bell, Check, Trash2 } from 'lucide-react';
import breakifyLogo from '@assets/images/BreakIfy Logo.png';
import { ThemeSelector } from './ThemeSelector';
import { Dropdown, DropdownItem } from '../ui/Dropdown';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { notificationApi, NotificationItem } from '../../services/notificationApi';

export interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch?: () => void;
  onOpenAuth?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToHome?: () => void;
}

export function Header({
  onToggleSidebar,
  onOpenSearch,
  onOpenAuth,
  onNavigateToSettings,
  onNavigateToHome,
}: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotifs = async () => {
      try {
        const res = await notificationApi.getNotifications({ limit: 10 });
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      } catch {
        // Fallback
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // 30s poll for in-app alerts
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Click outside to close notification menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignored
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignored
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (!notifications.find((n) => n._id === id)?.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // Ignored
    }
  };

  const profileMenuItems: DropdownItem[] = [
    {
      id: 'profile',
      label: 'Account & Security',
      icon: <Settings className="w-3.5 h-3.5" />,
      onClick: () => {
        if (onNavigateToSettings) onNavigateToSettings();
      },
    },
    {
      id: 'signout',
      label: 'Sign out',
      icon: <LogOut className="w-3.5 h-3.5" />,
      destructive: true,
      onClick: async () => {
        await logout();
        if (onNavigateToHome) onNavigateToHome();
      },
    },
  ];

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AV';

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-sm sticky top-0 z-30 transition-colors">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Brand logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={onNavigateToHome}
            className="flex items-center space-x-2.5 cursor-pointer group hover:opacity-90 transition-opacity"
            title="Go to Home"
          >
            <img
              src={breakifyLogo}
              alt="BreakIfy Logo"
              className="h-8 w-auto object-contain select-none transition-transform group-hover:scale-105"
            />
            <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 hidden sm:inline-block">
              BreakIfy
            </span>
          </div>
        </div>

        {/* Center: Search Interface */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 text-xs text-zinc-400 dark:text-zinc-500 flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5" />
              <span>Search links, tags, domains...</span>
            </div>
            <kbd className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
              <Command className="w-2.5 h-2.5 mr-0.5" />
              <span>K</span>
            </kbd>
          </button>
        </div>

        {/* Right: Notifications + Theme Selector + Profile / Auth */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen((v) => !v)}
                className="relative p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#09090b]" />
                )}
              </button>

              {/* Notification Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                          className={`p-3 text-xs transition-colors cursor-pointer ${
                            n.isRead
                              ? 'bg-transparent text-zinc-600 dark:text-zinc-400'
                              : 'bg-zinc-50/80 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100 font-medium'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                {!n.isRead && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                )}
                                <span className="font-semibold text-xs truncate">{n.title}</span>
                              </div>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                                {n.message}
                              </p>
                              <div className="text-[10px] text-zinc-400 font-mono pt-1">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </div>
                            </div>

                            <button
                              onClick={(e) => handleDeleteNotification(n._id, e)}
                              className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                              title="Delete notification"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <ThemeSelector />

          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />

          {isAuthenticated ? (
            <Dropdown
              align="right"
              trigger={
                <button
                  className="flex items-center space-x-2 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors select-none"
                  aria-label="User menu"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-medium text-xs">
                      {initials}
                    </div>
                  )}
                  <div className="hidden lg:block text-left text-xs leading-tight">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {user?.email || ''}
                    </div>
                  </div>
                </button>
              }
              items={profileMenuItems}
            />
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenAuth}
              leftIcon={<LogIn className="w-3.5 h-3.5" />}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
