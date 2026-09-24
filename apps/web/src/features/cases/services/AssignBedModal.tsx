import { useState } from 'react';
import type { Bed, BedAssignment, ProgramEnrollment } from '@housing360/types';
import { Button, Modal, useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { assignBed, fetchAvailableBeds } from '../../../store/slices/servicesSlice';
import { fieldWrapClass, formActionsClass, formGridClass, inputClass, labelClass } from '../shared/formStyles';

export interface AssignBedModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: ProgramEnrollment;
  onAssigned: (assignment: BedAssignment) => void;
}

const SHIFT_OPTIONS = ['Day', 'Overnight'];

export function AssignBedModal({ isOpen, onClose, enrollment, onAssigned }: AssignBedModalProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { availableBeds, availableBedsStatus } = useAppSelector((state) => state.services);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState<'Day' | 'Overnight'>('Overnight');
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleFindBeds() {
    setSelectedBed(null);
    setHasSearched(true);
    await dispatch(fetchAvailableBeds({ programId: enrollment.programId, date, shift }));
  }

  async function handleAssign() {
    if (!selectedBed) {
      showToast('Select a bed to assign.');
      return;
    }
    setIsSaving(true);
    const result = await dispatch(assignBed({ programEnrollmentId: enrollment.id, bedId: selectedBed.id, shift, date }));
    setIsSaving(false);
    if (assignBed.fulfilled.match(result)) {
      showToast('The bed was assigned and today’s stay was logged.', 'success');
      onAssigned(result.payload);
      onClose();
    } else {
      showToast('Failed to assign the bed. Please try again.');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Bed">
      <div className="flex flex-col gap-6">
        <div className={formGridClass}>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Program</label>
            <p className={inputClass}>{enrollment.programName}</p>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Date</label>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Shift</label>
            <select value={shift} onChange={(event) => setShift(event.target.value as 'Day' | 'Overnight')} className={inputClass}>
              {SHIFT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={handleFindBeds} disabled={availableBedsStatus === 'loading'}>
          Find Available Beds
        </Button>

        {hasSearched ? (
          availableBeds.length === 0 ? (
            <p className="text-sm text-textMuted">No beds are available for that program, date, and shift.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {availableBeds.map((bed) => (
                <li key={bed.id}>
                  <label className="flex items-center gap-3 rounded-lg border border-borderRow px-5 py-3 text-sm text-ink">
                    <input
                      type="radio"
                      name="available-bed"
                      checked={selectedBed?.id === bed.id}
                      onChange={() => setSelectedBed(bed)}
                    />
                    {bed.identifier}
                  </label>
                </li>
              ))}
            </ul>
          )
        ) : null}

        <div className={formActionsClass}>
          <Button variant="tertiary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAssign} disabled={isSaving || !selectedBed}>
            Assign Bed
          </Button>
        </div>
      </div>
    </Modal>
  );
}
