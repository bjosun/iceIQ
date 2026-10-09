/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          gold: '#FFD700',
          'gold-dark': '#FFA500',
        },
        hockey: {
          blue: '#00ADEF',
          cyan: '#22d3ee',
          ice: '#88d3ee',
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float-up': 'float-up 0.8s ease-out forwards',
        'count-pop': 'count-pop 0.28s ease-out',
        'confetti': 'confetti 0.9s ease-out forwards',
        'goal-flash': 'goal-flash 0.6s ease-out',
        'slide-in': 'slide-in 0.45s ease-out both',
        'sheet-up': 'sheet-up 0.28s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        'float-up': {
          '0%': { opacity: 0, transform: 'translateY(0) scale(0.8)' },
          '20%': { opacity: 1, transform: 'translateY(-10px) scale(1.1)' },
          '100%': { opacity: 0, transform: 'translateY(-44px) scale(1)' },
        },
        'count-pop': {
          '0%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.35)' },
          '100%': { transform: 'scale(1)' },
        },
        confetti: {
          '0%': { opacity: 1, transform: 'translate(0, 0) rotate(0deg)' },
          '100%': { opacity: 0, transform: 'translate(var(--dx), var(--dy)) rotate(var(--rot))' },
        },
        'goal-flash': {
          '0%': { boxShadow: '0 0 0 0 rgba(74, 222, 128, 0.7)' },
          '100%': { boxShadow: '0 0 0 18px rgba(74, 222, 128, 0)' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: 0, transform: 'translateY(14px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}