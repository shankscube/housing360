import { Button, useToast } from '../../../components/ui';

export interface Step2RecommendedProgramsProps {
  recommendedProjectTypes: string[];
  selectedProjectType: string | null;
  onSelectProjectType: (projectType: string) => void;
  referralSuppressed: boolean;
  onComplete: () => void;
}

/**
 * `Program.projectTypeCode` has no served reference list anywhere in the API
 * (design.md's own open item on the HUD 2.02 project-type taxonomy) — this
 * mirrors `Step3PartnerAgencies`' pre-existing `SERVICE_DOMAINS` precedent of
 * a small local label map for an operational vocabulary that isn't a served
 * HUD option list, with a raw-code fallback for anything unmapped.
 */
const PROJECT_TYPE_LABELS: Record<string, string> = {
  RRH: 'Rapid Re-Housing',
  PSH: 'Permanent Supportive Housing',
  ES: 'Emergency Shelter',
  TH: 'Transitional Housing',
};

function projectTypeLabel(code: string): string {
  return PROJECT_TYPE_LABELS[code] ?? code;
}

/**
 * Picks one of the score band's recommended project types (from the prior
 * step's `CeAssessmentDetail`/`ClientRecommendation`). The concrete
 * program/partner-agency picker with live address + bed data is Step 3 —
 * this step only narrows by project type.
 */
export function Step2RecommendedPrograms({
  recommendedProjectTypes,
  selectedProjectType,
  onSelectProjectType,
  referralSuppressed,
  onComplete,
}: Step2RecommendedProgramsProps) {
  const { showToast } = useToast();

  if (referralSuppressed) {
    return (
      <p className="text-sm text-textMuted">
        This step is unavailable — see the Coordinated Entry Recommendation above for next steps.
      </p>
    );
  }

  function handleNext() {
    if (!selectedProjectType) {
      showToast('Select a recommended project type to continue.');
      return;
    }
    onComplete();
  }

  if (recommendedProjectTypes.length === 0) {
    return <p className="text-sm text-textMuted">No project types currently have eligible programs.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-textMuted">
        Recommended based on this client&apos;s Coordinated Entry score:
      </p>

      <div className="flex flex-col gap-3">
        {recommendedProjectTypes.map((code) => (
          <label
            key={code}
            className="flex items-center gap-3 rounded-lg border border-borderRow px-5 py-3.5 text-sm text-ink"
          >
            <input
              type="radio"
              name="recommended-project-type"
              checked={selectedProjectType === code}
              onChange={() => onSelectProjectType(code)}
            />
            {projectTypeLabel(code)}
          </label>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleNext}>
          Continue to Partner Agencies
        </Button>
      </div>
    </div>
  );
}
