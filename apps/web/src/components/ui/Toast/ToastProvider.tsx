import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../icons';
import { ToastContext, type ToastTone } from './ToastContext';

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

const TONE_CLASS: Record<ToastTone, { border: string; bg: string; text: string; icon: 'alert' | 'check' }> = {
  error: { border: 'border-coral', bg: 'bg-coralTint', text: 'text-coralDeep', icon: 'alert' },
  success: { border: 'border-teal', bg: 'bg-tealTint', text: 'text-tealDeep', icon: 'check' },
};

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
    (message: string, tone: ToastTone = 'error') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((current) => [...current, { id, message, tone }]);
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-9 right-9 z-50 flex flex-col gap-3">
        {toasts.map((toast) => {
          const classes = TONE_CLASS[toast.tone];
          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-lg border ${classes.border} ${classes.bg} px-6 py-4 shadow-card`}
            >
              <Icon name={classes.icon} size={16} className={`mt-0.5 shrink-0 ${classes.text}`} />
              <p className={`text-sm font-medium ${classes.text}`}>{toast.message}</p>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => dismiss(toast.id)}
                className={`ml-2 shrink-0 ${classes.text} transition-opacity hover:opacity-70`}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
