/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          50: '#FAF6E6',
          100: '#F5EDCD',
          200: '#EBDA9B',
          300: '#E1C869',
          400: '#DAB638',
          500: '#D4AF37',
          600: '#AA8C2C',
          700: '#806921',
          800: '#554616',
          900: '#2B230B',
        },
        'deep-black': '#0A0A0A',
        'luxury-white': '#FFFFFF',
      },
    },
  },
  plugins: [],
}
