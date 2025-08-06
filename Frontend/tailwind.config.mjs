// @ts-check

import typography from '@tailwindcss/typography';

/**
 * @type {import('tailwindcss').Config}
 */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [typography],
};

export default config;
