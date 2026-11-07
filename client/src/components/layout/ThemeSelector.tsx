import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
    { mode: 'system', label: 'System', icon: <Laptop className="w-3.5 h-3.5" /> },
    { mode: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="inline-flex items-center p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400">
      {options.map((opt) => {
        const isActive = theme === opt.mode;
        return (
          <button
            key={opt.mode}
            onClick={() => setTheme(opt.mode)}
            title={`Switch to ${opt.label} theme`}
            className={`p-1.5 rounded-md text-xs flex items-center space-x-1 transition-all ${
              isActive
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-medium'
                : 'hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {opt.icon}
            <span className="sr-only sm:not-sr-only text-[11px] px-0.5">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

