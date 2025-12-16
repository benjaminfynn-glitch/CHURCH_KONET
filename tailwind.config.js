/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1976D2',  // Rich Blue
          light: '#90CAF9',    // Light Blue
          dark: '#0D47A1',     // Dark Blue
        },
        secondary: {
          DEFAULT: '#B71C1C',  // Deep Red
          light: '#E57373',    // Light Red
          dark: '#670A0A',     // Dark Red
        },
        accent: {
          DEFAULT: '#F57F17',  // Vibrant Gold
          light: '#FFB74D',    // Light Gold
          dark: '#C41C00',     // Dark Gold
        },
        text: {
          primary: '#212121',    // Dark Gray
          secondary: '#757575',  // Medium Gray
          light: '#FFFFFF',      // White
        },
      },
    },
  },
  plugins: [],
}