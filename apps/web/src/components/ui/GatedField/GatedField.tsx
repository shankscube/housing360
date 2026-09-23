import { useCallback, useEffect, useRef, type ReactNode } from 'react';

/**
 * One field-to-field gating relationship: `targetField` is enabled only while
 * `values[sourceField] === enablingValue`. A whole step's Yes/No→Amount and
 * Yes/No→Reason pairs (Income & Benefits, step 5) are each one entry in a
 * flat array of these — adding a HUD income source later is a data change to
 * the array, not a new conditional branch in a component.
 */
export type GatedFieldRule = {
  targetField: string;
  sourceField: string;
  enablingValue: unknown;
};

export interface GatedFieldProps {
  /** The full declarative rule set for the step (or form) this field lives in. */
  rules: GatedFieldRule[];
  /** The step's current form values, keyed by field name. Read-only here. */
  values: Record<string, unknown>;
  /** This field's own name — looked up against `rules[].targetField`. */
  fieldName: string;
  /**
   * Fires the moment this field's gate closes (`disabled` flips from `false`
   * to `true`) — e.g. `() => setValue(fieldName, '')`. `GatedField` holds no
   * form state of its own (it doesn't know if the consumer is Redux,
   * `useState`, or something else), so this is how it hands back "clear this
   * field" without owning the clear itself. Optional: omit it if the target
   * field has nothing worth clearing.
   */
  onGateClose?: (fieldName: string) => void;
  /**
   * Render prop. `disabled` is this field's current gated state for this
   * render; `clear` is the same callback passed as `onGateClose` (a no-op if
   * none was given), handed to `children` too so a field can also be cleared
   * from inside its own rendered control (e.g. a manual "clear" affordance)
   * without a second prop-drilling path.
   */
  children: (disabled: boolean, clear: () => void) => ReactNode;
}

/**
 * Unopinionated gate for one field against a declarative rule list — pure
 * props in, render-prop out, no coupling to any particular form-state
 * library. If more than one rule targets the same `fieldName`, the field is
 * enabled when *any* of them is satisfied (OR semantics); a field with no
 * rule targeting it is never gated (`disabled` is always `false`).
 *
 * Auto-clear pattern: wrap the step's own field-clearing logic in
 * `onGateClose` and this component calls it exactly once per close via an
 * internal `useEffect`-driven edge detection — the consumer never has to
 * write that effect itself. If a consumer *wants* that effect explicitly
 * instead (e.g. to batch several clears together), ignore `onGateClose` and
 * call the `clear` callback handed to `children` from your own `useEffect`
 * watching `disabled`.
 */
export function GatedField({ rules, values, fieldName, onGateClose, children }: GatedFieldProps) {
  const applicableRules = rules.filter((rule) => rule.targetField === fieldName);
  const disabled =
    applicableRules.length > 0 &&
    !applicableRules.some((rule) => values[rule.sourceField] === rule.enablingValue);

  const clear = useCallback(() => onGateClose?.(fieldName), [onGateClose, fieldName]);

  const wasDisabled = useRef(disabled);
  useEffect(() => {
    if (disabled && !wasDisabled.current) {
      clear();
    }
    wasDisabled.current = disabled;
  }, [disabled, clear]);

  return <>{children(disabled, clear)}</>;
}
