module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./node_modules/flowbite/**/*.{js,ts}"
  ],
  theme: {
    extend: {
      colors: {
        'cblue': '#1da1f2',
        'darknavy': '#132E35',
        'darkgreen': '#044013',
        'ciraqbackground': '#f7f7f7',
      },
    },
  },
  plugins: [
    require('flowbite/plugin'),
  ],
  content: [
    // other files...
    "./node_modules/flowbite/**/*.{js,ts}"
  ],
}