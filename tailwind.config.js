/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {},
  plugins: [require('@tailwindcss/forms'), require("tailwindcss-animate")],
}
