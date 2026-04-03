/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 900: '#0a1628', 800: '#111827', 700: '#1e293b' },
      },
    },
  },
  plugins: [],
}
