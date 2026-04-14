/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.{ejs,html,js}",
    "./views/**/*.ejs"
  ],
  theme: {
    extend: {
      colors: {
        'forest': '#2D5A27',
        'forest-dark': '#1E3D1A',
        'sunset': '#F4A460',
        'sky': '#87CEEB',
        'sage': '#F8F9F5',
        'night': '#1A1F1A'
      },
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
        'dm': ['DM Sans', 'sans-serif']
      }
    }
  },
  plugins: []
}
