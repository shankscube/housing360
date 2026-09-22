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

/**
 * Reserved for the Referrals module (not yet implemented). The typed
 * interface above is the contract future work builds against; this file is
 * this directory's obvious home for that implementation.
 */
export function StatusStepper(_props: StatusStepperProps) {
  return null;
}
