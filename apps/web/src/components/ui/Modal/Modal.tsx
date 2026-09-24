import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../icons';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
}

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-lg',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

/**
 * The repo's first generic overlay/dialog primitive — `case-workspace` is the
 * change that finally justifies extracting it (New Case, Edit Case, the Care
 * Plan wizard, Assign Service, disbursement/bed/referral forms, and the ROI
 * form all render through this one component instead of each hand-rolling an
 * overlay the way `IntakeWizard` still does). Portals to `document.body` so
 * it isn't clipped by an ancestor's `overflow-hidden` (same technique as the
 * nav rail's account menu), closes on Escape or a backdrop click.
 */
export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 px-6 py-10"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={`flex max-h-full w-full ${SIZE_CLASS[size]} flex-col overflow-hidden rounded-2xl bg-surface shadow-card`}
      >
        <div className="flex items-center justify-between border-b border-borderSubtle px-9 py-6">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-textMuted transition-colors hover:text-ink"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-9">{children}</div>
      </div>
    </div>,
    document.body
  );
}
