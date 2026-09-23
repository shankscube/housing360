import { Button, Icon } from '../../../components/ui';
import { useAppDispatch } from '../../../store/hooks';
import { setCurrentStep, setPhase } from '../../../store/slices/intakeSlice';

export interface FinishedPhaseProps {
  clientId: string;
  onViewClient: (clientId: string) => void;
  onDone: () => void;
}

/**
 * The wizard's closing panel — shown once step 8 saves. "Back" returns to
 * the 8-step form (step 8) rather than re-running any finish logic; "View
 * client record" and "Done" are handed to the shell via props (see
 * design.md's `onViewClient` stand-in decision — there is no client-detail
 * route yet, so the shell decides what "viewing" means).
 */
export function FinishedPhase({ clientId, onViewClient, onDone }: FinishedPhaseProps) {
  const dispatch = useAppDispatch();

  function handleBack() {
    dispatch(setCurrentStep(8));
    dispatch(setPhase('form'));
  }

  return (
    <div className="flex flex-col items-center gap-7 px-9 py-14 text-center">
      <span className="flex h-24 w-24 items-center justify-center rounded-full bg-tealTint">
        <Icon name="check" size={36} strokeWidth={2.5} className="text-tealDeep" />
      </span>

      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl text-ink">Intake Complete</h2>
        <p className="text-sm text-textMuted">
          The client&apos;s intake has been recorded, including household, program enrollment,
          Entry Assessment, disabilities, and interaction summary data.
        </p>
      </div>

      <div className="flex gap-4">
        <Button variant="tertiary" size="md" onClick={handleBack}>
          Back
        </Button>
        <Button variant="secondary" size="md" onClick={() => onViewClient(clientId)}>
          View client record
        </Button>
        <Button variant="primary" size="md" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
