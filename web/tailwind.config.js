/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tone resmi SMA Kartini Batam (tema "green_land"): hijau + emas.
        brand: {
          50: '#f1f7ef',
          100: '#ddebd9',
          200: '#bdd8b5',
          300: '#93bd88',
          400: '#639b56',
          500: '#437d39',
          600: '#32642d', // hijau utama situs
          700: '#224820', // hijau tua situs
          800: '#1b3a19',
          900: '#112610',
        },
        // Aksen emas/kuning dari situs (#fbbc05).
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#ffce3a',
          500: '#fbbc05',
          600: '#dba600',
          700: '#a87f00',
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
