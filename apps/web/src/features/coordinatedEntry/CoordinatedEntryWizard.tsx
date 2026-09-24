import { useState } from 'react';
import type { RecommendedProgram } from '@housing360/types';
import { Button, StatusStepper, type StatusStepperStage } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetCoordinatedEntryFlow, selectCoordinatedEntryClient } from '../../store/slices/coordinatedEntrySlice';
import { ClientSearchField } from '../cases/shared/ClientSearchField';
import { RecommendationCard } from './RecommendationCard';
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
 * visual indicator (design.md Decision 11/12) — it has no concept of step
 * content or navigation; this component owns current-step state and which
 * step is reachable, mirroring `IntakeWizard`'s shell/step separation without
 * reusing its heavier `StepHandle`/ref indirection, which was built for
 * validation-heavy multi-field forms. These 4 steps are simpler (a
 * screening form, two pick-one lists, a review-and-send), so each step calls
 * a plain `onComplete` prop instead.
 *
 * Once Step 1 completes, the `CeAssessmentDetail` it returns (score, band,
 * applied overrides, referral-suppression state) is shown via
 * `RecommendationCard` for the rest of the flow (10.2). When
 * `referralSuppressed` is true, Steps 2-4 render their own suppressed state
 * instead of their normal pick/send UI (10.3) — the stepper still advances
 * (matching the coordinated-entry spec's own "stepper advances" scenario),
 * but none of the later steps let a suppressed client proceed to a normal
 * program/referral flow.
 */
export function CoordinatedEntryWizard() {
  const dispatch = useAppDispatch();
  const client = useAppSelector((state) => state.coordinatedEntry.client);
  const assessment = useAppSelector((state) => state.coordinatedEntry.assessment.data);
  const referral = useAppSelector((state) => state.coordinatedEntry.referral.data);

  const [currentStep, setCurrentStep] = useState<StepKey>('vulnerability');
  const [selectedProjectType, setSelectedProjectType] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<RecommendedProgram | null>(null);

  function handleStartOver() {
    dispatch(resetCoordinatedEntryFlow());
    setCurrentStep('vulnerability');
    setSelectedProjectType(null);
    setSelectedProgram(null);
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

      {assessment ? <RecommendationCard assessment={assessment} /> : null}

      <div className="border-t border-borderSubtle pt-7">
        {currentStep === 'vulnerability' ? (
          <Step1VulnerabilityAssessment clientId={client.id} onComplete={() => setCurrentStep('programs')} />
        ) : null}
        {currentStep === 'programs' && assessment ? (
          <Step2RecommendedPrograms
            recommendedProjectTypes={assessment.recommendedProjectTypes}
            selectedProjectType={selectedProjectType}
            onSelectProjectType={setSelectedProjectType}
            referralSuppressed={assessment.referralSuppressed}
            onComplete={() => setCurrentStep('agencies')}
          />
        ) : null}
        {currentStep === 'agencies' && assessment ? (
          <Step3PartnerAgencies
            projectType={selectedProjectType}
            selectedProgram={selectedProgram}
            onSelectProgram={setSelectedProgram}
            referralSuppressed={assessment.referralSuppressed}
            onBack={() => setCurrentStep('programs')}
            onComplete={() => setCurrentStep('referral')}
          />
        ) : null}
        {currentStep === 'referral' && assessment ? (
          <Step4SendReferral
            client={client}
            assessment={assessment}
            program={selectedProgram}
            sentReferral={referral}
            onStartOver={handleStartOver}
          />
        ) : null}
      </div>
    </div>
  );
}
