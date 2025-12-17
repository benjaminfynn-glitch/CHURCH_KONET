/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        methodist: {
          blue: '#0B3C5D',    // Royal Blue - authority, trust
          red: '#B11226',     // Red - faith, sacrifice, emphasis
          gold: '#C9A227',    // Gold - divine glory, excellence
          white: '#FFFFFF',   // White - purity, clarity
        },
        ink: '#0F172A',          // Primary text - strong
        muted: '#475569',        // Secondary text
        surface: '#F8FAFC',      // Card backgrounds
        border: '#E2E8F0',       // Borders
      },
    },
  },
  plugins: [],
}