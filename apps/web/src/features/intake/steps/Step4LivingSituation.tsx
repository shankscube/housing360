import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { LivingSituationSection } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { markStepComplete } from '../../../store/slices/intakeSlice';
import type { StepHandle } from '../types';
import { seedAssessmentDraftOnce, useAssessmentDraft } from './assessmentDraft';

export const Step4LivingSituation = forwardRef<StepHandle>(function Step4LivingSituation(_props, ref) {
  const dispatch = useAppDispatch();
  const hudOptions = useAppSelector((state) => state.intake.hudOptions.data);
  const clientId = useAppSelector((state) => state.intake.ids.clientId);
  const assessmentCurrent = useAppSelector((state) => state.intake.assessment.current);
  const { draft, updateDraft } = useAssessmentDraft();

  // Seed the shared steps-4-6 draft once per client from whatever the wizard
  // already knows about this enrollment's Entry Assessment (empty for a
  // brand-new client). See assessmentDraft.ts for why this is keyed on
  // clientId rather than running on every mount.
  useEffect(() => {
    if (clientId) {
      seedAssessmentDraftOnce(clientId, assessmentCurrent ?? undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useImperativeHandle(ref, () => ({
    async save() {
      // No required-field validation is specified for this step beyond the
      // category-gating behavior itself — persisting happens once, at step
      // 6's save, covering steps 4-6 together.
      dispatch(markStepComplete(4));
      return true;
    },
  }));

  return <LivingSituationSection values={draft} onChange={updateDraft} hudOptions={hudOptions} />;
});
