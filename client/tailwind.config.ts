import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        mono: {
          canvas: {
            DEFAULT: '#fafafa',
            dark: '#09090b',
          },
          surface: {
            DEFAULT: '#ffffff',
            dark: '#121214',
          },
          subtle: {
            DEFAULT: '#f4f4f5',
            dark: '#18181b',
          },
          border: {
            DEFAULT: '#e4e4e7',
            dark: '#27272a',
          },
          borderSubtle: {
            DEFAULT: '#f4f4f5',
            dark: '#1f1f23',
          },
          text: {
            primary: {
              DEFAULT: '#09090b',
              dark: '#f4f4f5',
            },
            secondary: {
              DEFAULT: '#52525b',
              dark: '#a1a1aa',
            },
            muted: {
              DEFAULT: '#71717a',
              dark: '#71717a',
            },
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'subtle-light': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'elevated-light': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'subtle-dark': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'elevated-dark': '0 4px 12px 0 rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
} satisfies Config;
