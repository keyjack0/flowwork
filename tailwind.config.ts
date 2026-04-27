import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#685AFF',
          light: '#8B7FFF',
          dark: '#4A3FCC',
          bg: 'rgba(104, 90, 255, 0.08)',
        },
      },
    },
  },
  plugins: [],
}
export default config
