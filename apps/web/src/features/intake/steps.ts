import type { ComponentType, RefAttributes } from 'react';
import type { IconName } from '../../components/ui';
import type { StepHandle } from './types';
import Step1ClientBasicInfo from './steps/Step1ClientBasicInfo';
import Step2FamilyMembers from './steps/Step2FamilyMembers';
import Step3ProgramEnrollment from './steps/Step3ProgramEnrollment';
import { Step4LivingSituation } from './steps/Step4LivingSituation';
import { Step5IncomeBenefits } from './steps/Step5IncomeBenefits';
import { Step6HealthDv } from './steps/Step6HealthDv';
import { Step7Disabilities } from './steps/Step7Disabilities';
import { Step8InteractionSummary } from './steps/Step8InteractionSummary';

export interface WizardStepConfig {
  key: string;
  label: string;
  icon?: IconName;
  component: ComponentType<RefAttributes<StepHandle>>;
}

/**
 * The 8-step config array driving `IntakeWizard`'s rail, header, and body —
 * see design.md's "step-config-driven wizard shell" decision. Each step
 * component implements `StepHandle` (`types.ts`) via `useImperativeHandle`;
 * the shell calls `ref.current.save()` on "Save & Next" rather than this
 * array carrying a separate `onNext` callback, since the step component and
 * its own save/validate logic are already one unit per file.
 */
export const WIZARD_STEPS: WizardStepConfig[] = [
  { key: 'client-basic-info', label: 'Client Basic Information', component: Step1ClientBasicInfo },
  { key: 'family-members', label: 'Family Members', component: Step2FamilyMembers },
  { key: 'program-enrollment', label: 'Program & Enrollment', component: Step3ProgramEnrollment },
  { key: 'living-situation', label: 'Living Situation', component: Step4LivingSituation },
  { key: 'income-benefits', label: 'Income & Benefits', component: Step5IncomeBenefits },
  { key: 'health-dv', label: 'Health & DV', component: Step6HealthDv },
  { key: 'disabilities', label: 'Disabilities', component: Step7Disabilities },
  { key: 'interaction-summary', label: 'Interaction Summary', component: Step8InteractionSummary },
];
