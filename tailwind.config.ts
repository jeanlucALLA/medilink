import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0052FF', // Deep Blue
          light: '#3374FF',
          dark: '#003ECC',
        },
        secondary: '#F5F5F7', // Light Gray
      },
      borderRadius: {
        '3xl': '24px',
      },
      animation: {
        'scroll': 'scroll 50s linear infinite',
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
export default config




