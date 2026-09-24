import { useEffect } from 'react';
import type { RecommendedProgram } from '@housing360/types';
import { Button, useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchRecommendedPrograms } from '../../../store/slices/coordinatedEntrySlice';

export interface Step3PartnerAgenciesProps {
  projectType: string | null;
  selectedProgram: RecommendedProgram | null;
  onSelectProgram: (program: RecommendedProgram) => void;
  referralSuppressed: boolean;
  onBack: () => void;
  onComplete: () => void;
}

/**
 * Lists the concrete programs (partner agencies) for the project type chosen
 * in Step 2, via `GET /api/ce/recommended-programs?projectType=` — each row
 * now carries its operating organization's address and a live available-bed
 * count, both rendered here (10.3).
 */
export function Step3PartnerAgencies({
  projectType,
  selectedProgram,
  onSelectProgram,
  referralSuppressed,
  onBack,
  onComplete,
}: Step3PartnerAgenciesProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { data: programs, status } = useAppSelector((state) => state.coordinatedEntry.recommendedPrograms);

  useEffect(() => {
    if (projectType) {
      dispatch(fetchRecommendedPrograms(projectType));
    }
  }, [dispatch, projectType]);

  if (referralSuppressed) {
    return (
      <p className="text-sm text-textMuted">
        This step is unavailable — see the Coordinated Entry Recommendation above for next steps.
      </p>
    );
  }

  function handleNext() {
    if (!selectedProgram) {
      showToast('Select a partner agency to continue.');
      return;
    }
    onComplete();
  }

  return (
    <div className="flex flex-col gap-5">
      {status === 'loading' ? (
        <p className="text-sm text-textMuted">Loading partner agencies…</p>
      ) : programs.length === 0 ? (
        <p className="text-sm text-textMuted">No project types currently have eligible programs.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {programs.map((program) => (
            <label
              key={program.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-borderRow px-5 py-3.5"
            >
              <span className="flex items-start gap-3 text-sm text-ink">
                <input
                  type="radio"
                  name="partner-agency"
                  className="mt-1"
                  checked={selectedProgram?.id === program.id}
                  onChange={() => onSelectProgram(program)}
                />
                <span className="flex flex-col">
                  <span className="font-semibold">{program.name}</span>
                  <span className="text-xs text-textMuted">
                    {program.operatingOrganization?.name ?? 'Unassigned organization'}
                    {program.operatingOrganization?.address ? ` — ${program.operatingOrganization.address}` : ''}
                  </span>
                </span>
              </span>
              <span className="whitespace-nowrap text-xs font-semibold text-textMuted">
                {program.availableBedCount} bed{program.availableBedCount === 1 ? '' : 's'} available
              </span>
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="tertiary" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" onClick={handleNext} disabled={programs.length === 0}>
          Continue to Send Referral
        </Button>
      </div>
    </div>
  );
}
