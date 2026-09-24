import { useState } from 'react';
import { Button, Modal, useToast } from '../../../components/ui';
import { useAppDispatch } from '../../../store/hooks';
import { createCaseTask, fetchCaseTasks, fetchInteractionSummaryDetail } from '../../../store/slices/casesSlice';
import { fetchCarePlansByCase } from '../../../store/slices/carePlansSlice';
import { useUserOptions } from '../hooks/useUserOptions';
import {
  errorTextClass,
  fieldWrapClass,
  formActionsClass,
  formGridClass,
  inputClass,
  labelClass,
  textareaClass,
} from './formStyles';

export interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  caseId: string;
  /** Links the new task back to whichever record opened this modal — see `Task`'s shared-table design. */
  interactionSummaryId?: string;
  goalAssignmentId?: string;
}

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

/**
 * Shared "New Task" form — the Overview tab's Tasks card, an interaction
 * summary's activity list, and (Group 5) a care-plan goal's task list all
 * render this same modal rather than each building their own.
 */
export function NewTaskModal({
  isOpen,
  onClose,
  clientId,
  caseId,
  interactionSummaryId,
  goalAssignmentId,
}: NewTaskModalProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const users = useUserOptions();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('open');
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [subjectError, setSubjectError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function reset() {
    setSubject('');
    setDescription('');
    setStatus('open');
    setPriority('');
    setDueDate('');
    setOwnerId('');
    setSubjectError(false);
  }

  async function handleSubmit() {
    if (!subject.trim()) {
      setSubjectError(true);
      showToast('Please enter a subject for the task.');
      return;
    }

    setIsSaving(true);
    const result = await dispatch(
      createCaseTask({
        subject: subject.trim(),
        description: description.trim() || undefined,
        status,
        priority: priority || undefined,
        dueDate: dueDate || undefined,
        ownerId: ownerId ? Number(ownerId) : undefined,
        clientId,
        caseId,
        interactionSummaryId,
        goalAssignmentId,
      })
    );
    setIsSaving(false);

    if (createCaseTask.fulfilled.match(result)) {
      dispatch(fetchCaseTasks(caseId));
      if (interactionSummaryId) {
        dispatch(fetchInteractionSummaryDetail(interactionSummaryId));
      }
      if (goalAssignmentId) {
        dispatch(fetchCarePlansByCase(caseId));
      }
      reset();
      onClose();
    } else {
      showToast('Failed to create the task. Please try again.');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Task">
      <div className="flex flex-col gap-6">
        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="new-task-subject">
            Subject *
          </label>
          <input
            id="new-task-subject"
            type="text"
            value={subject}
            onChange={(event) => {
              setSubject(event.target.value);
              setSubjectError(false);
            }}
            className={inputClass}
          />
          {subjectError ? <p className={errorTextClass}>Please enter a subject for the task.</p> : null}
        </div>

        <div className={formGridClass}>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="new-task-status">
              Status
            </label>
            <select
              id="new-task-status"
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
            <label className={labelClass} htmlFor="new-task-priority">
              Priority
            </label>
            <select
              id="new-task-priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="new-task-due-date">
              Due Date
            </label>
            <input
              id="new-task-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="new-task-owner">
              Assigned To
            </label>
            <select
              id="new-task-owner"
              value={ownerId}
              onChange={(event) => setOwnerId(event.target.value)}
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

        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="new-task-description">
            Description
          </label>
          <textarea
            id="new-task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={textareaClass}
          />
        </div>

        <div className={formActionsClass}>
          <Button variant="tertiary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
            Create Task
          </Button>
        </div>
      </div>
    </Modal>
  );
}
