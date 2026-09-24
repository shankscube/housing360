import { useState } from 'react';
import { Button, StatusStepper, type StatusStepperStage } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetCoordinatedEntryFlow, selectCoordinatedEntryClient } from '../../store/slices/coordinatedEntrySlice';
import { ClientSearchField } from '../cases/shared/ClientSearchField';
import { Step1VulnerabilityAssessment } from './steps/Step1VulnerabilityAssessment';
import { Step2RecommendedPrograms } from './steps/Step2RecommendedPrograms';
import { Step3PartnerAgencies } from './steps/Step3PartnerAgencies';
import { Step4SendReferral } from './steps/Step4SendReferral';

const STAGES: StatusStepperStage[] = [
  { key: 'vulnerability', label: 'Vulnerability Assessment' },
  { key: 'programs', label: 'Recommended Program Types' },
  { key: 'agencies', label: 'Partner Agencies' },
  { key: 'referral', label: 'Send Referral' },
];

type StepKey = 'vulnerability' | 'programs' | 'agencies' | 'referral';

/**
 * The 4-step Coordinated Entry flow. `StatusStepper` is used purely as the
 * visual indicator (design.md Decision 6) — it has no concept of step
 * content or navigation; this component owns current-step state and which
 * step is reachable, mirroring `IntakeWizard`'s shell/step separation without
 * reusing its heavier `StepHandle`/ref indirection, which was built for
 * validation-heavy multi-field forms. These 4 steps are simpler (a
 * screening form, two pick-one lists, a review-and-send), so each step calls
 * a plain `onComplete` prop instead.
 */
export function CoordinatedEntryWizard() {
  const dispatch = useAppDispatch();
  const client = useAppSelector((state) => state.coordinatedEntry.client);
  const vulnerabilityAssessment = useAppSelector(
    (state) => state.coordinatedEntry.vulnerabilityAssessment.data
  );
  const referral = useAppSelector((state) => state.coordinatedEntry.referral.data);

  const [currentStep, setCurrentStep] = useState<StepKey>('vulnerability');
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedProviderOrgId, setSelectedProviderOrgId] = useState<string | null>(null);

  function handleStartOver() {
    dispatch(resetCoordinatedEntryFlow());
    setCurrentStep('vulnerability');
    setSelectedProgramId(null);
    setSelectedProviderOrgId(null);
  }

  if (!client) {
    return (
      <div className="rounded-2xl bg-surface p-9 shadow-card">
        <h2 className="font-display text-lg text-ink">Start Coordinated Entry</h2>
        <p className="mt-2 text-sm text-textMuted">
          Select a client to begin the vulnerability assessment and referral flow.
        </p>
        <div className="mt-5 max-w-md">
          <ClientSearchField
            selectedClient={null}
            onSelect={(selected) => dispatch(selectCoordinatedEntryClient(selected))}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7 rounded-2xl bg-surface p-9 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg text-ink">Coordinated Entry</h2>
          <p className="text-sm text-textMuted">
            {client.firstName} {client.lastName}
          </p>
        </div>
        <Button variant="tertiary" size="sm" onClick={handleStartOver}>
          Start Over
        </Button>
      </div>

      <StatusStepper stages={STAGES} currentStageKey={currentStep} />

      <div className="border-t border-borderSubtle pt-7">
        {currentStep === 'vulnerability' ? (
          <Step1VulnerabilityAssessment
            clientId={client.id}
            onComplete={() => setCurrentStep('programs')}
          />
        ) : null}
        {currentStep === 'programs' ? (
          <Step2RecommendedPrograms
            clientId={client.id}
            selectedProgramId={selectedProgramId}
            onSelectProgram={setSelectedProgramId}
            onComplete={() => setCurrentStep('agencies')}
          />
        ) : null}
        {currentStep === 'agencies' ? (
          <Step3PartnerAgencies
            selectedProviderOrgId={selectedProviderOrgId}
            onSelectProviderOrg={setSelectedProviderOrgId}
            onComplete={() => setCurrentStep('referral')}
          />
        ) : null}
        {currentStep === 'referral' ? (
          <Step4SendReferral
            clientId={client.id}
            vulnerabilityAssessmentId={vulnerabilityAssessment?.id ?? null}
            programId={selectedProgramId}
            providerOrgId={selectedProviderOrgId}
            sentReferral={referral}
            onStartOver={handleStartOver}
          />
        ) : null}
      </div>
    </div>
  );
}
