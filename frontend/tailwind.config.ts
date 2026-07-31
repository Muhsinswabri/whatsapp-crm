import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefbf3',
          100: '#d6f5e1',
          500: '#1e9e5a',
          600: '#187f48',
          700: '#136339',
        },
        status: {
          ok: '#1e9e5a',
          warn: '#b45309',
          error: '#b3251e',
        },
      },
    },
  },
  plugins: [],
};

export default config;
