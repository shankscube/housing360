import { StatusBadge, STATUS_TONE_BY_LABEL, type StatusTone } from '../../src/components/ui';
import type { ComponentPreview } from './types';

const TONES: StatusTone[] = ['teal', 'navy', 'blue', 'gold', 'coral', 'quiet'];

/** Every word in the shared map, grouped by the tone it resolves to. */
const WORDS_BY_TONE = TONES.map((tone) => ({
  tone,
  labels: Object.entries(STATUS_TONE_BY_LABEL)
    .filter(([, value]) => value === tone)
    .map(([label]) => label),
}));

export const statusBadgePreview: ComponentPreview = {
  name: 'StatusBadge',
  reference: 'My Clients / Cases / Assessments → table status column',
  variants: [
    {
      name: 'All six tones',
      element: (
        <div className="flex flex-wrap gap-4">
          {TONES.map((tone) => (
            <StatusBadge key={tone} label={tone} tone={tone} />
          ))}
        </div>
      ),
    },
    {
      name: 'Every mapped status word (tone resolved from the label, no tone prop)',
      element: (
        <div className="flex flex-col gap-4">
          {WORDS_BY_TONE.map(({ tone, labels }) => (
            <div key={tone} className="flex flex-wrap items-center gap-4">
              <span className="w-16 text-2xs font-semibold uppercase tracking-wide text-textMuted">
                {tone}
              </span>
              {labels.map((label) => (
                <StatusBadge key={label} label={label} />
              ))}
            </div>
          ))}
        </div>
      ),
    },
    {
      name: 'Explicit tone overrides the map ("Enrolled" is teal as a program status, navy as a referral stage)',
      element: (
        <div className="flex flex-wrap gap-4">
          <StatusBadge label="Enrolled" />
          <StatusBadge label="Enrolled" tone="navy" />
        </div>
      ),
    },
    {
      name: 'Unmapped word falls back to the quiet tone',
      element: <StatusBadge label="Something Unmapped" />,
    },
  ],
};
