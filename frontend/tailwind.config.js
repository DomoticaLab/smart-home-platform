/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        navy: '#1A3A5C',
        gold: '#C9A96E',
        green: '#2D7A4F',
        red: '#B03030',
        'bg-primary': '#0F1117',
        'bg-secondary': '#161B22',
        'bg-card': '#1C2333',
        'border-default': '#30363D',
        'text-primary': '#E6EDF3',
        'text-secondary': '#8B949E'
      }
    }
  },
  plugins: []
}
