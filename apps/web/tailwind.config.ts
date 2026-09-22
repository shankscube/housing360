import type { Config } from 'tailwindcss';
import { colors, spacing, typeScale } from './src/theme/tokens';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors,
      spacing,
      fontFamily: typeScale.fontFamily,
      fontSize: typeScale.fontSize,
    },
  },
  plugins: [],
} satisfies Config;
