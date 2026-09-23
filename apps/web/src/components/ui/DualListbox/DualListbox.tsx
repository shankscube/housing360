import { useState } from 'react';
import { Icon } from '../icons';

export interface DualListboxOption {
  value: string;
  label: string;
}

export interface DualListboxProps {
  options: DualListboxOption[];
  /** Selected values, in display order — the right-hand column renders in this order. */
  selected: string[];
  onChange: (next: string[]) => void;
  /** Label above both columns, e.g. "Race" or "Ethnicity". */
  label?: string;
  /** Left-column header. Defaults to "Available". */
  availableLabel?: string;
  /** Right-column header. Defaults to "Selected". */
  selectedLabel?: string;
}

const columnClass = 'flex-1 rounded-lg border border-borderStrong bg-surface';
const columnHeaderClass =
  'border-b border-borderRow bg-surfaceMuted px-5 py-2.5 text-2xs font-semibold uppercase tracking-wide text-textMuted';
const optionClass =
  'w-full px-5 py-3 text-left text-sm transition-colors first:rounded-t-none last:rounded-b-lg';
const moveButtonClass =
  'flex items-center justify-center rounded-sm border border-borderStrong bg-surface p-2.5 text-textMuted transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-borderStrong disabled:hover:text-textMuted';

/**
 * A two-column multi-select: options not yet chosen sit in the left column,
 * chosen ones in the right, in the order they were added. Move one or more
 * highlighted items with the arrow buttons, everything at once with the
 * double-arrow buttons, or a single item immediately with a double-click.
 * Controlled — `selected`/`onChange` are the only source of truth; this
 * component's own state is just which rows are currently highlighted for a
 * pending move.
 *
 * No bundle reference exists for a dual-listbox pattern (checked
 * `docs/Housing360 Portal.html`), so this is a clean two-column layout built
 * from the shared theme tokens rather than a design-parity mirror.
 */
export function DualListbox({
  options,
  selected,
  onChange,
  label,
  availableLabel = 'Available',
  selectedLabel = 'Selected',
}: DualListboxProps) {
  const [highlightedAvailable, setHighlightedAvailable] = useState<Set<string>>(new Set());
  const [highlightedSelected, setHighlightedSelected] = useState<Set<string>>(new Set());

  const selectedSet = new Set(selected);
  const available = options.filter((option) => !selectedSet.has(option.value));
  const chosen = selected
    .map((value) => options.find((option) => option.value === value))
    .filter((option): option is DualListboxOption => Boolean(option));

  function toggleHighlight(set: Set<string>, setSet: (next: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    setSet(next);
  }

  function moveToSelected(values: string[]) {
    const additions = values.filter((value) => !selectedSet.has(value));
    if (additions.length === 0) {
      return;
    }
    onChange([...selected, ...additions]);
    setHighlightedAvailable(new Set());
  }

  function moveToAvailable(values: string[]) {
    const removals = new Set(values);
    onChange(selected.filter((value) => !removals.has(value)));
    setHighlightedSelected(new Set());
  }

  return (
    <div>
      {label ? <p className="mb-3 text-sm font-semibold text-ink">{label}</p> : null}
      <div className="flex items-stretch gap-5">
        <div className={columnClass} role="listbox" aria-multiselectable aria-label={availableLabel}>
          <div className={columnHeaderClass}>{availableLabel}</div>
          <div className="divide-y divide-borderRow">
            {available.length === 0 ? (
              <p className="px-5 py-4 text-sm text-textMuted">Nothing left to add.</p>
            ) : (
              available.map((option) => {
                const isHighlighted = highlightedAvailable.has(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isHighlighted}
                    onClick={() =>
                      toggleHighlight(highlightedAvailable, setHighlightedAvailable, option.value)
                    }
                    onDoubleClick={() => moveToSelected([option.value])}
                    className={`${optionClass} ${
                      isHighlighted ? 'bg-tealTint text-tealDeep font-semibold' : 'text-ink hover:bg-surfaceHover'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-2.5">
          <button
            type="button"
            aria-label={`Add highlighted to ${selectedLabel.toLowerCase()}`}
            title="Add selected"
            disabled={highlightedAvailable.size === 0}
            onClick={() => moveToSelected(Array.from(highlightedAvailable))}
            className={moveButtonClass}
          >
            <Icon name="chevronRight" size={15} />
          </button>
          <button
            type="button"
            aria-label={`Add all to ${selectedLabel.toLowerCase()}`}
            title="Add all"
            disabled={available.length === 0}
            onClick={() => moveToSelected(available.map((option) => option.value))}
            className={moveButtonClass}
          >
            <Icon name="chevronsRight" size={15} />
          </button>
          <button
            type="button"
            aria-label={`Remove highlighted from ${selectedLabel.toLowerCase()}`}
            title="Remove selected"
            disabled={highlightedSelected.size === 0}
            onClick={() => moveToAvailable(Array.from(highlightedSelected))}
            className={moveButtonClass}
          >
            <Icon name="chevronLeft" size={15} />
          </button>
          <button
            type="button"
            aria-label={`Remove all from ${selectedLabel.toLowerCase()}`}
            title="Remove all"
            disabled={chosen.length === 0}
            onClick={() => moveToAvailable(chosen.map((option) => option.value))}
            className={moveButtonClass}
          >
            <Icon name="chevronsLeft" size={15} />
          </button>
        </div>

        <div className={columnClass} role="listbox" aria-multiselectable aria-label={selectedLabel}>
          <div className={columnHeaderClass}>{selectedLabel}</div>
          <div className="divide-y divide-borderRow">
            {chosen.length === 0 ? (
              <p className="px-5 py-4 text-sm text-textMuted">Nothing selected yet.</p>
            ) : (
              chosen.map((option) => {
                const isHighlighted = highlightedSelected.has(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isHighlighted}
                    onClick={() =>
                      toggleHighlight(highlightedSelected, setHighlightedSelected, option.value)
                    }
                    onDoubleClick={() => moveToAvailable([option.value])}
                    className={`${optionClass} ${
                      isHighlighted ? 'bg-tealTint text-tealDeep font-semibold' : 'text-ink hover:bg-surfaceHover'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
