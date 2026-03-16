/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ebbe: {
          blue:   '#1565C0',
          green:  '#2E7D32',
          amber:  '#E65100',
          purple: '#4527A0',
        },
      },
    },
  },
  plugins: [],
};
