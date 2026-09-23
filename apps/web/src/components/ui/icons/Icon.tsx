import { ICON_SHAPES, type IconName } from './iconPaths';

export interface IconProps {
  name: IconName;
  /**
   * Rendered size in px. The bundle draws nav icons at 17 and inline control
   * icons at 15–16; this is one of the few places a raw number is the right
   * API, because it is an SVG attribute rather than a style choice.
   */
  size?: number;
  /** Stroke weight — the bundle's nav icons use 1.8, its inline icons 2. */
  strokeWidth?: number;
  className?: string;
}

/**
 * Renders the design bundle's icon geometry. Stroke color is inherited via
 * `currentColor`, so callers set it with a text-color utility rather than
 * passing a color in.
 */
export function Icon({ name, size = 17, strokeWidth = 1.8, className }: IconProps) {
  const shape = ICON_SHAPES[name];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={className}
    >
      {shape.paths.map((d) => (
        <path key={d} d={d} />
      ))}
      {'circles' in shape
        ? shape.circles?.map((circle) => (
            <circle key={`${circle.cx}-${circle.cy}-${circle.r}`} {...circle} />
          ))
        : null}
    </svg>
  );
}
