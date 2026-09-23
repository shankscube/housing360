/**
 * Single source of truth for status tone → color across the app. `StatusBadge`
 * resolves its color from this map rather than any per-usage value, so a new
 * screen never invents its own status colors.
 *
 * The six tones are the design bundle's own vocabulary, not a four-step
 * severity ramp. The distinctions matter on the batch-1 tables: `navy`
 * (neutral-emphatic, e.g. a referral's "Enrolled" stage) reads differently
 * from `quiet` (deemphasized, e.g. a closed case), and `blue`
 * (informational/in-progress) differently from `gold` (waiting).
 *
 * Fills are translucent so they composite over both `surface` and
 * `surfaceMuted` the way the bundle's do.
 */
export type StatusTone = 'teal' | 'navy' | 'blue' | 'gold' | 'coral' | 'quiet';

export interface StatusToneColors {
  /** Tailwind background class, resolved from the theme. */
  background: string;
  /** Tailwind text-color class, resolved from the theme. */
  text: string;
}

export const STATUS_COLOR_MAP: Record<StatusTone, StatusToneColors> = {
  /** Positive / active / approved. */
  teal: { background: 'bg-tealTint', text: 'text-tealDeep' },
  /** Neutral but emphatic — a real state, just not a colored one. */
  navy: { background: 'bg-navyTint', text: 'text-ink' },
  /** Informational / in progress / newly created. */
  blue: { background: 'bg-blueTint', text: 'text-blueDeep' },
  /** Waiting on someone, or due. */
  gold: { background: 'bg-goldTint', text: 'text-goldDeep' },
  /** Urgent, overdue, or rejected. */
  coral: { background: 'bg-coralTint', text: 'text-coralDeep' },
  /** Deemphasized — closed, ended, low. */
  quiet: { background: 'bg-surfaceSubtle', text: 'text-textQuiet' },
};

/** Used when a status word has no mapping and no explicit tone was passed. */
export const DEFAULT_STATUS_TONE: StatusTone = 'quiet';
