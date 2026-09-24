import { useState } from 'react';
import type { ClientSearchResultItem } from '@housing360/types';
import { Button, Modal, useToast } from '../../../components/ui';
import { useAppDispatch } from '../../../store/hooks';
import { createCase, fetchCases } from '../../../store/slices/casesSlice';
import { ClientSearchField } from '../shared/ClientSearchField';
import { useCaseOptions } from '../hooks/useCaseOptions';
import { useUserOptions } from '../hooks/useUserOptions';
import {
  errorTextClass,
  fieldWrapClass,
  formActionsClass,
  formGridClass,
  inputClass,
  labelClass,
  textareaClass,
} from '../shared/formStyles';

export interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * `referralId` is intentionally not offered here yet — the `Referral` entity
 * doesn't exist until this change's Referrals-tab work lands; this modal
 * gains a Referral picker then rather than faking one now.
 */
export function NewCaseModal({ isOpen, onClose }: NewCaseModalProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const caseOptions = useCaseOptions();
  const users = useUserOptions();

  const [client, setClient] = useState<ClientSearchResultItem | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [assignedCaseManagerId, setAssignedCaseManagerId] = useState('');
  const [openedDate, setOpenedDate] = useState('');
  const [status, setStatus] = useState('open');
  const [priority, setPriority] = useState('');
  const [origin, setOrigin] = useState('');
  const [escalated, setEscalated] = useState(false);
  const [contact, setContact] = useState('');
  const [subjectError, setSubjectError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function resetAndClose() {
    setClient(null);
    setSubject('');
    setDescription('');
    setAssignedCaseManagerId('');
    setOpenedDate('');
    setStatus('open');
    setPriority('');
    setOrigin('');
    setEscalated(false);
    setContact('');
    setSubjectError(false);
    onClose();
  }

  async function handleSubmit() {
    if (!subject.trim() || !client) {
      setSubjectError(!subject.trim());
      showToast('Unable to create the case. Please check the required fields.');
      return;
    }

    setIsSaving(true);
    const result = await dispatch(
      createCase({
        clientId: client.id,
        subject: subject.trim(),
        description: description.trim() || undefined,
        status,
        priority: (priority || undefined) as 'high' | 'medium' | 'low' | undefined,
        origin: origin || undefined,
        escalated,
        contact: contact.trim() || undefined,
        openedDate: openedDate || undefined,
        assignedCaseManagerId: assignedCaseManagerId ? Number(assignedCaseManagerId) : undefined,
      })
    );
    setIsSaving(false);

    if (createCase.fulfilled.match(result)) {
      showToast('Case created successfully.', 'success');
      dispatch(fetchCases({ page: 1, pageSize: 20, filter: 'all', search: '' }));
      resetAndClose();
    } else {
      showToast('Unable to create the case. Please check the required fields.');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="New Case" size="lg">
      <div className="flex flex-col gap-6">
        <ClientSearchField selectedClient={client} onSelect={setClient} required />

        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="new-case-subject">
            Subject *
          </label>
          <input
            id="new-case-subject"
            type="text"
            value={subject}
            onChange={(event) => {
              setSubject(event.target.value);
              setSubjectError(false);
            }}
            className={inputClass}
          />
          {subjectError ? <p className={errorTextClass}>Please enter a subject for the case.</p> : null}
        </div>

        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="new-case-description">
            Description
          </label>
          <textarea
            id="new-case-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={textareaClass}
          />
        </div>

        <div className={formGridClass}>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="new-case-manager">
              Case Manager
            </label>
            <select
              id="new-case-manager"
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

          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="new-case-opened-date">
              Opened Date
            </label>
            <input
              id="new-case-opened-date"
              type="date"
              value={openedDate}
              onChange={(event) => setOpenedDate(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="new-case-status">
              Status
            </label>
            <select
              id="new-case-status"
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
            <label className={labelClass} htmlFor="new-case-priority">
              Priority
            </label>
            <select
              id="new-case-priority"
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
            <label className={labelClass} htmlFor="new-case-origin">
              Origin
            </label>
            <select
              id="new-case-origin"
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
            <label className={labelClass} htmlFor="new-case-contact">
              Contact
            </label>
            <input
              id="new-case-contact"
              type="text"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={escalated}
            onChange={(event) => setEscalated(event.target.checked)}
            className="h-4 w-4 rounded border-borderStrong"
          />
          Escalated
        </label>

        <div className={formActionsClass}>
          <Button variant="tertiary" onClick={resetAndClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
            Create Case
          </Button>
        </div>
      </div>
    </Modal>
  );
}
