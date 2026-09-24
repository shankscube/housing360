import { useEffect, useState } from 'react';
import type { ProgramEnrollment } from '@housing360/types';
import { Button, Modal, useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { assignService, fetchAssignableBenefits } from '../../../store/slices/servicesSlice';
import { fieldWrapClass, formActionsClass, inputClass, labelClass } from '../shared/formStyles';

export interface AssignServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: ProgramEnrollment;
}

export function AssignServiceModal({ isOpen, onClose, enrollment }: AssignServiceModalProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const benefits = useAppSelector((state) => state.services.assignableBenefitsByEnrollment[enrollment.id]);
  const [benefitId, setBenefitId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAssignableBenefits(enrollment.id));
    }
  }, [isOpen, enrollment.id, dispatch]);

  async function handleSubmit() {
    if (!benefitId) {
      showToast('Select a benefit to assign.');
      return;
    }
    setIsSaving(true);
    const result = await dispatch(assignService({ enrollmentId: enrollment.id, benefitId }));
    setIsSaving(false);
    if (assignService.fulfilled.match(result)) {
      showToast('Service assigned.', 'success');
      onClose();
    } else {
      showToast('Failed to assign the service. Please try again.');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Service">
      <div className="flex flex-col gap-6">
        {benefits && benefits.length === 0 ? (
          <p className="text-sm text-textMuted">No benefits are configured for this program yet.</p>
        ) : (
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="assign-service-benefit">
              Benefit
            </label>
            <select
              id="assign-service-benefit"
              value={benefitId}
              onChange={(event) => setBenefitId(event.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {(benefits ?? []).map((benefit) => (
                <option key={benefit.id} value={benefit.id}>
                  {benefit.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={formActionsClass}>
          <Button variant="tertiary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSaving || !benefits || benefits.length === 0}
          >
            Assign Service
          </Button>
        </div>
      </div>
    </Modal>
  );
}
