import path from 'path';
import type { Config } from 'tailwindcss';
import { colors, spacing, typeScale } from '../src/theme/tokens';

// Tailwind resolves relative `content` globs against the process cwd, not
// this file's directory — and the preview's npm script runs from the
// package root, not from here. Use absolute paths so it works either way.
const here = (glob: string) => path.join(__dirname, glob);

export default {
  content: [here('index.html'), here('**/*.{ts,tsx}'), here('../src/**/*.{ts,tsx}')],
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
