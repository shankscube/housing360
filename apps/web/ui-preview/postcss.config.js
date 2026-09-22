import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// tailwindcss discovers its config by searching upward from process.cwd(),
// which is the package root (not this ui-preview/ dir) when run via `npm run
// ui-preview`. Pass the path explicitly so it isn't cwd-dependent.
export default {
  plugins: {
    tailwindcss: { config: path.join(__dirname, 'tailwind.config.ts') },
    autoprefixer: {},
  },
};
