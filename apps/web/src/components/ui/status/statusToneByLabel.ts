import { DEFAULT_STATUS_TONE, type StatusTone } from './statusColors';

/**
 * Status word → tone, covering every status word used across the batch-1
 * screens (My Clients, Cases, Assessments, Coordinated Entry), taken from the
 * design bundle's own data rather than invented here.
 *
 * Two words genuinely mean different things in different domains:
 *   - "Enrolled" is `teal` as a program status (My Clients) and `navy` as a
 *     referral stage.
 *   - "Annual" is `blue` while "Exit" is `quiet`, in the same Assessments
 *     column.
 * The map holds the default reading; a screen with a domain-specific one
 * passes `tone` to `StatusBadge`, which overrides the lookup. That keeps a
 * single central map without pretending a word has exactly one meaning
 * app-wide.
 */
export const STATUS_TONE_BY_LABEL: Record<string, StatusTone> = {
  // My Clients — program status
  enrolled: 'teal',
  'awaiting referral': 'gold',
  'intake started': 'blue',

  // Cases — status
  active: 'teal',
  'pending review': 'blue',
  closed: 'quiet',

  // Cases — priority
  high: 'coral',
  medium: 'gold',
  low: 'quiet',

  // Assessments — status
  completed: 'teal',
  'due today': 'gold',
  'in progress': 'blue',
  overdue: 'coral',

  // Assessments — HUD stage
  entry: 'navy',
  annual: 'blue',
  exit: 'quiet',

  // Coordinated Entry / referral stages
  new: 'blue',
  'in review': 'gold',
  approved: 'teal',
  rejected: 'coral',

  // Referral type
  internal: 'navy',
  outbound: 'blue',
};

/**
 * Case- and whitespace-insensitive lookup. An unmapped word resolves to the
 * deemphasized tone rather than throwing — a missing badge color must never
 * break a screen.
 */
export function resolveStatusTone(label: string): StatusTone {
  const key = label.trim().toLowerCase().replace(/\s+/g, ' ');
  return STATUS_TONE_BY_LABEL[key] ?? DEFAULT_STATUS_TONE;
}
