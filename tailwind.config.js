/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.js"
  ],
  theme: {
    extend: {
      colors: {
        'otter-orange': '#ffaa00',
        'otter-bg': '#0a0a0f',
        'scale-guard': '#2d5016',
      },
      fontFamily: {
        'game': ['monospace'],
      },
    },
  },
  plugins: [],
}
