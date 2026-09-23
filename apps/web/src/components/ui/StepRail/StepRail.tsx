import { Icon, type IconName } from '../icons';

export interface StepRailStep {
  key: string;
  label: string;
  icon?: IconName;
}

export interface StepRailProps {
  steps: StepRailStep[];
  /** Index of the step currently shown in the form. */
  currentStep: number;
  /** Furthest index the case manager has ever reached — gates clickability. */
  furthestStep: number;
  /** Indices whose data has actually been saved (not just visited). */
  completedSteps: number[] | Set<number>;
  /** Fires only for a step at or before `furthestStep`; the rail itself never gates the save-then-navigate behavior — that's the wizard shell's job. */
  onStepClick: (index: number) => void;
}

const nodeBaseClass =
  'flex h-stepNode w-stepNode shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors';
const rowBaseClass =
  'flex w-full items-center gap-4.5 rounded-lg px-2 py-2 text-left transition-colors disabled:cursor-not-allowed';

/**
 * The wizard's left-side step rail: each of the 8 steps renders as upcoming
 * (muted, unreached), active (navy fill — "you are here"), or complete (teal
 * fill with a checkmark, regardless of whether the step also has its own
 * icon). A step is clickable only at or before `furthestStep`, per the
 * "Step Rail Reflects and Gates Progress" requirement — this component only
 * renders that gate, it does not itself decide what "saving the current step
 * first" means, which stays the wizard shell's job in `onStepClick`.
 */
export function StepRail({
  steps,
  currentStep,
  furthestStep,
  completedSteps,
  onStepClick,
}: StepRailProps) {
  const completedSet = completedSteps instanceof Set ? completedSteps : new Set(completedSteps);

  return (
    <nav aria-label="Intake wizard steps">
      <ol>
        {steps.map((step, index) => {
          const isComplete = completedSet.has(index);
          const isActive = index === currentStep;
          const isClickable = index <= furthestStep;
          const isLast = index === steps.length - 1;

          const nodeToneClass = isComplete
            ? 'bg-teal text-ink'
            : isActive
              ? 'bg-ink text-surface'
              : 'bg-surfaceStep text-textFaint';

          const labelToneClass = isComplete
            ? 'font-semibold text-ink'
            : isActive
              ? 'font-bold text-ink'
              : 'font-medium text-textFaint';

          return (
            <li key={step.key}>
              <button
                type="button"
                disabled={!isClickable}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => isClickable && onStepClick(index)}
                className={`${rowBaseClass} ${
                  isClickable && !isActive ? 'hover:bg-surfaceHover' : ''
                } ${isClickable ? '' : 'opacity-60'}`}
              >
                <span className={`${nodeBaseClass} ${nodeToneClass}`}>
                  {isComplete ? (
                    <Icon name="check" size={13} strokeWidth={2.5} />
                  ) : step.icon ? (
                    <Icon name={step.icon} size={14} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className={`text-sm ${labelToneClass}`}>{step.label}</span>
              </button>
              {isLast ? null : (
                <span aria-hidden className="ml-5.5 block h-9 w-px bg-borderStep" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
