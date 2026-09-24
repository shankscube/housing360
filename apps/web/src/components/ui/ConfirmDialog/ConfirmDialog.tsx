import { Button } from '../Button';
import { Modal } from '../Modal';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in the bundle's coral "destructive" treatment (`Button`'s `danger` variant) instead of the default primary fill. */
  danger?: boolean;
}

/**
 * The repo's first confirm/alert primitive — no `window.confirm` usage and no
 * confirmation step existed anywhere before this (e.g. the Assessment
 * Command Center's "Discard" button used to delete a draft immediately). A
 * thin composition over the existing `Modal`, sized `sm` to read as a prompt
 * rather than a form. Any future "are you sure?" flow should reuse this
 * rather than building a one-off.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
}: ConfirmDialogProps) {
  function handleConfirm() {
    onConfirm();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-7">
        <p className="text-sm text-textMuted">{message}</p>
        <div className="flex justify-end gap-4">
          <Button variant="tertiary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
