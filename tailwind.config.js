module.exports = {
  mode: "jit",
  content: [
    "./src/**/**/*.{js,ts,jsx,tsx,html,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,html,mdx}",
  ],
  darkMode: "class",
  theme: {
    // screens: { md: { max: "1050px" }, sm: { max: "550px" }, },
    screens: {
      md: { max: "1050px" }, sm: { max: "550px" },
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        black: { 900: "var(--black_900)" },
        blue_gray: { 900: "var(--blue_gray_900)" },
        gray: {
          600: "var(--gray_600)",
          700: "var(--gray_700)",
          900: "var(--gray_900)",
        },
        indigo: {
          400: "var(--indigo_400)",
          700: "var(--indigo_700)",
          "400_33": "var(--indigo_400_33)",
        },
        light_green: {
          700: "var(--light_green_700)",
          900: "var(--light_green_900)",
        },
        red: { 600: "var(--red_600)" },
        white: { a700: "var(--white_a700)" },
      },
      boxShadow: {},
      fontFamily: { segoeui: "Segoe UI", inter: "Inter" },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
