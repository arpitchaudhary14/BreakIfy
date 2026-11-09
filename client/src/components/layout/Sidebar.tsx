import React from 'react';
import {
  LayoutDashboard,
  Link2,
  QrCode,
  BarChart3,
  History,
  Trash2,
  Settings,
  X,
  PlusCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';

export type NavItemKey =
  | 'overview'
  | 'my-links'
  | 'qr-studio'
  | 'analytics'
  | 'history'
  | 'recycle-bin'
  | 'settings';

export interface SidebarProps {
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpen: boolean;
  onClose: () => void;
  onQuickCreate?: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  onQuickCreate,
}: SidebarProps) {
  const navItems: { key: NavItemKey; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'my-links', label: 'My Links', icon: <Link2 className="w-4 h-4" /> },
    { key: 'qr-studio', label: 'QR Studio', icon: <QrCode className="w-4 h-4" /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { key: 'recycle-bin', label: 'Recycle Bin', icon: <Trash2 className="w-4 h-4" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const content = (
    <div className="flex flex-col h-full justify-between p-4 bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 select-none">
      <div className="space-y-4">
        {/* Mobile Header Close */}
        <div className="md:hidden flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Navigation
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Create CTA */}
        <div className="pt-1">
          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => {
              if (onQuickCreate) onQuickCreate();
              onClose();
            }}
          >
            New Short Link
          </Button>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectTab(item.key);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className={isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-60 flex-col flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 h-[calc(100vh-3.5rem)] sticky top-14">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/75 transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-50">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

