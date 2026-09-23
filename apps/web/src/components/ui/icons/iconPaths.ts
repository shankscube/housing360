/**
 * Icon geometry transcribed from `docs/Housing360 Portal.html`.
 *
 * The nav icons are the bundle's `ICON` map verbatim; `search`, `alert` and
 * `check` are the icons it draws inline. `bell`, `settings` and the chevrons
 * have no counterpart in the bundle (its top bar carries neither a
 * notifications control nor a settings control, and its rail does not
 * collapse) — they are drawn in the same idiom: a 24-unit viewBox, stroked,
 * round caps and joins, no fill.
 *
 * Kept as data rather than JSX so the set stays a flat, reviewable table.
 */

export interface IconShape {
  /** SVG path `d` strings, drawn in order. */
  paths: string[];
  /** Circles drawn alongside the paths — the bundle's search glass uses one. */
  circles?: { cx: number; cy: number; r: number }[];
}

export const ICON_SHAPES = {
  // --- the bundle's ICON map, verbatim ---
  home: { paths: ['M3 10.5 12 3l9 7.5V21H3z'] },
  users: {
    paths: ['M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
  },
  cases: { paths: ['M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'] },
  assess: { paths: ['M6 4h12v17H6zM9 9h6M9 13h6M9 17h3'] },
  ce: { paths: ['M4 6h16M4 12h10M4 18h6'] },
  dir: { paths: ['M4 4h16v16H4zM4 9h16M9 9v11'] },
  refer: { paths: ['M7 17 17 7M10 7h7v7'] },
  shelter: { paths: ['M3 11 12 4l9 7v9H3zM9 20v-6h6v6'] },
  insight: { paths: ['M4 20V10M10 20V4M16 20v-8M3 21h18'] },
  tools: { paths: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3'] },

  // --- drawn inline by the bundle ---
  search: { paths: ['m20 20-3.5-3.5'], circles: [{ cx: 11, cy: 11, r: 7 }] },
  alert: {
    paths: [
      'M12 9v5',
      'M12 17h.01',
      'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    ],
  },
  check: { paths: ['m4 12 5 5L20 6'] },

  // --- no bundle reference; drawn in the bundle's idiom ---
  bell: { paths: ['M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0'] },
  settings: {
    paths: [
      'M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 17 4.6l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z',
    ],
    circles: [{ cx: 12, cy: 12, r: 3 }],
  },
  chevronLeft: { paths: ['m15 18-6-6 6-6'] },
  chevronRight: { paths: ['m9 18 6-6-6-6'] },
  logout: { paths: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'] },
} as const satisfies Record<string, IconShape>;

export type IconName = keyof typeof ICON_SHAPES;
