import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  DisabilitiesEditor,
  useToast,
  type DisabilitiesEditorHandle,
  type DisabilityRowInput,
} from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { addDisability, markStepComplete, removeDisability } from '../../../store/slices/intakeSlice';
import type { StepHandle } from '../types';

export const Step7Disabilities = forwardRef<StepHandle>(function Step7Disabilities(_props, ref) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const hudOptions = useAppSelector((state) => state.intake.hudOptions.data);
  const assessmentId = useAppSelector((state) => state.intake.ids.assessmentId);
  const items = useAppSelector((state) => state.intake.disabilities.items);

  const [noneChecked, setNoneChecked] = useState(false);
  const editorRef = useRef<DisabilitiesEditorHandle>(null);

  // `DisabilitiesEditor` is fully controlled and Redux/API-free — it only
  // hands back the whole next list on add/remove. The wizard still persists
  // per-row via the existing addDisability/removeDisability thunks (no
  // change to those API calls), so this diffs `next` against `items` to
  // figure out which single row changed. `next`'s array always shares object
  // references with `items` for every row it kept (the editor only ever
  // appends one new plain row or filters one out), so reference identity is
  // enough to tell add from remove without any row needing its own id.
  function handleDisabilitiesChange(next: DisabilityRowInput[]) {
    if (next.length > items.length) {
      const added = next.slice(items.length);
      const confirmedAssessmentId = assessmentId;
      if (!confirmedAssessmentId) {
        showToast('Missing assessment — go back and complete the Health & DV step.');
        return;
      }
      added.forEach((input) => {
        dispatch(addDisability({ assessmentId: confirmedAssessmentId, input })).then((result) => {
          if (!addDisability.fulfilled.match(result)) {
            showToast('Failed to save the disability record. Please try again.');
          }
        });
      });
    } else if (next.length < items.length) {
      const removed = items.filter((item) => !next.includes(item));
      removed.forEach((item) => dispatch(removeDisability(item.id)));
    }
  }

  useImperativeHandle(ref, () => ({
    async save() {
      let itemCount = items.length;

      // "A partially filled form is saved, then the wizard advances" — an
      // in-progress add-row form with a Type already selected is submitted
      // for the case manager rather than silently discarded.
      const pending = editorRef.current?.getPendingRow();
      if (pending) {
        if (!assessmentId) {
          showToast('Missing assessment — go back and complete the Health & DV step.');
          return false;
        }
        const result = await dispatch(addDisability({ assessmentId, input: pending }));
        if (!addDisability.fulfilled.match(result)) {
          showToast('Failed to save the disability record. Please try again.');
          return false;
        }
        editorRef.current?.clearPendingRow();
        itemCount += 1;
      }

      if (itemCount === 0 && !noneChecked) {
        showToast("Add at least one disability record, or check 'No known disabilities to record' to continue.");
        return false;
      }

      dispatch(markStepComplete(7));
      return true;
    },
  }));

  return (
    <div className="flex flex-col gap-7">
      <h2 className="text-lg font-semibold text-ink">Disabilities</h2>

      <DisabilitiesEditor ref={editorRef} value={items} onChange={handleDisabilitiesChange} hudOptions={hudOptions} />

      {items.length === 0 ? (
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={noneChecked}
            onChange={(event) => setNoneChecked(event.target.checked)}
          />
          No known disabilities to record
        </label>
      ) : null}
    </div>
  );
});
