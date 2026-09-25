/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#FF5A1F',
          light: '#FF7A45',
          dark: '#D8480F',
        },
        cyber: {
          bg: '#0A0E1A',
          panel: '#1A1F2E',
          alert: '#FF4D4D',
          safe: '#00E599',
          text: '#F5F5F5',
          muted: '#8B95A5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        cyber: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        cyber: '12px',
      },
      boxShadow: {
        soft: '0 2px 10px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        panel: '0 4px 20px rgba(0,0,0,0.08)',
        glow: '0 0 0 1px rgba(0,229,153,0.4), 0 0 16px rgba(0,229,153,0.25)',
        'glow-alert': '0 0 0 1px rgba(255,77,77,0.4), 0 0 16px rgba(255,77,77,0.25)',
      },
    },
  },
  plugins: [],
}
