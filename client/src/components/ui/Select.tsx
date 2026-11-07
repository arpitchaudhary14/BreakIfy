import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-lg flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`w-full appearance-none rounded-lg text-sm transition-colors border bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 pl-3.5 pr-10 py-2 focus:outline-none focus:ring-1 ${
              error
                ? 'border-red-400 dark:border-red-500/70 focus:border-red-500 focus:ring-red-500/30'
                : 'border-zinc-300 dark:border-zinc-800 focus:border-zinc-500 dark:focus:border-zinc-500 focus:ring-zinc-400/40 dark:focus:ring-zinc-600/40'
            } disabled:bg-zinc-50 dark:disabled:bg-zinc-950 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 pointer-events-none text-zinc-400 dark:text-zinc-500">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

