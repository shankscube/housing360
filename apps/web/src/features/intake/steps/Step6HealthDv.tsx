import { forwardRef, useImperativeHandle } from 'react';
import type { AssessmentInput, AssessmentUpdateInput } from '@housing360/types';
import { HealthDvSection, useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { markStepComplete, saveEntryAssessment } from '../../../store/slices/intakeSlice';
import type { StepHandle } from '../types';
import { useAssessmentDraft } from './assessmentDraft';

export const Step6HealthDv = forwardRef<StepHandle>(function Step6HealthDv(_props, ref) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const hudOptions = useAppSelector((state) => state.intake.hudOptions.data);
  const ids = useAppSelector((state) => state.intake.ids);
  const { draft, updateDraft } = useAssessmentDraft();

  useImperativeHandle(ref, () => ({
    async save() {
      const { clientId, enrollmentId, caseId, assessmentId } = ids;
      if (!clientId || !enrollmentId || !caseId) {
        showToast('Missing client, enrollment, or case information — go back and complete earlier steps.');
        return false;
      }

      // Steps 4-6 all write into the one shared draft; this is the single
      // save covering all three sections (design.md: "single Entry
      // Assessment record").
      const input = assessmentId
        ? ({ ...draft } as AssessmentUpdateInput)
        : ({ ...draft, clientId, programEnrollmentId: enrollmentId, caseId } as AssessmentInput);

      const result = await dispatch(saveEntryAssessment({ assessmentId, input }));
      if (saveEntryAssessment.fulfilled.match(result)) {
        dispatch(markStepComplete(4));
        dispatch(markStepComplete(5));
        dispatch(markStepComplete(6));
        return true;
      }

      showToast('Failed to save the Entry Assessment. Please try again.');
      return false;
    },
  }));

  return <HealthDvSection values={draft} onChange={updateDraft} hudOptions={hudOptions} />;
});
