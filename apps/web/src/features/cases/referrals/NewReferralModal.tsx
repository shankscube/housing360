import { useEffect, useState } from 'react';
import type { ClientSearchResultItem, Program, Referral } from '@housing360/types';
import { Button, Modal, useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createReferral, fetchAllOrganizations, fetchCaseReferrals, updateReferral } from '../../../store/slices/referralsSlice';
import { getActivePrograms } from '../../../api/client';
import { ClientSearchField } from '../shared/ClientSearchField';
import { fieldWrapClass, formActionsClass, formGridClass, inputClass, labelClass, textareaClass } from '../shared/formStyles';

export interface NewReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Optional so this modal can be opened with no case yet (Home's "New
   * Referral" quick action) — `Referral.caseId` is already nullable and
   * `case.service.ts`'s `attachOrphanReferralsToCase` backfills a case-less
   * referral onto a case the moment one opens for that client, same as
   * Coordinated Entry's own referral flow (home-workspace design.md Decision 4).
   */
  caseId?: string;
  existingReferral?: Referral | null;
}

const TYPE_OPTIONS = ['internal', 'external'];
const STATUS_OPTIONS = ['pending', 'accepted', 'declined'];
const PRIORITY_OPTIONS = ['high', 'medium', 'low'];
const CATEGORY_OPTIONS = ['housing', 'employment', 'behavioral_health', 'healthcare', 'legal', 'financial', 'childcare', 'transportation', 'food', 'other'];

export function NewReferralModal({ isOpen, onClose, caseId, existingReferral }: NewReferralModalProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { organizations } = useAppSelector((state) => state.referrals);
  const isEditing = Boolean(existingReferral);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [client, setClient] = useState<ClientSearchResultItem | null>(null);
  const [title, setTitle] = useState(existingReferral?.title ?? '');
  const [programId, setProgramId] = useState(existingReferral?.programId ?? '');
  const [providerOrgId, setProviderOrgId] = useState(existingReferral?.providerOrgId ?? '');
  const [referrerOrgId, setReferrerOrgId] = useState(existingReferral?.referrerOrgId ?? '');
  const [referralDate, setReferralDate] = useState(existingReferral?.referralDate?.slice(0, 10) ?? '');
  const [type, setType] = useState(existingReferral?.type ?? '');
  const [status, setStatus] = useState(existingReferral?.status ?? 'pending');
  const [priority, setPriority] = useState(existingReferral?.priority ?? '');
  const [category, setCategory] = useState(existingReferral?.category ?? '');
  const [description, setDescription] = useState(existingReferral?.description ?? '');
  const [comments, setComments] = useState(existingReferral?.comments ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getActivePrograms().then((response) => {
        if (response.success) setPrograms(response.data);
      });
      dispatch(fetchAllOrganizations());
    }
  }, [isOpen, dispatch]);

  async function handleSubmit() {
    if (!title.trim() || (!isEditing && !client)) {
      showToast('Title and Client are required.');
      return;
    }

    setIsSaving(true);
    if (isEditing && existingReferral) {
      const result = await dispatch(
        updateReferral({
          id: existingReferral.id,
          input: {
            title: title.trim(),
            programId: programId || undefined,
            providerOrgId: providerOrgId || undefined,
            referrerOrgId: referrerOrgId || undefined,
            referralDate: referralDate || undefined,
            type: type || undefined,
            status,
            priority: priority || undefined,
            category: category || undefined,
            description: description.trim() || undefined,
            comments: comments.trim() || undefined,
          },
        })
      );
      setIsSaving(false);
      if (updateReferral.fulfilled.match(result)) {
        showToast('Referral updated.', 'success');
        onClose();
      } else {
        showToast('Failed to update the referral. Please try again.');
      }
      return;
    }

    const result = await dispatch(
      createReferral({
        title: title.trim(),
        clientId: client!.id,
        caseId,
        programId: programId || undefined,
        providerOrgId: providerOrgId || undefined,
        referrerOrgId: referrerOrgId || undefined,
        referralDate: referralDate || undefined,
        type: type || undefined,
        status,
        priority: priority || undefined,
        category: category || undefined,
        description: description.trim() || undefined,
        comments: comments.trim() || undefined,
      })
    );
    setIsSaving(false);
    if (createReferral.fulfilled.match(result)) {
      showToast('Referral created.', 'success');
      if (caseId) {
        dispatch(fetchCaseReferrals(caseId));
      }
      onClose();
    } else {
      showToast('Failed to create the referral. Please try again.');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Referral' : 'New Referral'} size="lg">
      <div className="flex flex-col gap-6">
        {!isEditing ? <ClientSearchField selectedClient={client} onSelect={setClient} required /> : null}

        <div className={fieldWrapClass}>
          <label className={labelClass}>Title *</label>
          <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
        </div>

        <div className={formGridClass}>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Program</label>
            <select value={programId} onChange={(event) => setProgramId(event.target.value)} className={inputClass}>
              <option value="">Select…</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Provider</label>
            <select value={providerOrgId} onChange={(event) => setProviderOrgId(event.target.value)} className={inputClass}>
              <option value="">Select…</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Referrer</label>
            <select value={referrerOrgId} onChange={(event) => setReferrerOrgId(event.target.value)} className={inputClass}>
              <option value="">Select…</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Referral Date</label>
            <input type="date" value={referralDate} onChange={(event) => setReferralDate(event.target.value)} className={inputClass} />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Type</label>
            <select value={type} onChange={(event) => setType(event.target.value)} className={inputClass}>
              <option value="">Select…</option>
              {TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Status</label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Priority</label>
            <select value={priority} onChange={(event) => setPriority(event.target.value)} className={inputClass}>
              <option value="">Select…</option>
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Category</label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}>
              <option value="">Select…</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={fieldWrapClass}>
          <label className={labelClass}>Description</label>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} className={textareaClass} />
        </div>
        <div className={fieldWrapClass}>
          <label className={labelClass}>Comments</label>
          <textarea value={comments} onChange={(event) => setComments(event.target.value)} className={textareaClass} />
        </div>

        <div className={formActionsClass}>
          <Button variant="tertiary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
            {isEditing ? 'Save Changes' : 'Create Referral'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
