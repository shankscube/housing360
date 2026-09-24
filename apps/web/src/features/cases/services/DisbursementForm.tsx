import { useState } from 'react';
import type { BenefitAssignmentDetail, ServiceDisbursement } from '@housing360/types';
import { Button, Modal, useToast } from '../../../components/ui';
import { useAppDispatch } from '../../../store/hooks';
import { createDisbursement, updateDisbursement } from '../../../store/slices/servicesSlice';
import { fieldWrapClass, formActionsClass, formGridClass, inputClass, labelClass, textareaClass } from '../shared/formStyles';

export interface DisbursementFormProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  enrollmentId: string;
  service: BenefitAssignmentDetail;
  existingDisbursement?: ServiceDisbursement | null;
}

const DISBURSEMENT_TYPES = ['voucher', 'direct_payment', 'bed_night', 'referral_service', 'other'];
const STATUS_OPTIONS = ['pending', 'issued', 'completed', 'cancelled'];
const SHIFT_OPTIONS = ['Day', 'Overnight'];

export function DisbursementForm({
  isOpen,
  onClose,
  clientId,
  enrollmentId,
  service,
  existingDisbursement,
}: DisbursementFormProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const isEditing = Boolean(existingDisbursement);

  const [disbursementType, setDisbursementType] = useState(existingDisbursement?.disbursementType ?? 'voucher');
  const [status, setStatus] = useState(existingDisbursement?.status ?? 'pending');
  const [disbursementDate, setDisbursementDate] = useState(
    existingDisbursement?.disbursementDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState(existingDisbursement?.description ?? '');
  const [triggerReason, setTriggerReason] = useState(existingDisbursement?.triggerReason ?? '');
  const [voucherNumber, setVoucherNumber] = useState(existingDisbursement?.voucherNumber ?? '');
  const [voucherAmount, setVoucherAmount] = useState(existingDisbursement?.voucherAmount?.toString() ?? '');
  const [bedIdentifier, setBedIdentifier] = useState(existingDisbursement?.bedIdentifier ?? '');
  const [shift, setShift] = useState(existingDisbursement?.shift ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const isBedRelated = disbursementType === 'bed_night';

  async function handleSubmit() {
    setIsSaving(true);
    const input = {
      disbursementType,
      status,
      disbursementDate,
      description: description.trim() || undefined,
      triggerReason: triggerReason.trim() || undefined,
      voucherNumber: voucherNumber.trim() || undefined,
      voucherAmount: voucherAmount ? Number(voucherAmount) : undefined,
      bedIdentifier: isBedRelated ? bedIdentifier.trim() || undefined : undefined,
      shift: isBedRelated ? shift || undefined : undefined,
    };

    const result = existingDisbursement
      ? await dispatch(
          updateDisbursement({ id: existingDisbursement.id, enrollmentId, benefitAssignmentId: service.id, input })
        )
      : await dispatch(
          createDisbursement({ benefitAssignmentId: service.id, enrollmentId, input: { ...input, recipientClientId: clientId } })
        );
    setIsSaving(false);

    const fulfilled = existingDisbursement ? updateDisbursement.fulfilled.match(result) : createDisbursement.fulfilled.match(result);
    if (fulfilled) {
      showToast(isEditing ? 'Disbursement updated.' : 'Disbursement created.', 'success');
      onClose();
    } else {
      showToast('Failed to save the disbursement. Please try again.');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Disbursement' : 'New Disbursement'}>
      <div className="flex flex-col gap-6">
        <div className={formGridClass}>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Type</label>
            <select value={disbursementType} onChange={(event) => setDisbursementType(event.target.value)} className={inputClass}>
              {DISBURSEMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Status</label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Date</label>
            <input type="date" value={disbursementDate} onChange={(event) => setDisbursementDate(event.target.value)} className={inputClass} />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Trigger Reason</label>
            <input type="text" value={triggerReason} onChange={(event) => setTriggerReason(event.target.value)} className={inputClass} />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Voucher Number</label>
            <input type="text" value={voucherNumber} onChange={(event) => setVoucherNumber(event.target.value)} className={inputClass} />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Voucher Amount</label>
            <input type="number" value={voucherAmount} onChange={(event) => setVoucherAmount(event.target.value)} className={inputClass} />
          </div>
          {isBedRelated ? (
            <>
              <div className={fieldWrapClass}>
                <label className={labelClass}>Bed Identifier</label>
                <input type="text" value={bedIdentifier} onChange={(event) => setBedIdentifier(event.target.value)} className={inputClass} />
              </div>
              <div className={fieldWrapClass}>
                <label className={labelClass}>Shift</label>
                <select value={shift} onChange={(event) => setShift(event.target.value)} className={inputClass}>
                  <option value="">Select…</option>
                  {SHIFT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
        </div>

        <div className={fieldWrapClass}>
          <label className={labelClass}>Description</label>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} className={textareaClass} />
        </div>

        <div className={formActionsClass}>
          <Button variant="tertiary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
            {isEditing ? 'Save Changes' : 'Create Disbursement'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
