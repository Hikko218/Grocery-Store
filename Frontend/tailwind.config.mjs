// @ts-check

import typography from "@tailwindcss/typography";

/**
 * @type {import('tailwindcss').Config}
 */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "100%",
        md: "100%",
        lg: "64rem", // ~1024px
        xl: "72rem", // ~1152px
        "2xl": "80rem", // ~1280px
      },
    },
  },
  darkMode: "class",
  plugins: [typography],
};

export default config;
