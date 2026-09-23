import { forwardRef, useImperativeHandle, useState } from 'react';
import type { InteractionSummaryInput } from '@housing360/types';
import { useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { markStepComplete, saveInteractionSummary } from '../../../store/slices/intakeSlice';
import type { StepHandle } from '../types';

const inputClass =
  'mt-2 w-full rounded-md border border-borderStrong bg-surface px-6 py-4 text-base text-ink outline-none transition-colors focus:border-ink disabled:bg-surfaceSubtle disabled:text-textFaint';
// `rows` on the <textarea> elements themselves sizes them — the theme's
// `spacing`/height scales stop at 24 (56px), so a min-height utility class
// can't reach a usable textarea size without an arbitrary value.
const textareaClass = inputClass;
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-textMuted';
const fieldWrapClass = 'flex flex-col';

export const Step8InteractionSummary = forwardRef<StepHandle>(function Step8InteractionSummary(_props, ref) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const hudOptions = useAppSelector((state) => state.intake.hudOptions.data);
  const ids = useAppSelector((state) => state.intake.ids);
  const enrollments = useAppSelector((state) => state.intake.enrollments.items);

  const activeEnrollment = enrollments.find((enrollment) => enrollment.id === ids.enrollmentId);
  const defaultTitle = activeEnrollment ? `${activeEnrollment.programName} - Intake` : 'Intake';

  const [wantsSummary, setWantsSummary] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [status, setStatus] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  const statusOptions = hudOptions?.interactionSummaryStatus ?? [];

  function handleWantsSummaryChange(value: boolean) {
    setWantsSummary(value);
    // Seed the title default the first time "Yes" is chosen, without
    // clobbering something the case manager already typed.
    if (value && !title) {
      setTitle(defaultTitle);
    }
  }

  useImperativeHandle(ref, () => ({
    async save() {
      if (!wantsSummary) {
        dispatch(markStepComplete(8));
        return true;
      }

      if (!title.trim()) {
        showToast('Title is required to save an Interaction Summary.');
        return false;
      }
      if (!ids.clientId || !ids.caseId) {
        showToast('Missing client or case information — go back and complete earlier steps.');
        return false;
      }

      const input: InteractionSummaryInput = {
        clientId: ids.clientId,
        caseId: ids.caseId,
        title: title.trim(),
        status,
        meetingNotes: meetingNotes || null,
        nextSteps: nextSteps || null,
      };

      const result = await dispatch(saveInteractionSummary(input));
      if (saveInteractionSummary.fulfilled.match(result)) {
        dispatch(markStepComplete(8));
        return true;
      }

      showToast('Failed to save the Interaction Summary. Please try again.');
      return false;
    },
  }));

  return (
    <div className="flex flex-col gap-7">
      <h2 className="text-lg font-semibold text-ink">Interaction Summary</h2>
      <p className="text-sm text-textMuted">Would you like to add an Interaction Summary for this intake?</p>

      <div className="flex gap-5 text-sm text-ink">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="wantsInteractionSummary"
            checked={wantsSummary}
            onChange={() => handleWantsSummaryChange(true)}
          />
          Yes
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="wantsInteractionSummary"
            checked={!wantsSummary}
            onChange={() => handleWantsSummaryChange(false)}
          />
          No
        </label>
      </div>

      {wantsSummary ? (
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
          <label className={fieldWrapClass}>
            <span className={labelClass}>Title</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              <option value="">Select a status</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={`${fieldWrapClass} sm:col-span-2`}>
            <span className={labelClass}>Meeting Notes</span>
            <textarea
              value={meetingNotes}
              onChange={(event) => setMeetingNotes(event.target.value)}
              rows={5}
              className={textareaClass}
            />
          </label>

          <label className={`${fieldWrapClass} sm:col-span-2`}>
            <span className={labelClass}>Next Steps</span>
            <textarea
              value={nextSteps}
              onChange={(event) => setNextSteps(event.target.value)}
              rows={5}
              className={textareaClass}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
});
