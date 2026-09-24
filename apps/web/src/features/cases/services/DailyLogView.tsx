import { useEffect } from 'react';
import type { BedAssignment, BedNight } from '@housing360/types';
import { Modal, StatusBadge } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchBedNights, logBedNight, updateBedNight } from '../../../store/slices/servicesSlice';

export interface DailyLogViewProps {
  isOpen: boolean;
  onClose: () => void;
  bedAssignment: BedAssignment;
}

const WINDOW_DAYS = 14;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildWindow(startDate: string): Date[] {
  const start = new Date(startDate);
  return Array.from({ length: WINDOW_DAYS }, (_, i) => new Date(start.getTime() + i * 24 * 60 * 60 * 1000));
}

export function DailyLogView({ isOpen, onClose, bedAssignment }: DailyLogViewProps) {
  const dispatch = useAppDispatch();
  const nights = useAppSelector((state) => state.services.bedNightsByAssignment[bedAssignment.id]) ?? [];

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchBedNights(bedAssignment.id));
    }
  }, [isOpen, bedAssignment.id, dispatch]);

  const nightsByDate = new Map<string, BedNight>();
  nights.forEach((night) => nightsByDate.set(night.logDate.slice(0, 10), night));

  function handleCellClick(dateKey: string) {
    const existing = nightsByDate.get(dateKey);
    if (existing) {
      const nextStatus = existing.status === 'Present' ? 'Absent' : 'Present';
      dispatch(updateBedNight({ id: existing.id, status: nextStatus }));
    } else {
      dispatch(logBedNight({ bedAssignmentId: bedAssignment.id, logDate: dateKey, shift: bedAssignment.shift, status: 'Present' }));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Daily Log — ${bedAssignment.bedIdentifier}`} size="lg">
      <div className="flex flex-col gap-7">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-textMuted">
            Click a night to log it Present, click again to mark Absent
          </p>
          <div className="grid grid-cols-7 gap-2">
            {buildWindow(bedAssignment.startDate).map((date) => {
              const dateKey = toDateKey(date);
              const night = nightsByDate.get(dateKey);
              const toneClass =
                night?.status === 'Present'
                  ? 'bg-teal text-ink'
                  : night?.status === 'Absent'
                    ? 'bg-coralTint text-coralDeep'
                    : 'bg-surfaceMuted text-textMuted';
              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => handleCellClick(dateKey)}
                  className={`rounded-lg px-2 py-3 text-center text-xs font-semibold transition-colors ${toneClass}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-textMuted">Recent Daily Logs</p>
          {nights.length === 0 ? (
            <p className="text-sm text-textMuted">No nights logged yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {nights.map((night) => (
                <li key={night.id} className="flex items-center justify-between rounded-lg border border-borderRow px-4 py-3">
                  <span className="text-sm text-ink">{new Date(night.logDate).toLocaleDateString()}</span>
                  <span className="text-xs text-textMuted">{night.shift}</span>
                  <StatusBadge label={night.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
