/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      },
      colors: {
        primary: { DEFAULT: '#1d4ed8', hover: '#1e40af', light: '#eff6ff' },
        sidebar: { DEFAULT: '#0f172a', border: '#1e293b' },
      },
    },
  },
  plugins: [],
}
