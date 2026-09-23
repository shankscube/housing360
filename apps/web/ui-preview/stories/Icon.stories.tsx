import { Icon, ICON_SHAPES, type IconName } from '../../src/components/ui';
import type { ComponentPreview } from './types';

const NAMES = Object.keys(ICON_SHAPES) as IconName[];

/** The ten names the bundle's own `ICON` map defines, in its order. */
const NAV_NAMES: IconName[] = [
  'home',
  'users',
  'cases',
  'assess',
  'ce',
  'dir',
  'refer',
  'shelter',
  'insight',
  'tools',
];

function Swatch({ name, size, strokeWidth }: { name: IconName; size: number; strokeWidth: number }) {
  return (
    <div className="flex min-w-18 flex-col items-center gap-2 px-2 text-textMuted">
      <Icon name={name} size={size} strokeWidth={strokeWidth} />
      <span className="text-2xs">{name}</span>
    </div>
  );
}

export const iconPreview: ComponentPreview = {
  name: 'Icon',
  reference: "Navigation rail → item icons (the bundle's ICON map), plus its inline search/alert icons",
  variants: [
    {
      name: 'Nav icons — 17px, stroke 1.8 (as the rail draws them)',
      element: (
        <div className="flex flex-wrap gap-7">
          {NAV_NAMES.map((name) => (
            <Swatch key={name} name={name} size={17} strokeWidth={1.8} />
          ))}
        </div>
      ),
    },
    {
      name: 'Full set — 20px, stroke 2 (includes the controls the bundle has no counterpart for)',
      element: (
        <div className="flex flex-wrap gap-7">
          {NAMES.map((name) => (
            <Swatch key={name} name={name} size={20} strokeWidth={2} />
          ))}
        </div>
      ),
    },
    {
      name: 'Color is inherited via currentColor',
      element: (
        <div className="flex items-center gap-7">
          <span className="text-ink">
            <Icon name="home" size={20} />
          </span>
          <span className="text-teal">
            <Icon name="home" size={20} />
          </span>
          <span className="text-coral">
            <Icon name="home" size={20} />
          </span>
          <span className="text-textFaint">
            <Icon name="home" size={20} />
          </span>
        </div>
      ),
    },
  ],
};
