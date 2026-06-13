/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf2f5',
          100: '#fce7ec',
          500: '#c2185b',
          600: '#ad1457',
          700: '#880e4f',
        },
      },
    },
  },
  plugins: [],
};
