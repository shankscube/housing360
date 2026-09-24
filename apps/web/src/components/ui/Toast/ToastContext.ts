import { createContext, useContext } from 'react';

export type ToastTone = 'error' | 'success';

export interface ToastContextValue {
  /** `tone` defaults to `'error'` — every existing call site is a validation/failure message. */
  showToast: (message: string, tone?: ToastTone) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

/** Throws if used outside a `ToastProvider` — every wizard step renders under `IntakeWizard`'s provider. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
