/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'haunted-dark': '#0a0a0a',
        'haunted-purple': '#6b21a8',
        'haunted-orange': '#ea580c',
        'haunted-green': '#16a34a',
      },
      fontFamily: {
        'spooky': ['Creepster', 'cursive'],
      },
    },
  },
  plugins: [],
}
