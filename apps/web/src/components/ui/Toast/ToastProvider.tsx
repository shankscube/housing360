import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../icons';
import { ToastContext } from './ToastContext';

interface ToastItem {
  id: string;
  message: string;
}

const AUTO_DISMISS_MS = 4000;

/**
 * Mount once near the root of whatever feature needs transient validation
 * messages (e.g. `IntakeWizard`) — not app-wide, since today's only consumer
 * is the intake wizard's own required-field/validation toasts.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((current) => [...current, { id, message }]);
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-9 right-9 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-lg border border-coral bg-coralTint px-6 py-4 shadow-card"
          >
            <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-coralDeep" />
            <p className="text-sm font-medium text-coralDeep">{toast.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(toast.id)}
              className="ml-2 shrink-0 text-coralDeep transition-opacity hover:opacity-70"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
