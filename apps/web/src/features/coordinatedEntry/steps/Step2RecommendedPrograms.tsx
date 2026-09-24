import { useEffect } from 'react';
import { Button, useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchRecommendedPrograms } from '../../../store/slices/coordinatedEntrySlice';

export interface Step2RecommendedProgramsProps {
  clientId: string;
  selectedProgramId: string | null;
  onSelectProgram: (programId: string) => void;
  onComplete: () => void;
}

export function Step2RecommendedPrograms({
  clientId,
  selectedProgramId,
  onSelectProgram,
  onComplete,
}: Step2RecommendedProgramsProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { data: programs, status } = useAppSelector((state) => state.coordinatedEntry.recommendedPrograms);

  useEffect(() => {
    dispatch(fetchRecommendedPrograms(clientId));
  }, [dispatch, clientId]);

  function handleNext() {
    if (!selectedProgramId) {
      showToast('Select a recommended program type to continue.');
      return;
    }
    onComplete();
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-textMuted">
        Recommended based on this client&apos;s vulnerability priority tier:
      </p>

      {status === 'loading' ? (
        <p className="text-sm text-textMuted">Loading recommended programs…</p>
      ) : programs.length === 0 ? (
        <p className="text-sm text-textMuted">No recommended programs found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {programs.map((program) => (
            <label
              key={program.id}
              className="flex items-center gap-3 rounded-lg border border-borderRow px-5 py-3.5 text-sm text-ink"
            >
              <input
                type="radio"
                name="recommended-program"
                checked={selectedProgramId === program.id}
                onChange={() => onSelectProgram(program.id)}
              />
              {program.name}
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleNext}>
          Continue to Partner Agencies
        </Button>
      </div>
    </div>
  );
}
