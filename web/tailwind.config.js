/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf2f5',
          100: '#fce7ec',
          200: '#fbcfdb',
          300: '#f7a8c0',
          400: '#ee6d96',
          500: '#c2185b',
          600: '#ad1457',
          700: '#880e4f',
          800: '#6d0c40',
          900: '#4f0a30',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 6px -1px rgb(0 0 0 / 0.06)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .15s ease-out',
        'scale-in': 'scale-in .18s ease-out',
      },
    },
  },
  plugins: [],
};
