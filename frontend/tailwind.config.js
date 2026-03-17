/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        brand: ['"Baloo 2"', 'cursive'],
      },
      colors: {
        ebbe: {
          blue:   '#1565C0',
          green:  '#2E7D32',
          amber:  '#F5A623',
          purple: '#4527A0',
        },
      },
    },
  },
  plugins: [],
};
