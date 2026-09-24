import { useState } from 'react';
import type { RoiStatusResponse } from '@housing360/types';
import { Button } from '../../../components/ui';
import { ReleaseOfInformationForm } from '../roi/ReleaseOfInformationForm';

export interface RoiStatusCardProps {
  clientId: string;
  roiStatus: RoiStatusResponse;
  onSaved: () => void;
}

export function RoiStatusCard({ clientId, roiStatus, onSaved }: RoiStatusCardProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-surface p-8 shadow-card">
      <h2 className="font-display text-lg font-semibold text-ink">Release of Information</h2>
      {roiStatus.hasActiveConsent && roiStatus.activeRoi ? (
        <p className="text-sm text-ink">
          Active consent on file — authorized to {roiStatus.activeRoi.recipientOrgName}, expires{' '}
          {new Date(roiStatus.activeRoi.expiresOn).toLocaleDateString()}.
        </p>
      ) : (
        <p className="text-sm text-textMuted">No active Release of Information is on file for this client.</p>
      )}
      <div>
        <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
          Create Release of Information
        </Button>
      </div>

      <ReleaseOfInformationForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        clientId={clientId}
        onSaved={onSaved}
      />
    </div>
  );
}
