import type { AppointmentItem } from './appointments';
import type { RecentActivityItem } from './activity';

export interface HomeKpiTile {
  value: number;
  subLine: string;
}

export interface HomeTaskItem {
  id: string;
  title: string;
  contextLine: string;
  dueDate: string | null;
  overdue: boolean;
}

/**
 * PROVISIONAL — backed by the minimal `DataQualityIssue` read model, a
 * stand-in for a future real Data Quality rule engine. See
 * `dataQualityIssue.service.ts`'s header comment and
 * openspec/changes/home-dashboard/design.md Decision 3.
 */
export interface HomeDataQualityAlertItem {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  daysOpen: number;
}

export interface HomeDashboardResponse {
  caseManagerFirstName: string;
  kpis: {
    activeCaseload: HomeKpiTile;
    openReferrals: HomeKpiTile;
    tasksDueToday: HomeKpiTile;
    assessmentsDue: HomeKpiTile;
  };
  todaysTasks: HomeTaskItem[];
  /** PROVISIONAL — see `HomeDataQualityAlertItem`. */
  dataQualityAlerts: HomeDataQualityAlertItem[];
  /** Cases the requesting case manager manages with a follow-up due today — see `AppointmentItem` (appointments.ts). */
  todaysAppointments: AppointmentItem[];
  /**
   * The requesting user's 5 newest distinct-record activity items (client,
   * case, referral, or assessment) — see `RecentActivityItem` (activity.ts).
   * Renamed from the `home-dashboard`-era `recentlyAssessed` (which was
   * always `[]`) now that this panel covers every record type, not just
   * assessments — see `home-workspace` design.md Decision 6.
   */
  recentlyAccessed: RecentActivityItem[];
}
