import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isMono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isMono = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-lg flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-lg text-sm transition-colors border bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 ${
              error
                ? 'border-red-400 dark:border-red-500/70 focus:border-red-500 focus:ring-red-500/30'
                : 'border-zinc-300 dark:border-zinc-800 focus:border-zinc-500 dark:focus:border-zinc-500 focus:ring-zinc-400/40 dark:focus:ring-zinc-600/40'
            } ${leftIcon ? 'pl-9' : 'pl-3.5'} ${rightIcon ? 'pr-9' : 'pr-3.5'} py-2 ${
              isMono ? 'font-mono' : 'font-sans'
            } disabled:bg-zinc-50 dark:disabled:bg-zinc-950 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-zinc-400 dark:text-zinc-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

