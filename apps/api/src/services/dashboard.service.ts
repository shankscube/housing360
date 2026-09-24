import type { HomeDashboardResponse } from '@housing360/types';
import { findActiveCaseloadClientIds } from '../models/case.model';
import { countClientsCreatedSince } from '../models/client.model';
import { countOpenReferrals } from '../models/referral.model';
import { countAssessmentsDueOrOverdue } from '../models/assessment.model';
import { countTasksDueTodayForOwner, findTasksDueOrOverdueForOwner } from '../models/task.model';
import { getDataQualityAlertsForHome } from './dataQualityIssue.service';

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/**
 * One aggregate read for the Home screen — every tile/panel is computed by
 * reusing the owning module's own query predicates (case.model.ts's
 * `myCaseload` scoping, assessment.model.ts's `dueTodayWhere`/`overdueWhere`,
 * referral.model.ts's open-status vocabulary) rather than re-deriving them,
 * per home-dashboard design.md Decision 1.
 */
export async function getHomeDashboard(
  requestingUserId: number,
  requestingUserFirstName: string
): Promise<HomeDashboardResponse> {
  const [caseloadClientIds, openReferrals, assessmentsDue, tasksDueTodayCount, homeTasks, dataQualityAlerts] =
    await Promise.all([
      findActiveCaseloadClientIds(requestingUserId),
      countOpenReferrals(),
      countAssessmentsDueOrOverdue(),
      countTasksDueTodayForOwner(requestingUserId),
      findTasksDueOrOverdueForOwner(requestingUserId),
      getDataQualityAlertsForHome(),
    ]);

  const newThisMonth = await countClientsCreatedSince(caseloadClientIds, startOfCurrentMonth());
  const todayStart = startOfDay(new Date());
  const assessmentsDueTotal = assessmentsDue.dueToday + assessmentsDue.overdue;

  return {
    caseManagerFirstName: requestingUserFirstName,
    kpis: {
      activeCaseload: {
        value: caseloadClientIds.length,
        subLine: `+${newThisMonth} created this month`,
      },
      openReferrals: {
        value: openReferrals,
        subLine: `${pluralize(openReferrals, 'referral')} pending review`,
      },
      tasksDueToday: {
        value: tasksDueTodayCount,
        subLine: tasksDueTodayCount === 0 ? 'Nothing due today' : `${pluralize(tasksDueTodayCount, 'task')} due today`,
      },
      assessmentsDue: {
        value: assessmentsDueTotal,
        subLine: assessmentsDue.overdue > 0 ? 'Requires immediate completion' : 'None overdue',
      },
    },
    todaysTasks: homeTasks.map((task) => ({
      id: task.id,
      title: task.subject,
      contextLine: `${task.client.firstName} ${task.client.lastName}`,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      overdue: Boolean(task.dueDate && task.dueDate < todayStart),
    })),
    dataQualityAlerts,
    todaysAppointments: [],
    recentlyAssessed: [],
  };
}
