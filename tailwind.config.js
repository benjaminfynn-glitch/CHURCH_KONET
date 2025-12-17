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
        textPrimary: '#0F172A',  // Dark Text
        textMuted: '#475569',    // Muted Text
        borderGray: '#E2E8F0',   // Border Gray
        lightGray: '#F8FAFC',    // Light Gray
      },
    },
  },
  plugins: [],
}