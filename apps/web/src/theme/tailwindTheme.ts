import type { Config } from 'tailwindcss';
import { colors, layout, radii, shadows, spacing, typeScale } from './tokens';

/**
 * The Tailwind `theme` block, built once from `tokens.ts` and shared by the
 * app's `tailwind.config.ts` and the component preview's own config — so the
 * preview can never drift into a palette or scale of its own.
 *
 * `fontSize`, `borderRadius` and `spacing` are overridden rather than
 * extended: the design is base-13px, so leaving Tailwind's 16px-base defaults
 * live would let an off-design value in behind a plausible-looking utility. A
 * missing class is a visible gap; a wrong-but-plausible one is not.
 */
export const tailwindTheme: Config['theme'] = {
  fontSize: typeScale.fontSize,
  borderRadius: radii,
  spacing,
  extend: {
    colors,
    fontFamily: typeScale.fontFamily,
    fontWeight: typeScale.fontWeight,
    letterSpacing: typeScale.letterSpacing,
    boxShadow: shadows,
    width: layout,
    height: layout,
    maxWidth: layout,
    minWidth: { ...spacing, ...layout },
    transitionProperty: {
      width: 'width',
    },
  },
};
