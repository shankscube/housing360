/** "Tuesday, September 24, 2026" — the Home screen's welcome-band subtitle. */
export function formatWelcomeDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTaskDueDate(value: string | null): string {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString();
}
