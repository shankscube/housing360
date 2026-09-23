import type { Config } from 'tailwindcss';
import { tailwindTheme } from './src/theme/tailwindTheme';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: tailwindTheme,
  plugins: [],
} satisfies Config;
