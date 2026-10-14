import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nature: {
          bg: '#FAFAF6',
          secondary: '#F1F5EE',
          border: '#E3E8DF',
          text: '#252B26',
          muted: '#687168',
        },
        forest: {
          primary: '#245C3A',
          dark: '#193D2A',
          accent: '#4F8558',
          50: '#F5F8F4',
          100: '#E7EFE6',
          200: '#CFDEC9',
          600: '#3A744E',
          700: '#2E6541',
          800: '#245C3A', // primary
          900: '#193D2A', // dark
        },
        charcoal: {
          50: '#F7F8F7',
          100: '#EEEEEC',
          200: '#E3E8DF',
          300: '#C2CDC0',
          400: '#94A392',
          500: '#687168',
          600: '#4D554D',
          700: '#3A423A',
          800: '#252B26',
          900: '#171B18',
          950: '#0E110F',
        },
        cream: {
          50: '#FCFDFB',
          100: '#FAFAF6',
          200: '#F1F5EE',
          300: '#E7EFE6',
        },
      },
    },
  },
  plugins: [],
};

export default config;
