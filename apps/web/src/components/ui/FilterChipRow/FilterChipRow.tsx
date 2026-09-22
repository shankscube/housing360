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

/**
 * Horizontal single-select pill toggles. Selection is controlled via
 * `activeValue`/`onChange`, which is what guarantees exactly one active chip.
 */
export function FilterChipRow({ options, activeValue, onChange }: FilterChipRowProps) {
  return (
    <div className="flex flex-wrap gap-sm" role="radiogroup">
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
                ? 'rounded-full bg-primary-600 px-md py-xs text-sm font-medium text-white'
                : 'rounded-full border border-neutral-300 px-md py-xs text-sm font-medium text-neutral-700'
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
