/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        snap: {
          bg: '#121212',
          nav: '#181818',
          line: '#3a3a3a',
          btn: '#2a2a2a',
          yellow: '#FFFC00',
          red: '#F23C57',
          blue: '#0EADFF',
          purple: '#A05DCD',
          grey: '#A6A6A6',
          title: '#E9E9E9',
        },
      },
      fontFamily: {
        snap: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
