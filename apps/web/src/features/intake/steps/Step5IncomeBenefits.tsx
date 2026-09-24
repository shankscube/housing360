import { forwardRef, useImperativeHandle } from 'react';
import { IncomeBenefitsSection } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { markStepComplete } from '../../../store/slices/intakeSlice';
import type { StepHandle } from '../types';
import { useAssessmentDraft } from './assessmentDraft';

export const Step5IncomeBenefits = forwardRef<StepHandle>(function Step5IncomeBenefits(_props, ref) {
  const dispatch = useAppDispatch();
  const hudOptions = useAppSelector((state) => state.intake.hudOptions.data);
  const { draft, updateDraft } = useAssessmentDraft();

  useImperativeHandle(ref, () => ({
    async save() {
      // Validate-only per the spec — persisting happens once, at step 6.
      dispatch(markStepComplete(5));
      return true;
    },
  }));

  return <IncomeBenefitsSection values={draft} onChange={updateDraft} hudOptions={hudOptions} />;
});
