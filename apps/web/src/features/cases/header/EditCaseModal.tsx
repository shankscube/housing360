import { useState } from 'react';
import type { CaseDetail } from '@housing360/types';
import { Button, Modal, useToast } from '../../../components/ui';
import { useAppDispatch } from '../../../store/hooks';
import { updateCase } from '../../../store/slices/casesSlice';
import { useCaseOptions } from '../hooks/useCaseOptions';
import { useUserOptions } from '../hooks/useUserOptions';
import { fieldWrapClass, formActionsClass, formGridClass, inputClass, labelClass, textareaClass } from '../shared/formStyles';

export interface EditCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseDetail: CaseDetail;
}

export function EditCaseModal({ isOpen, onClose, caseDetail }: EditCaseModalProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const caseOptions = useCaseOptions();
  const users = useUserOptions();

  const [subject, setSubject] = useState(caseDetail.subject ?? '');
  const [description, setDescription] = useState(caseDetail.description ?? '');
  const [status, setStatus] = useState(caseDetail.status);
  const [priority, setPriority] = useState(caseDetail.priority ?? '');
  const [stage, setStage] = useState(caseDetail.stage ?? '');
  const [origin, setOrigin] = useState(caseDetail.origin ?? '');
  const [hmisDataQualityStatus, setHmisDataQualityStatus] = useState(caseDetail.hmisDataQualityStatus ?? '');
  const [nextHmisReviewDue, setNextHmisReviewDue] = useState(
    caseDetail.nextHmisReviewDue ? caseDetail.nextHmisReviewDue.slice(0, 10) : ''
  );
  const [assignedCaseManagerId, setAssignedCaseManagerId] = useState(
    caseDetail.assignedCaseManagerId ? String(caseDetail.assignedCaseManagerId) : ''
  );
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit() {
    if (!subject.trim()) {
      showToast('Please enter a subject for the case.');
      return;
    }

    setIsSaving(true);
    const result = await dispatch(
      updateCase({
        id: caseDetail.id,
        input: {
          subject: subject.trim(),
          description: description.trim() || null,
          status,
          priority: (priority || undefined) as 'high' | 'medium' | 'low' | undefined,
          stage: stage || null,
          origin: origin || null,
          hmisDataQualityStatus: hmisDataQualityStatus || null,
          nextHmisReviewDue: nextHmisReviewDue || null,
          assignedCaseManagerId: assignedCaseManagerId ? Number(assignedCaseManagerId) : null,
        },
      })
    );
    setIsSaving(false);

    if (updateCase.fulfilled.match(result)) {
      showToast('Case updated successfully.', 'success');
      onClose();
    } else {
      showToast('Unable to update the case. Please check the fields and try again.');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Case" size="lg">
      <div className="flex flex-col gap-6">
        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="edit-case-subject">
            Subject *
          </label>
          <input
            id="edit-case-subject"
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="edit-case-description">
            Description
          </label>
          <textarea
            id="edit-case-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={textareaClass}
          />
        </div>

        <div className={formGridClass}>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="edit-case-status">
              Status
            </label>
            <select
              id="edit-case-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={inputClass}
            >
              {caseOptions.status.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="edit-case-priority">
              Priority
            </label>
            <select
              id="edit-case-priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="edit-case-stage">
              Stage
            </label>
            <select
              id="edit-case-stage"
              value={stage}
              onChange={(event) => setStage(event.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {caseOptions.stage.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="edit-case-origin">
              Origin
            </label>
            <select
              id="edit-case-origin"
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {caseOptions.origin.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="edit-case-hmis-status">
              HMIS Data Quality Status
            </label>
            <select
              id="edit-case-hmis-status"
              value={hmisDataQualityStatus}
              onChange={(event) => setHmisDataQualityStatus(event.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {caseOptions.hmisDataQualityStatus.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="edit-case-hmis-review-due">
              Next HMIS Review Due
            </label>
            <input
              id="edit-case-hmis-review-due"
              type="date"
              value={nextHmisReviewDue}
              onChange={(event) => setNextHmisReviewDue(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="edit-case-manager">
              Case Manager
            </label>
            <select
              id="edit-case-manager"
              value={assignedCaseManagerId}
              onChange={(event) => setAssignedCaseManagerId(event.target.value)}
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

        <div className={formActionsClass}>
          <Button variant="tertiary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
