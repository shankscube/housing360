export interface StatusStepperStage {
  key: string;
  label: string;
  /**
   * Stages reachable from this one when it has more than one possible
   * terminal branch (e.g. a referral resolving to "Accepted" or "Declined").
   */
  branches?: StatusStepperStage[];
}

export interface StatusStepperProps {
  stages: StatusStepperStage[];
  currentStageKey: string;
}

const nodeBaseClass =
  'flex h-stepNode w-stepNode shrink-0 items-center justify-center rounded-full text-sm font-bold';
const labelBaseClass = 'whitespace-nowrap text-sm';

/**
 * Horizontal sequence of named stages: stages up to and including the current
 * one render as reached, later stages as unreached, and the connectors
 * between reached stages fill in.
 *
 * Terminal branches (the bundle's referral stepper resolves to "Rejected"
 * off the linear path) render after the sequence, marked with ✕ because they
 * are outcomes *off* the sequence rather than steps along it — which is the
 * bundle's own treatment. A branch that is the current stage takes the
 * terminal treatment.
 */
export function StatusStepper({ stages, currentStageKey }: StatusStepperProps) {
  const branches = stages.flatMap((stage) => stage.branches ?? []);
  const activeBranch = branches.find((branch) => branch.key === currentStageKey);
  const currentIndex = stages.findIndex((stage) => stage.key === currentStageKey);
  // While a branch is current, no linear stage counts as reached.
  const reachedThrough = activeBranch ? -1 : currentIndex;

  return (
    <div className="flex flex-wrap items-center">
      {stages.map((stage, index) => {
        const reached = index <= reachedThrough;
        const connectorReached = index < reachedThrough;
        const isLast = index === stages.length - 1 && branches.length === 0;

        return (
          <div key={stage.key} className="flex items-center">
            <div className="flex items-center gap-3.5">
              <span
                className={`${nodeBaseClass} ${
                  reached ? 'bg-teal text-ink' : 'bg-surfaceStep text-textFaint'
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`${labelBaseClass} ${
                  reached ? 'font-bold text-ink' : 'font-medium text-textFaint'
                }`}
              >
                {stage.label}
              </span>
            </div>
            {isLast ? null : <Connector reached={connectorReached} />}
          </div>
        );
      })}

      {branches.map((branch) => {
        const isCurrent = branch.key === currentStageKey;
        return (
          <div key={branch.key} className="flex items-center gap-3.5">
            <span
              className={`${nodeBaseClass} ${
                isCurrent ? 'bg-coral text-surface' : 'bg-surfaceStep text-textFaint'
              }`}
            >
              <span aria-hidden>✕</span>
            </span>
            <span
              className={`${labelBaseClass} ${
                isCurrent ? 'font-bold text-ink' : 'font-medium text-textFaint'
              }`}
            >
              {branch.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Connector({ reached }: { reached: boolean }) {
  return (
    <span
      aria-hidden
      className={`mx-6 inline-block h-0.5 w-stepConnector ${reached ? 'bg-teal' : 'bg-borderStep'}`}
    />
  );
}
