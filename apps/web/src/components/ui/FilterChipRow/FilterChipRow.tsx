export interface FilterChipOption {
  value: string;
  label: string;
}

export interface FilterChipRowProps {
  options: FilterChipOption[];
  /** The single active option's value. Controlled — the row never holds its own selection state. */
  activeValue: string;
  onChange: (value: string) => void;
}

const chipBaseClass =
  'whitespace-nowrap rounded-lg px-6.5 py-3 text-sm font-semibold transition-colors';

/**
 * Horizontal single-select pill toggles. Selection is controlled via
 * `activeValue`/`onChange`, which is what guarantees exactly one active chip.
 *
 * The bundle defines no chip hover state; the hover treatments below step one
 * shade in the same direction as each chip's resting fill.
 */
export function FilterChipRow({ options, activeValue, onChange }: FilterChipRowProps) {
  return (
    <div className="flex flex-wrap gap-3" role="radiogroup">
      {options.map((option) => {
        const isActive = option.value === activeValue;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={
              isActive
                ? `${chipBaseClass} bg-ink text-surface shadow-lifted hover:bg-inkHover`
                : `${chipBaseClass} bg-surfaceSubtle text-textQuiet hover:bg-borderStep hover:text-ink`
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
