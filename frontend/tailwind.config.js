// File: tailwind.config.js  ← plain JS so Vite can pick it up
/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',   // all your TS / TSX files
  ],
  theme: {
    extend: {},              // default theme -> includes rounded-xl etc.
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
};