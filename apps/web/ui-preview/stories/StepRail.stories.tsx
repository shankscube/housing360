import { useState } from 'react';
import { StepRail, type StepRailStep } from '../../src/components/ui';
import type { ComponentPreview } from './types';

const STEPS: StepRailStep[] = [
  { key: 'basic', label: 'Client Basic Information', icon: 'users' },
  { key: 'family', label: 'Family Members', icon: 'users' },
  { key: 'program', label: 'Program & Enrollment', icon: 'cases' },
  { key: 'living', label: 'Living Situation', icon: 'home' },
  { key: 'income', label: 'Income & Benefits', icon: 'assess' },
  { key: 'health', label: 'Health & DV', icon: 'assess' },
  { key: 'disabilities', label: 'Disabilities', icon: 'assess' },
  { key: 'summary', label: 'Interaction Summary', icon: 'ce' },
];

function InteractiveStepRail() {
  const [currentStep, setCurrentStep] = useState(2);
  const [furthestStep, setFurthestStep] = useState(2);

  function handleStepClick(index: number) {
    setCurrentStep(index);
    setFurthestStep((prev) => Math.max(prev, index));
  }

  return (
    <div className="max-w-formCardWidth rounded-2xl bg-surfaceApp p-9">
      <StepRail
        steps={STEPS}
        currentStep={currentStep}
        furthestStep={furthestStep}
        completedSteps={Array.from({ length: currentStep }, (_, index) => index)}
        onStepClick={handleStepClick}
      />
      <p className="mt-7 text-xs text-textMuted">
        Steps after the furthest reached ({STEPS[furthestStep].label}) are not clickable.
      </p>
    </div>
  );
}

export const stepRailPreview: ComponentPreview = {
  name: 'StepRail',
  reference: 'client-intake-wizard → IntakeWizard shell → left-side step rail (8 steps)',
  variants: [
    {
      name: 'Interactive — click any step at or before the furthest reached',
      element: <InteractiveStepRail />,
    },
    {
      name: 'Static — step 1 active, nothing completed yet',
      element: (
        <div className="max-w-formCardWidth rounded-2xl bg-surfaceApp p-9">
          <StepRail
            steps={STEPS}
            currentStep={0}
            furthestStep={0}
            completedSteps={[]}
            onStepClick={() => {}}
          />
        </div>
      ),
    },
    {
      name: 'Static — all steps complete, on the last one',
      element: (
        <div className="max-w-formCardWidth rounded-2xl bg-surfaceApp p-9">
          <StepRail
            steps={STEPS}
            currentStep={7}
            furthestStep={7}
            completedSteps={[0, 1, 2, 3, 4, 5, 6]}
            onStepClick={() => {}}
          />
        </div>
      ),
    },
  ],
};
