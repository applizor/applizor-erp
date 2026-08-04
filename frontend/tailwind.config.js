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
          600: '#0b4d6e',
          700: '#093f5a',
          800: '#08344b',
          900: '#072b3e',
        },
        brand: {
          dark: '#0f172a',
          teal: '#00d2ff',
          blue: '#3a7bd5',
        }
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        soft: '180ms',
        'soft-slow': '280ms',
      },
      boxShadow: {
        soft: '0 4px 12px -2px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)',
        'soft-md': '0 10px 24px -6px rgb(15 23 42 / 0.08), 0 4px 8px -4px rgb(15 23 42 / 0.04)',
      },
    },
  },
  plugins: [],
}
