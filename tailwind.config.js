/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0b',
          900: '#0f0f10',
          850: '#141416',
          800: '#1a1a1d',
          750: '#222226',
          700: '#2a2a2f',
          600: '#3a3a42',
          500: '#52525b',
          400: '#71717a',
          300: '#a1a1aa',
          200: '#d4d4d8',
          100: '#f4f4f5',
        },
        ball: {
          50: '#fff1f1',
          100: '#ffe0e0',
          200: '#ffc7c7',
          300: '#ffa0a0',
          400: '#ff5a5a',
          500: '#e63946',
          600: '#cc1f2e',
          700: '#a31723',
          800: '#7a111b',
          900: '#5c0d15',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 0 1px rgba(230,57,70,0.25), 0 8px 30px -8px rgba(230,57,70,0.18)',
        'glow-strong': '0 0 0 1px rgba(230,57,70,0.45), 0 10px 40px -6px rgba(230,57,70,0.35)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'scale-in': 'scale-in 0.18s ease-out',
      },
    },
  },
  plugins: [],
};
