import { Button, type ButtonSize, type ButtonVariant } from '../../src/components/ui';
import type { ComponentPreview } from './types';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary'];
const SIZES: ButtonSize[] = ['md', 'sm'];

const LABEL: Record<ButtonVariant, string> = {
  primary: 'New Intake',
  secondary: 'New Referral',
  tertiary: 'New Case',
};

function Row({ size }: { size: ButtonSize }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="w-16 text-2xs font-semibold uppercase tracking-wide text-textMuted">
        {size}
      </span>
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant} size={size} onClick={() => {}}>
          {LABEL[variant]}
        </Button>
      ))}
    </div>
  );
}

export const buttonPreview: ComponentPreview = {
  name: 'Button',
  reference:
    'Home → New Intake / New Referral / New Case group (md); My Clients → table-card New Intake (sm)',
  variants: [
    {
      name: 'All three variants, both sizes',
      element: (
        <div className="flex flex-col gap-7">
          {SIZES.map((size) => (
            <Row key={size} size={size} />
          ))}
        </div>
      ),
    },
    {
      name: 'Disabled (one shared treatment, whatever the variant)',
      element: (
        <div className="flex flex-wrap items-center gap-4">
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant} disabled>
              {LABEL[variant]}
            </Button>
          ))}
        </div>
      ),
    },
    {
      name: 'Defaults to primary / md with no variant or size passed',
      element: <Button onClick={() => {}}>New Intake</Button>,
    },
    {
      name: 'Full-width, as the login screen submits',
      element: (
        <div className="max-w-formCardWidth">
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </div>
      ),
    },
  ],
};
