/**
 * Design tokens extracted from `docs/Housing360 Portal.html` (the approved
 * design reference). This file is the single source of truth for color,
 * spacing, radius, shadow, and typography — `tailwind.config.ts` (and the
 * component-preview config) build their theme from it, and no component under
 * `src/components/` may carry an inline hex, an arbitrary Tailwind value, or a
 * magic pixel number. If the design needs a value that isn't here, add it here.
 *
 * Tokens are named for the role they play, not the value they hold.
 */

/**
 * The bundle's brand constants, verbatim:
 *   NAVY #0E2242 · TEAL #4ACEB4 · TEAL_D #1B6153
 *   LBLUE #B7D1F4 · CORAL #F47668 · GOLD #F2A900
 */
export const colors = {
  /** NAVY. Primary text, primary button fill, active nav label, avatar fill. */
  ink: '#0E2242',
  /** Navy button hover. */
  inkHover: '#16305C',
  /** Body text on a navy surface. */
  inkContrast: '#B7D1F4',
  /** Muted text on a navy surface. */
  inkContrastMuted: '#7F9AC4',

  /** TEAL. Secondary action fill, active step, accent stroke. */
  teal: '#4ACEB4',
  /** Teal button hover. */
  tealHover: '#3FBCA3',
  /** TEAL_D. Text on a teal tint, link hover, time labels. */
  tealDeep: '#1B6153',

  /** LBLUE. Chart bars, informational accents. */
  blueSoft: '#B7D1F4',
  /** Text on a blue tint. */
  blueDeep: '#22477A',

  coral: '#F47668',
  /** Text on a coral tint. */
  coralDeep: '#AB4234',

  gold: '#F2A900',
  /** Text on a gold tint. */
  goldDeep: '#6B4E00',

  /** Cards, nav rail, top-bar controls. */
  surface: '#FFFFFF',
  /** Page background, inset panels, user card. */
  surfaceApp: '#F4F6FA',
  /** Table header band, table row hover, caption strips. */
  surfaceMuted: '#FAFBFD',
  /** Quiet badge fill, inactive chip fill (bundle uses #F0F3F8 / #F2F5FA). */
  surfaceSubtle: '#F0F3F8',
  /** Nav item hover tint. */
  surfaceHover: '#F1F5FA',

  /** The bundle's most-used color (85 occurrences): secondary/muted text. */
  textMuted: '#5A6B85',
  /** Deemphasized text — quiet badge label, inactive stepper label. */
  textFaint: '#8494AC',
  /** Quiet badge label. */
  textQuiet: '#55657E',

  /** Card section dividers. */
  borderSubtle: '#F1F4F9',
  /** Table row hairlines (bundle also uses #F4F6FA here). */
  borderRow: '#EDF1F7',
  /** Outlined button border, scrollbar thumb. */
  borderStrong: '#CBD5E1',
  /** Stepper connectors and unreached step fill (bundle: #E1E7EF / #EEF1F4). */
  borderStep: '#E1E7EF',
  /** Unreached stepper node fill. */
  surfaceStep: '#EEF1F4',

  /**
   * Status badge fills. The bundle expresses these as translucent rgba over a
   * white or `surfaceMuted` card; kept as rgba so they composite the same way.
   */
  tealTint: 'rgba(74, 206, 180, 0.16)',
  /** The heavier teal tint used by the nav rail's active item and count pill. */
  tealTintStrong: 'rgba(74, 206, 180, 0.22)',
  navyTint: 'rgba(14, 34, 66, 0.07)',
  blueTint: 'rgba(183, 209, 244, 0.42)',
  goldTint: 'rgba(242, 169, 0, 0.16)',
  coralTint: 'rgba(244, 118, 104, 0.15)',
};

/**
 * Spacing. The named steps stay for readability; the numeric steps replace
 * Tailwind's 16px-base defaults with the values the bundle actually uses, so
 * an off-design number can't slip in behind a plausible-looking utility.
 *
 * Bundle padding pairs this scale has to express: 13px 20px (table cell),
 * 16px 20px (card head), 11px 20px (table header), 20px 22px (card),
 * 8px 15px (chip), 9px 17px (small button), 11px 20px (button), 5px 11px
 * (badge), 26px 32px (page header), 11px 14px (search card), 12px 13px
 * (user card), 2px 7px (count pill).
 */
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '2px',
  1: '3px',
  1.5: '5px',
  2: '6px',
  2.5: '7px',
  3: '8px',
  3.5: '9px',
  4: '10px',
  4.5: '11px',
  5: '12px',
  5.5: '13px',
  6: '14px',
  6.5: '15px',
  7: '16px',
  7.5: '17px',
  8: '18px',
  9: '20px',
  10: '22px',
  11: '24px',
  12: '26px',
  13: '28px',
  14: '32px',
  16: '36px',
  18: '40px',
  20: '44px',
  24: '56px',

  // Named steps, kept for readability at call sites.
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '26px',
};

/**
 * Type scale. The bundle is **base-13px, not base-16px** — that is its density,
 * and rebasing it to 16 would change every screen. It uses 23 distinct sizes,
 * several fractional; they are quantized to the 12 steps below.
 *
 *   2xs  10px   ← 10, 10.5   uppercase group headers, table column labels
 *   xs   11px   ← 11, 11.5   badges, sub-labels, count pills
 *   sm   12.5px ← 12, 12.5, 12.8  body small, chips, muted sub-lines
 *   base 13px   ← 13, 13.2, 13.5  table cells, nav items, buttons, inputs
 *   md   14px   ← 14, 15
 *   lg   17px   ← 16, 17, 18  card titles
 *   xl   21px   ← 19, 21
 *   2xl  24px   ← 23, 24
 *   3xl  27px   ← 27         page title
 *   4xl  30px   ← 30
 *   5xl  36px   ← 36         KPI numerals
 *   6xl  52px   ← 52         hero stat
 */
export const typeScale = {
  fontFamily: {
    /** Everything: body, controls, tables, nav. */
    sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
    /** Page titles, KPI numerals, card titles. */
    display: ['Lora', 'Georgia', 'serif'],
  },
  fontSize: {
    '2xs': '0.625rem',
    xs: '0.6875rem',
    sm: '0.78125rem',
    base: '0.8125rem',
    md: '0.875rem',
    lg: '1.0625rem',
    xl: '1.3125rem',
    '2xl': '1.5rem',
    '3xl': '1.6875rem',
    '4xl': '1.875rem',
    '5xl': '2.25rem',
    '6xl': '3.25rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  /** Bundle uses -0.5/-0.4 (display) and 0.6…1.3 (uppercase labels). */
  letterSpacing: {
    tighter: '-0.5px',
    tight: '-0.4px',
    normal: '0',
    wide: '0.9px',
    wider: '1.2px',
  },
};

/** Bundle radii (3–20px) quantized to a six-step ramp. */
export const radii = {
  none: '0',
  /** Score bars, progress fills. */
  xs: '4px',
  /** Small/ghost buttons. */
  sm: '7px',
  /** Buttons, status badges. */
  md: '9px',
  /** Chips, nav items, search card, top-bar controls. */
  lg: '12px',
  /** User card. */
  xl: '14px',
  /** Content cards, KPI tiles, table containers. */
  '2xl': '18px',
  /** Dots, avatars, count pills. */
  full: '9999px',
};

/** Verbatim from the bundle — these are signatures, not quantized. */
export const shadows = {
  /** Content cards, KPI tiles. */
  card: '0 1px 2px rgba(14, 34, 66, 0.05), 0 10px 30px -16px rgba(14, 34, 66, 0.22)',
  /** Top-bar controls: search card, icon buttons. */
  control: '0 1px 2px rgba(14, 34, 66, 0.05), 0 8px 22px -16px rgba(14, 34, 66, 0.3)',
  /** The active filter chip's lift. */
  lifted: '0 8px 18px -10px rgba(14, 34, 66, 0.7)',
  /** The navy data-quality alert panel. */
  panel: '0 18px 40px -22px rgba(14, 34, 66, 0.55)',
  none: 'none',
};

/** Fixed layout measures the shell needs. */
export const layout = {
  /** The bundle's nav rail width. */
  railWidth: '262px',
  /** Icon-only rail — no bundle reference; see the change's open items. */
  railWidthCollapsed: '72px',
  /** The bundle's KPI grid is `auto-fit, minmax(200px, 1fr)`. */
  kpiMinWidth: '200px',
  /** Login card width. */
  formCardWidth: '380px',
  /** StatusStepper node diameter. */
  stepNode: '27px',
  /** StatusStepper connector length. */
  stepConnector: '38px',
  /** Nav rail user-card avatar. */
  avatar: '34px',
  /** The intake wizard's step-rail column. */
  wizardRail: '288px',
  /** A select that shouldn't stretch the full form width (e.g. Veteran Status). */
  fieldNarrow: '288px',
  /** The wordmark's rendered width in the bundle's rail. */
  logo: '154px',
  /** The nav rail user-card's account-menu popover (log out). */
  menuWidth: '176px',
};
