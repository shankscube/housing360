import { useEffect, useRef } from 'react';
import { Button, Icon, StepRail, ToastProvider } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  loadHudOptions,
  resetIntake,
  setCurrentStep,
  setPhase,
} from '../../store/slices/intakeSlice';
import SearchPhase from './phases/SearchPhase';
import { FinishedPhase } from './phases/FinishedPhase';
import { WIZARD_STEPS } from './steps';
import type { StepHandle } from './types';

export interface IntakeWizardProps {
  /** Closes the wizard outright (header ✕, Done). My Clients refetches its list when this fires. */
  onClose: () => void;
  /** Fired from the Finished phase's "View client record" link, with the newly-created/edited client's id. */
  onViewClient: (clientId: string) => void;
}

/**
 * The reusable multi-step HUD intake wizard — search-or-create, an 8-step
 * form (rail + "Step N of 8" + progress bar), then a finished panel. All
 * wizard state lives in the `intake` Redux slice; this component is layout
 * and step-advancement only. See design.md's "wizard shell is step-config-
 * driven" decision.
 */
export function IntakeWizard({ onClose, onViewClient }: IntakeWizardProps) {
  const dispatch = useAppDispatch();
  const phase = useAppSelector((state) => state.intake.phase);
  const currentStep = useAppSelector((state) => state.intake.currentStep);
  const furthestStep = useAppSelector((state) => state.intake.furthestStep);
  const completedSteps = useAppSelector((state) => state.intake.completedSteps);
  const clientId = useAppSelector((state) => state.intake.ids.clientId);

  const stepRef = useRef<StepHandle>(null);

  // HUD option lists are loaded once, here, and read by every step from
  // `state.intake.hudOptions.data` — the frontend never hardcodes an option list.
  useEffect(() => {
    dispatch(loadHudOptions());
  }, [dispatch]);

  // Full reset on unmount so a later intake (a different client, or the same
  // wizard reopened from a different launch point) always starts clean.
  useEffect(() => {
    return () => {
      dispatch(resetIntake());
    };
  }, [dispatch]);

  const stepIndex = currentStep - 1; // WIZARD_STEPS/StepRail are 0-indexed; slice state is 1-8.
  const activeStep = WIZARD_STEPS[stepIndex];
  const StepComponent = activeStep?.component;
  const isLastStep = currentStep === WIZARD_STEPS.length;

  async function advanceTo(nextStep: number) {
    if (nextStep > WIZARD_STEPS.length) {
      dispatch(setPhase('finished'));
      return;
    }
    dispatch(setCurrentStep(nextStep));
  }

  async function handleStepRailClick(index: number) {
    const targetStep = index + 1;
    if (targetStep === currentStep) {
      return;
    }
    // Rail steps beyond `furthestStep` are already non-clickable (StepRail's
    // own gate) — this is the "save the current step first" half of the
    // "Step Rail Reflects and Gates Progress" requirement.
    const saved = await stepRef.current?.save();
    if (saved) {
      dispatch(setCurrentStep(targetStep));
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      dispatch(setCurrentStep(currentStep - 1));
    }
  }

  async function handleSaveNext() {
    const saved = await stepRef.current?.save();
    if (saved) {
      await advanceTo(currentStep + 1);
    }
  }


  return (
    <ToastProvider>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 px-6 py-10">
        <div className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-borderSubtle px-9 py-6">
            <h1 className="font-display text-xl text-ink">New Intake</h1>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-textMuted transition-colors hover:text-ink"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          {phase === 'search' ? (
            <div className="flex-1 overflow-y-auto p-9">
              <SearchPhase />
            </div>
          ) : phase === 'finished' ? (
            <div className="flex-1 overflow-y-auto p-9">
              <FinishedPhase
                clientId={clientId ?? ''}
                onViewClient={onViewClient}
                onDone={onClose}
              />
            </div>
          ) : (
            <div className="flex flex-1 overflow-hidden">
              <div className="w-72 shrink-0 overflow-y-auto border-r border-borderSubtle bg-surfaceMuted p-7">
                <StepRail
                  steps={WIZARD_STEPS.map(({ key, label, icon }) => ({ key, label, icon }))}
                  currentStep={stepIndex}
                  furthestStep={furthestStep - 1}
                  completedSteps={completedSteps.map((step) => step - 1)}
                  onStepClick={handleStepRailClick}
                />
              </div>

              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="border-b border-borderSubtle px-9 py-5">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-textMuted">
                    Step {currentStep} of {WIZARD_STEPS.length}
                  </p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surfaceStep">
                    <div
                      className="h-full rounded-full bg-ink transition-all"
                      style={{ width: `${(currentStep / WIZARD_STEPS.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-9 py-7">
                  {StepComponent ? <StepComponent key={activeStep.key} ref={stepRef} /> : null}
                </div>

                <div className="flex items-center justify-between border-t border-borderSubtle px-9 py-6">
                  <Button variant="tertiary" size="md" onClick={handleBack} disabled={currentStep === 1}>
                    Back
                  </Button>
                  <Button variant="primary" size="md" onClick={handleSaveNext}>
                    {isLastStep ? 'Save & Finish' : 'Save & Next'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToastProvider>
  );
}
