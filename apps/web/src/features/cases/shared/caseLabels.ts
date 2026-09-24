/** `open` (the default `cases/ensure` assigns) reads as "Active" until a case manager explicitly moves it along — see `cases-screen`'s design.md. */
export function caseStatusLabel(status: string): string {
  if (status === 'open' || status === 'active') return 'Active';
  if (status === 'pending_review') return 'Pending Review';
  if (status === 'closed') return 'Closed';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function casePriorityLabel(priority: string | null): string | null {
  if (!priority) return null;
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function caseOptionLabel(value: string | null): string {
  if (!value) return '—';
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
