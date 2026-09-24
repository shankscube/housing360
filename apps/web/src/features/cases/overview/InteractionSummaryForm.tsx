import { useState } from 'react';
import type { InteractionSummary } from '@housing360/types';
import { Button, Modal, useToast } from '../../../components/ui';
import { useAppDispatch } from '../../../store/hooks';
import {
  createCaseInteractionSummary,
  createCaseTask,
  fetchCaseInteractionSummaries,
  fetchInteractionSummaryDetail,
  updateCaseInteractionSummary,
} from '../../../store/slices/casesSlice';
import { useCaseOptions } from '../hooks/useCaseOptions';
import { useUserOptions } from '../hooks/useUserOptions';
import { fieldWrapClass, formActionsClass, formGridClass, inputClass, labelClass, textareaClass } from '../shared/formStyles';

export interface InteractionSummaryFormProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  caseId: string;
  /** When set, the form edits this summary instead of creating a new one. */
  existingSummary?: InteractionSummary | null;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Completed' },
];

export function InteractionSummaryForm({
  isOpen,
  onClose,
  clientId,
  caseId,
  existingSummary,
}: InteractionSummaryFormProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const caseOptions = useCaseOptions();
  const users = useUserOptions();
  const isEditing = Boolean(existingSummary);

  const [title, setTitle] = useState(existingSummary?.title ?? '');
  const [status, setStatus] = useState(existingSummary?.status ?? 'draft');
  const [interactionPurpose, setInteractionPurpose] = useState(existingSummary?.interactionPurpose ?? '');
  const [confidentialityType, setConfidentialityType] = useState(existingSummary?.confidentialityType ?? '');
  const [meetingNotes, setMeetingNotes] = useState(existingSummary?.meetingNotes ?? '');
  const [nextSteps, setNextSteps] = useState(existingSummary?.nextSteps ?? '');
  const [partnerAccount, setPartnerAccount] = useState(existingSummary?.partnerAccount ?? '');

  const [createTask, setCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [useNextStepsAsDescription, setUseNextStepsAsDescription] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      showToast('Title is required to save an Interaction Summary.');
      return;
    }
    if (createTask && !taskTitle.trim()) {
      showToast('Please enter a subject for the task.');
      return;
    }

    setIsSaving(true);
    if (isEditing && existingSummary) {
      const result = await dispatch(
        updateCaseInteractionSummary({
          id: existingSummary.id,
          input: {
            title: title.trim(),
            status,
            interactionPurpose: interactionPurpose || null,
            confidentialityType: confidentialityType || null,
            meetingNotes: meetingNotes || null,
            nextSteps: nextSteps || null,
            partnerAccount: partnerAccount || null,
          },
        })
      );
      if (!updateCaseInteractionSummary.fulfilled.match(result)) {
        setIsSaving(false);
        showToast('Failed to update the interaction summary. Please try again.');
        return;
      }

      if (createTask) {
        const taskResult = await dispatch(
          createCaseTask({
            subject: taskTitle.trim(),
            description: useNextStepsAsDescription ? nextSteps || null : taskDescription || null,
            dueDate: taskDueDate || null,
            ownerId: taskAssignedTo ? Number(taskAssignedTo) : null,
            clientId,
            caseId,
            subtype: 'interactionSummary',
            interactionSummaryId: existingSummary.id,
          })
        );
        if (!createCaseTask.fulfilled.match(taskResult)) {
          setIsSaving(false);
          showToast('Interaction summary updated, but the task could not be created.');
          return;
        }
      }

      setIsSaving(false);
      showToast('Interaction summary updated.', 'success');
      dispatch(fetchCaseInteractionSummaries({ caseId }));
      dispatch(fetchInteractionSummaryDetail(existingSummary.id));
      onClose();
      return;
    }

    const result = await dispatch(
      createCaseInteractionSummary({
        clientId,
        caseId,
        title: title.trim(),
        status,
        interactionPurpose: interactionPurpose || undefined,
        confidentialityType: confidentialityType || undefined,
        meetingNotes: meetingNotes || null,
        nextSteps: nextSteps || null,
        partnerAccount: partnerAccount || undefined,
        task: createTask
          ? {
              createTask: true,
              taskTitle: taskTitle.trim(),
              taskDescription: taskDescription || undefined,
              taskDueDate: taskDueDate || undefined,
              taskAssignedTo: taskAssignedTo ? Number(taskAssignedTo) : undefined,
              useNextStepsAsDescription,
            }
          : undefined,
      })
    );
    setIsSaving(false);

    if (createCaseInteractionSummary.fulfilled.match(result)) {
      showToast('Interaction summary saved.', 'success');
      dispatch(fetchCaseInteractionSummaries({ caseId }));
      resetForm();
      onClose();
    } else {
      showToast('Failed to save the Interaction Summary. Please try again.');
    }
  }

  function resetForm() {
    setTitle('');
    setStatus('draft');
    setInteractionPurpose('');
    setConfidentialityType('');
    setMeetingNotes('');
    setNextSteps('');
    setPartnerAccount('');
    setCreateTask(false);
    setTaskTitle('');
    setTaskDueDate('');
    setTaskAssignedTo('');
    setUseNextStepsAsDescription(false);
    setTaskDescription('');
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Interaction Summary' : 'New Interaction Summary'}
      size="lg"
    >
      <div className="flex flex-col gap-6">
        <div className={formGridClass}>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="is-title">
              Title *
            </label>
            <input
              id="is-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="is-status">
              Status
            </label>
            <select
              id="is-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={inputClass}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="is-purpose">
              Interaction Purpose
            </label>
            <select
              id="is-purpose"
              value={interactionPurpose}
              onChange={(event) => setInteractionPurpose(event.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {caseOptions.interactionPurpose.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="is-confidentiality">
              Confidentiality Type
            </label>
            <select
              id="is-confidentiality"
              value={confidentialityType}
              onChange={(event) => setConfidentialityType(event.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {caseOptions.confidentialityType.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="is-partner-account">
              Partner Account
            </label>
            <input
              id="is-partner-account"
              type="text"
              value={partnerAccount}
              onChange={(event) => setPartnerAccount(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="is-meeting-notes">
            Meeting Notes
          </label>
          <textarea
            id="is-meeting-notes"
            value={meetingNotes}
            onChange={(event) => setMeetingNotes(event.target.value)}
            className={textareaClass}
          />
        </div>

        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="is-next-steps">
            Next Steps
          </label>
          <textarea
            id="is-next-steps"
            value={nextSteps}
            onChange={(event) => setNextSteps(event.target.value)}
            className={textareaClass}
          />
        </div>

        <div className="rounded-lg border border-borderRow p-6">
          <label className="flex items-center gap-3 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={createTask}
              onChange={(event) => setCreateTask(event.target.checked)}
              className="h-4 w-4 rounded border-borderStrong"
            />
            Create a Task
          </label>

          {createTask ? (
            <div className="mt-5 flex flex-col gap-5">
              <div className={formGridClass}>
                <div className={fieldWrapClass}>
                  <label className={labelClass} htmlFor="is-task-title">
                    Title *
                  </label>
                  <input
                    id="is-task-title"
                    type="text"
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className={fieldWrapClass}>
                  <label className={labelClass} htmlFor="is-task-due-date">
                    Due Date
                  </label>
                  <input
                    id="is-task-due-date"
                    type="date"
                    value={taskDueDate}
                    onChange={(event) => setTaskDueDate(event.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className={fieldWrapClass}>
                  <label className={labelClass} htmlFor="is-task-assigned-to">
                    Assigned To
                  </label>
                  <select
                    id="is-task-assigned-to"
                    value={taskAssignedTo}
                    onChange={(event) => setTaskAssignedTo(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={useNextStepsAsDescription}
                  onChange={(event) => setUseNextStepsAsDescription(event.target.checked)}
                  className="h-4 w-4 rounded border-borderStrong"
                />
                Use Next Steps as the task description
              </label>

              {!useNextStepsAsDescription ? (
                <div className={fieldWrapClass}>
                  <label className={labelClass} htmlFor="is-task-description">
                    Task Description
                  </label>
                  <textarea
                    id="is-task-description"
                    value={taskDescription}
                    onChange={(event) => setTaskDescription(event.target.value)}
                    className={textareaClass}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={formActionsClass}>
          <Button variant="tertiary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
            {isEditing ? 'Save Changes' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
