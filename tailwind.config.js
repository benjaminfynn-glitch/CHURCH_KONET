/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: false, // 🔥 DISABLE dark mode completely
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        methodist: {
          blue: '#0B3C5D',
          red: '#B11226',
          gold: '#C9A227',
          white: '#FFFFFF',
        },
        'methodist-blue': '#0B3C5D',
        'methodist-red': '#B11226',
        'methodist-gold': '#C9A227',
        'methodist-white': '#FFFFFF',
        ink: '#0F172A',          // Primary text - strong
        muted: '#475569',        // Secondary text
        surface: '#F8FAFC',      // Card backgrounds
        border: '#E2E8F0',       // Borders
      },
    },
  },
  plugins: [],
}