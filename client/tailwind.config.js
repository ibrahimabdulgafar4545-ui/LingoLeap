export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        secondary: 'var(--secondary)',
        'secondary-hover': 'var(--secondary-hover)',
        'bg-main': 'var(--bg-main)',
        'bg-card': 'var(--bg-card)',
        'text-main': 'var(--text-main)',
        'text-secondary': 'var(--text-secondary)',
        border: 'var(--border)',
        
        brand: {
          green: 'var(--primary)',
          'green-hover': 'var(--primary-hover)',
          blue: 'var(--secondary)',
          'blue-hover': 'var(--secondary-hover)',
          orange: 'var(--primary)',
          'orange-hover': 'var(--primary-hover)',
          purple: 'var(--secondary)',
          'purple-hover': 'var(--secondary-hover)',
          yellow: 'var(--primary)',
          red: 'var(--accent-red)',
          gray: 'var(--border)',
          dark: 'var(--text-main)',
          light: 'var(--bg-main)',
        }
      },
      fontFamily: {
        sans: ['"Outfit"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        '3d-green': 'var(--shadow-3d-primary)',
        '3d-blue': 'var(--shadow-3d-secondary)',
        '3d-orange': 'var(--shadow-3d-primary)',
        '3d-purple': 'var(--shadow-3d-secondary)',
        '3d-gray': 'var(--shadow-3d-card)',
        '3d-red': '0 4px 0 var(--accent-red)',
        '3d-card': 'var(--shadow-3d-card)',
        '3d-primary': 'var(--shadow-3d-primary)',
        '3d-secondary': 'var(--shadow-3d-secondary)',
      }
    },
  },
  plugins: [],
}
