import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppointmentItem } from '@housing360/types';
import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { Icon } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAppointments } from '../../store/slices/calendarSlice';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_IN_GRID = 42;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** The 42 days (6 full weeks) making up the visible month grid, always starting on a Sunday. */
function getMonthGridDays(visibleMonth: Date): Date[] {
  const firstOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());

  const days: Date[] = [];
  for (let i = 0; i < DAYS_IN_GRID; i += 1) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    days.push(day);
  }
  return days;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function CalendarPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { appointments, status } = useAppSelector((state) => state.calendar);

  const [visibleMonth, setVisibleMonth] = useState(() => startOfDay(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => startOfDay(new Date()));

  const gridDays = useMemo(() => getMonthGridDays(visibleMonth), [visibleMonth]);

  useEffect(() => {
    const gridStart = gridDays[0]!;
    const gridEnd = gridDays[gridDays.length - 1]!;
    const to = new Date(gridEnd);
    to.setDate(to.getDate() + 1);

    dispatch(fetchAppointments({ from: gridStart.toISOString(), to: to.toISOString() }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, visibleMonth]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, AppointmentItem[]>();
    for (const appointment of appointments) {
      const key = startOfDay(new Date(appointment.dueDate)).toDateString();
      const existing = map.get(key);
      if (existing) {
        existing.push(appointment);
      } else {
        map.set(key, [appointment]);
      }
    }
    return map;
  }, [appointments]);

  function appointmentsFor(day: Date): AppointmentItem[] {
    return appointmentsByDay.get(day.toDateString()) ?? [];
  }

  function handlePrevMonth() {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  const selectedDayAppointments = selectedDay ? appointmentsFor(selectedDay) : [];

  return (
    <ContentAreaTemplate title="Calendar" subtitle="Case follow-ups by day.">
      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
        <div className="flex flex-col gap-6 px-9 py-7">
          <div className="flex items-center justify-between gap-4">
            <span className="font-display text-lg text-ink">{formatMonthLabel(visibleMonth)}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Previous month"
                onClick={handlePrevMonth}
                className="rounded-sm p-2 text-textMuted transition-colors hover:bg-surfaceSubtle hover:text-ink"
              >
                <Icon name="chevronLeft" size={14} />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={handleNextMonth}
                className="rounded-sm p-2 text-textMuted transition-colors hover:bg-surfaceSubtle hover:text-ink"
              >
                <Icon name="chevronRight" size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="px-2 py-1 text-center text-2xs font-semibold uppercase tracking-wide text-textMuted"
              >
                {label}
              </div>
            ))}
            {gridDays.map((day) => {
              const inVisibleMonth = day.getMonth() === visibleMonth.getMonth();
              const dayAppointments = appointmentsFor(day);
              const hasAppointments = dayAppointments.length > 0;
              const isSelected = selectedDay !== null && isSameDay(day, selectedDay);
              const isToday = isSameDay(day, startOfDay(new Date()));

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`flex aspect-square flex-col items-center justify-start gap-1 rounded-md border p-2 text-left transition-colors ${
                    isSelected
                      ? 'border-ink bg-surfaceSubtle'
                      : 'border-borderRow bg-surface hover:bg-surfaceSubtle'
                  } ${inVisibleMonth ? 'text-ink' : 'text-textMuted'}`}
                >
                  <span className={`text-sm ${isToday ? 'font-semibold text-tealDeep' : ''}`}>
                    {day.getDate()}
                  </span>
                  {hasAppointments ? <span className="h-2 w-2 rounded-full bg-teal" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-borderRow px-9 py-7">
          <h3 className="mb-4 text-sm font-semibold text-ink">
            {selectedDay
              ? selectedDay.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Select a day'}
          </h3>

          {status === 'loading' ? (
            <p className="text-sm text-textMuted">Loading…</p>
          ) : selectedDay && selectedDayAppointments.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {selectedDayAppointments.map((appointment) => (
                <li key={appointment.caseId}>
                  <button
                    type="button"
                    onClick={() => navigate(`/cases/${appointment.caseId}`)}
                    className="flex w-full items-center justify-between rounded-md border border-borderRow px-5 py-3 text-left transition-colors hover:bg-surfaceSubtle"
                  >
                    <span className="text-sm text-ink">
                      {appointment.caseNumber} — {appointment.clientName}
                    </span>
                    <span className="text-sm text-textMuted">{appointment.milestone}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-textMuted">No follow-ups scheduled for this day.</p>
          )}
        </div>
      </div>
    </ContentAreaTemplate>
  );
}
