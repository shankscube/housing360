import { useState } from 'react';
import type { Referral } from '@housing360/types';
import { Button, Modal, useToast } from '../../../components/ui';
import { useAppDispatch } from '../../../store/hooks';
import { declineReferral } from '../../../store/slices/referralsSlice';
import { fieldWrapClass, formActionsClass, inputClass, labelClass, textareaClass } from '../shared/formStyles';

export interface DeclineReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  referral: Referral;
}

const DEFAULT_REASON = 'Client declined services';

export function DeclineReferralModal({ isOpen, onClose, referral }: DeclineReferralModalProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit() {
    setIsSaving(true);
    const result = await dispatch(declineReferral({ id: referral.id, input: { reason, notes: notes.trim() || undefined } }));
    setIsSaving(false);
    if (declineReferral.fulfilled.match(result)) {
      showToast('Referral declined.', 'success');
      onClose();
    } else {
      showToast('Failed to decline the referral. Please try again.');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Decline Referral">
      <div className="flex flex-col gap-6">
        <div className={fieldWrapClass}>
          <label className={labelClass}>Reason</label>
          <input type="text" value={reason} onChange={(event) => setReason(event.target.value)} className={inputClass} />
        </div>
        <div className={fieldWrapClass}>
          <label className={labelClass}>Notes</label>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={textareaClass} />
        </div>
        <div className={formActionsClass}>
          <Button variant="tertiary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
            Decline Referral
          </Button>
        </div>
      </div>
    </Modal>
  );
}
