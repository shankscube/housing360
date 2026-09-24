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
  /** Always empty — Today's Appointments has no backing data source yet. */
  todaysAppointments: [];
  /** Always empty — Recently Assessed has no backing data source yet. */
  recentlyAssessed: [];
}
