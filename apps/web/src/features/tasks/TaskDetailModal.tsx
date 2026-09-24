import { useEffect, useState, type ReactNode } from 'react';
import type { TaskUpdateInput } from '@housing360/types';
import { Button, Modal, StatusBadge } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearSelectedTask, updateTask } from '../../store/slices/tasksSlice';
import { errorTextClass, fieldWrapClass, inputClass, labelClass, textareaClass } from '../cases/shared/formStyles';

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

interface EditableFields {
  subject: string;
  status: string;
  priority: string;
  dueDate: string;
  description: string;
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function toDateInputValue(value: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export function TaskDetailModal({ taskId, onClose, onSaved }: TaskDetailModalProps) {
  const dispatch = useAppDispatch();
  const { task, status, error } = useAppSelector((state) => state.tasks.detail);

  const [isEditing, setIsEditing] = useState(false);
  const [fields, setFields] = useState<EditableFields | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isOpen = Boolean(taskId);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setFields(null);
      setSaveError(null);
    }
  }, [isOpen]);

  function handleClose() {
    setIsEditing(false);
    setFields(null);
    setSaveError(null);
    dispatch(clearSelectedTask());
    onClose();
  }

  function handleEdit() {
    if (!task) return;
    setFields({
      subject: task.subject,
      status: task.status,
      priority: task.priority ?? '',
      dueDate: toDateInputValue(task.dueDate),
      description: task.description ?? '',
    });
    setSaveError(null);
    setIsEditing(true);
  }

  function handleCancel() {
    setFields(null);
    setSaveError(null);
    setIsEditing(false);
  }

  async function handleSave() {
    if (!task || !fields) return;
    setIsSaving(true);
    setSaveError(null);
    const input: TaskUpdateInput = {
      subject: fields.subject,
      status: fields.status,
      priority: fields.priority ? fields.priority : null,
      dueDate: fields.dueDate ? fields.dueDate : null,
      description: fields.description ? fields.description : null,
    };
    const result = await dispatch(updateTask({ id: task.id, input }));
    setIsSaving(false);
    if (updateTask.fulfilled.match(result)) {
      setIsEditing(false);
      setFields(null);
      onSaved();
    } else {
      setSaveError('Failed to save changes. Please try again.');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={task?.subject ?? 'Task'} size="lg">
      {status === 'loading' && !task ? (
        <p className="text-sm text-textMuted">Loading…</p>
      ) : error && !task ? (
        <p className={errorTextClass}>{error}</p>
      ) : task ? (
        <div className="flex flex-col gap-6">
          {isEditing && fields ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className={fieldWrapClass}>
                <label className={labelClass} htmlFor="task-subject">
                  Subject
                </label>
                <input
                  id="task-subject"
                  className={inputClass}
                  value={fields.subject}
                  onChange={(event) => setFields({ ...fields, subject: event.target.value })}
                />
              </div>
              <div className={fieldWrapClass}>
                <label className={labelClass} htmlFor="task-status">
                  Status
                </label>
                <input
                  id="task-status"
                  className={inputClass}
                  value={fields.status}
                  onChange={(event) => setFields({ ...fields, status: event.target.value })}
                />
              </div>
              <div className={fieldWrapClass}>
                <label className={labelClass} htmlFor="task-priority">
                  Priority
                </label>
                <input
                  id="task-priority"
                  className={inputClass}
                  value={fields.priority}
                  onChange={(event) => setFields({ ...fields, priority: event.target.value })}
                />
              </div>
              <div className={fieldWrapClass}>
                <label className={labelClass} htmlFor="task-due-date">
                  Due Date
                </label>
                <input
                  id="task-due-date"
                  type="date"
                  className={inputClass}
                  value={fields.dueDate}
                  onChange={(event) => setFields({ ...fields, dueDate: event.target.value })}
                />
              </div>
              <div className={`${fieldWrapClass} sm:col-span-2`}>
                <label className={labelClass} htmlFor="task-description">
                  Description
                </label>
                <textarea
                  id="task-description"
                  className={textareaClass}
                  value={fields.description}
                  onChange={(event) => setFields({ ...fields, description: event.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <DetailField label="Subject" value={task.subject} />
              <DetailField label="Status" value={<StatusBadge label={task.status} />} />
              <DetailField label="Priority" value={task.priority ? <StatusBadge label={task.priority} /> : '—'} />
              <DetailField label="Task Subtype" value={task.subtype ?? '—'} />
              <DetailField label="Due Date" value={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'} />
              <DetailField label="Owner" value={task.ownerName ?? '—'} />
              <DetailField label="Client" value={task.clientId} />
              <DetailField label="Created" value={formatDateTime(task.createdAt)} />
              <DetailField label="Last Modified" value={formatDateTime(task.updatedAt)} />
              <div className="sm:col-span-2">
                <DetailField label="Description" value={task.description ?? '—'} />
              </div>
            </div>
          )}

          {saveError ? <p className={errorTextClass}>{saveError}</p> : null}

          <div className="mt-2 flex justify-end gap-4">
            {isEditing ? (
              <>
                <Button variant="tertiary" size="sm" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="sm" onClick={handleEdit}>
                Edit
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={fieldWrapClass}>
      <span className={labelClass}>{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}
