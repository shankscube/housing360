import { useEffect, useState } from 'react';
import type { ReleaseOfInformationCreateInput, RoiTextResponse } from '@housing360/types';
import { Button, Modal, SignaturePad, useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchClientById } from '../../../store/slices/clientsSlice';
import { apiClient } from '../../../api/client';
import { fieldWrapClass, formActionsClass, formGridClass, inputClass, labelClass, textareaClass } from '../shared/formStyles';

export interface ReleaseOfInformationFormProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onSaved?: () => void;
}

const INFO_TYPES: { key: keyof typeof EMPTY_INFO_TYPES; label: string }[] = [
  { key: 'infoCaseManagement', label: 'Case Management' },
  { key: 'infoDayToDayActivity', label: 'Day-to-Day Activity' },
  { key: 'infoMentalHealth', label: 'Mental Health' },
  { key: 'infoChemicalDependency', label: 'Chemical Dependency' },
  { key: 'infoHivAids', label: 'HIV/AIDS' },
  { key: 'infoOther', label: 'Other' },
];

const EMPTY_INFO_TYPES = {
  infoCaseManagement: false,
  infoDayToDayActivity: false,
  infoMentalHealth: false,
  infoChemicalDependency: false,
  infoHivAids: false,
  infoOther: false,
};

const DEFAULT_VALIDITY_DAYS = 365;

function defaultExpiry(): string {
  const date = new Date(Date.now() + DEFAULT_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

/**
 * The shared ROI component — used by the Plan tab's refer-to-partner flow
 * and the Health and Wellness tab's "Create Release of Information" action.
 * Legal text comes from `/api/reference/roi-text`, never inlined here — see
 * design.md Decision 11.
 */
export function ReleaseOfInformationForm({ isOpen, onClose, clientId, onSaved }: ReleaseOfInformationFormProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const client = useAppSelector((state) => state.clients.detail.client);

  const [roiText, setRoiText] = useState<RoiTextResponse | null>(null);
  const [recipientOrgName, setRecipientOrgName] = useState('');
  const [recipientContactName, setRecipientContactName] = useState('');
  const [recipientContactEmail, setRecipientContactEmail] = useState('');
  const [recipientContactPhone, setRecipientContactPhone] = useState('');
  const [infoTypes, setInfoTypes] = useState(EMPTY_INFO_TYPES);
  const [infoOtherSpecify, setInfoOtherSpecify] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expiresOn, setExpiresOn] = useState(defaultExpiry());
  const [clientSignature, setClientSignature] = useState<string | null>(null);
  const [staffSignature, setStaffSignature] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchClientById(clientId));
      apiClient.get<RoiTextResponse>('/api/reference/roi-text').then((response) => {
        if (response.success) {
          setRoiText(response.data);
        }
      });
    }
  }, [isOpen, clientId, dispatch]);

  async function handleSubmit() {
    if (!recipientOrgName.trim()) {
      showToast('Please enter the recipient organization.');
      return;
    }
    if (!clientSignature || !staffSignature) {
      showToast('Both client and staff signatures are required.');
      return;
    }

    setIsSaving(true);
    const input: ReleaseOfInformationCreateInput = {
      clientId,
      recipientOrgName: recipientOrgName.trim(),
      recipientContactName: recipientContactName.trim() || undefined,
      recipientContactEmail: recipientContactEmail.trim() || undefined,
      recipientContactPhone: recipientContactPhone.trim() || undefined,
      purpose: purpose.trim() || undefined,
      expiresOn: new Date(expiresOn).toISOString(),
      clientSignature,
      staffSignature,
      ...infoTypes,
      infoOtherSpecify: infoOtherSpecify.trim() || undefined,
    };
    const response = await apiClient.post('/api/releases-of-information', input);
    setIsSaving(false);

    if (response.success) {
      showToast('Release of Information saved.', 'success');
      onSaved?.();
      onClose();
    } else {
      showToast('Failed to save the Release of Information. Please try again.');
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Authorization to Release and Receive Confidential Information"
      size="lg"
    >
      <div className="flex flex-col gap-6">
        <div className={formGridClass}>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Client Legal Name</label>
            <p className={inputClass}>
              {client ? `${client.firstName} ${client.lastName}` : '—'}
            </p>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Date of Birth</label>
            <p className={inputClass}>{client?.dob.value ?? '—'}</p>
          </div>
        </div>

        <div className={formGridClass}>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="roi-recipient-org">
              Recipient Organization *
            </label>
            <input
              id="roi-recipient-org"
              type="text"
              value={recipientOrgName}
              onChange={(event) => setRecipientOrgName(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="roi-recipient-contact">
              Recipient Contact Name
            </label>
            <input
              id="roi-recipient-contact"
              type="text"
              value={recipientContactName}
              onChange={(event) => setRecipientContactName(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="roi-recipient-email">
              Recipient Contact Email
            </label>
            <input
              id="roi-recipient-email"
              type="email"
              value={recipientContactEmail}
              onChange={(event) => setRecipientContactEmail(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass} htmlFor="roi-recipient-phone">
              Recipient Contact Phone
            </label>
            <input
              id="roi-recipient-phone"
              type="tel"
              value={recipientContactPhone}
              onChange={(event) => setRecipientContactPhone(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className={fieldWrapClass}>
          <span className={labelClass}>Information Types to Release</span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {INFO_TYPES.map((type) => (
              <label key={type.key} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={infoTypes[type.key]}
                  onChange={(event) =>
                    setInfoTypes((prev) => ({ ...prev, [type.key]: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-borderStrong"
                />
                {type.label}
              </label>
            ))}
          </div>
          {infoTypes.infoOther ? (
            <input
              type="text"
              value={infoOtherSpecify}
              onChange={(event) => setInfoOtherSpecify(event.target.value)}
              placeholder="Specify other information type"
              className={`${inputClass} mt-2`}
            />
          ) : null}
        </div>

        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="roi-purpose">
            Purpose
          </label>
          <textarea
            id="roi-purpose"
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            className={textareaClass}
          />
        </div>

        <p className="rounded-lg bg-surfaceMuted p-5 text-sm text-textMuted">
          {roiText?.authorizationText}
        </p>

        <div className={formGridClass}>
          <SignaturePad
            label="Client Signature"
            value={clientSignature}
            onChange={setClientSignature}
            onClear={() => setClientSignature(null)}
          />
          <SignaturePad
            label="Staff Signature"
            value={staffSignature}
            onChange={setStaffSignature}
            onClear={() => setStaffSignature(null)}
          />
        </div>

        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="roi-expires-on">
            Expires On
          </label>
          <input
            id="roi-expires-on"
            type="date"
            value={expiresOn}
            onChange={(event) => setExpiresOn(event.target.value)}
            className={inputClass}
          />
          <span className="text-xs text-textMuted">Defaults to 365 days from today.</span>
        </div>

        <p className="rounded-lg border border-borderRow p-5 text-xs text-textMuted">
          {roiText?.redisclosureNotice}
        </p>

        <div className={formActionsClass}>
          <Button variant="tertiary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
            Save Release of Information
          </Button>
        </div>
      </div>
    </Modal>
  );
}
