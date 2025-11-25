/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./src/**/**/*.{html,ts}",
    "./src/**/**/**/*.{html,ts}",
    "./src/**/**/**/**/*.{html,ts}",
    "./src/**/**/**/**/**/*.{html,ts}",
    "./src/**/**/**/**/**/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        "custom-black": "#0A0A0A",
        "custom-gray": "#5F6368",
        primary: "#429dff",
        gray: "#343A40",
        secondary: "#fc3735",
        bluescale: "#f1f5f9",
        redscale: "#ff4649",
        purplescale: "#ff4081"
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
