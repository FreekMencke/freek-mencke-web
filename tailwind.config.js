const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  experimental: {
    optimizeUniversalDefaults: true,
  },
  theme: {
    colors: {
      // general
      transparent: 'transparent',
      white: colors.white,
      black: colors.black,

      primary: colors.green,
      secondary: colors.gray,
    },
    fontFamily: {
      sans: ['SOLIX'],
      mono: defaultTheme.fontFamily.mono,
    },
    extend: {
      spacing: {
        15: '3.75rem',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
