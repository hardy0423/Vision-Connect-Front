module.exports = {
  plugins: [
    require('tailwindcss'),
    require('@tailwindcss/postcss'), // This line might be unnecessary if you already have tailwindcss integrated
    require('autoprefixer'),
  ],
}