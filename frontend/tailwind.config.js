/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7f9',
          100: '#dbeff4',
          200: '#bce1ea',
          300: '#8ecbd9',
          400: '#57abc1',
          500: '#3a8da1',
          600: '#0b4d6e', // Base Petrol Blue
          700: '#093f5a',
          800: '#08344b',
          900: '#072b3e',
        },
        brand: {
          dark: '#0f172a', // Deep slate for sidebar/menus
          teal: '#00d2ff', // Cyan for accents
          blue: '#3a7bd5', // Blue for accents
        }
      },
    },
  },
  plugins: [],
}
