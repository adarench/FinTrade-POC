/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4da8ff',
          DEFAULT: '#0070f3',
          dark: '#005cc5',
        },
        success: {
          light: '#5cebaa',
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        danger: {
          light: '#ff4c4c',
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        warning: {
          light: '#ffbd4d',
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
    },
  },
  plugins: [],
}
