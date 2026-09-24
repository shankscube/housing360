import type { AssessmentEligibility } from '@housing360/types';
import { assessmentTypeToStage } from '../constants/assessmentTypes';
import { findAssessmentsForEligibility, type EligibilityAssessmentRow } from '../models/assessment.model';
import { findEnrollmentById } from '../models/enrollment.model';
import { AppError } from '../utils/AppError';

const ENTRY_STAGE = assessmentTypeToStage('entry');
const ANNUAL_STAGE = assessmentTypeToStage('annual');
const EXIT_STAGE = assessmentTypeToStage('exit');
const COMPLETED_STATUS = 'completed';
const EXITED_ENROLLMENT_STATUS = 'exited';
const ANNUAL_WINDOW_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

/**
 * Every anniversary of `startDate` around `today`'s year, checked to find
 * whichever one `today` currently falls within ±30 days of. HUD-standard
 * rule, not yet confirmed against the source org — see design.md Decision 2
 * / Open Questions.
 */
function nearestAnniversaryWindow(
  startDate: Date,
  today: Date
): { windowStart: Date; windowEnd: Date } | null {
  const yearsElapsed = today.getFullYear() - startDate.getFullYear();
  for (const offset of [yearsElapsed - 1, yearsElapsed, yearsElapsed + 1]) {
    if (offset < 1) continue; // no anniversary before the enrollment's first year
    const anniversary = new Date(startDate);
    anniversary.setFullYear(startDate.getFullYear() + offset);
    if (Math.abs(daysBetween(today, anniversary)) <= ANNUAL_WINDOW_DAYS) {
      return { windowStart: addDays(anniversary, -ANNUAL_WINDOW_DAYS), windowEnd: addDays(anniversary, ANNUAL_WINDOW_DAYS) };
    }
  }
  return null;
}

/** Draft = any non-`completed` assessment. Multiple drafts for the same stage
 * shouldn't normally happen, but if they do, the most recent one wins. */
function latestDraftForStage(
  assessments: EligibilityAssessmentRow[],
  stage: number
): EligibilityAssessmentRow | undefined {
  return assessments
    .filter((row) => row.dataCollectionStage === stage && row.status !== COMPLETED_STATUS)
    .sort((a, b) => b.assessmentDate.getTime() - a.assessmentDate.getTime())[0];
}

/**
 * Given a program enrollment, returns every HUD stage (Entry/Update/Annual/
 * Exit) with whether starting one is currently allowed, a human-readable
 * reason, and — when an unfinished draft already exists for that stage — its
 * id, so the UI offers "Resume Draft" instead of a second assessment of that
 * stage (design.md Decision 2 / the "Unfinished Draft Forces Resume" spec
 * requirement). This is the one place these rules live; nothing else should
 * re-derive eligibility inline.
 *
 * `update` has no dedicated `dataCollectionStage` in this schema — only
 * entry(1)/annual(2)/exit(3) are tracked (`constants/assessmentTypes.ts`), a
 * deliberate carry-over from the prior change's stage-mapping simplification
 * that this change was explicitly told not to disturb (no stage code 5). So
 * `update`'s eligibility is computed purely from Entry/Exit state, with no
 * draft/resume concept — there's no stage number to look a draft row up
 * against. Actually creating a distinct "Update Assessment" record is out of
 * scope for this service and is flagged in this task's final report as an
 * open item for a future schema change.
 */
export async function getAssessmentEligibility(programEnrollmentId: string): Promise<AssessmentEligibility[]> {
  const enrollment = await findEnrollmentById(programEnrollmentId);
  if (!enrollment) {
    throw new AppError(404, 'Program enrollment not found');
  }
  const assessments = await findAssessmentsForEligibility(programEnrollmentId);
  const results: AssessmentEligibility[] = [];

  // Entry — allowed only when no Entry assessment (draft or completed) exists at all.
  const entryDraft = latestDraftForStage(assessments, ENTRY_STAGE);
  const entryCompleted = assessments.find(
    (row) => row.dataCollectionStage === ENTRY_STAGE && row.status === COMPLETED_STATUS
  );
  if (entryDraft) {
    results.push({
      stage: 'entry',
      allowed: false,
      reason: 'A draft Entry assessment already exists for this enrollment.',
      draftAssessmentId: entryDraft.id,
    });
  } else if (entryCompleted) {
    results.push({ stage: 'entry', allowed: false, reason: 'An Entry assessment already exists for this enrollment.' });
  } else {
    results.push({ stage: 'entry', allowed: true, reason: 'No Entry assessment has been recorded yet.' });
  }

  // Update — allowed any time after an Entry assessment exists and before an
  // Exit assessment completes. See this function's header comment for why it
  // carries no draftAssessmentId.
  const entryExists = Boolean(entryDraft) || Boolean(entryCompleted);
  const exitCompleted = assessments.find(
    (row) => row.dataCollectionStage === EXIT_STAGE && row.status === COMPLETED_STATUS
  );
  if (!entryExists) {
    results.push({ stage: 'update', allowed: false, reason: 'Record an Entry assessment before an Update assessment.' });
  } else if (exitCompleted) {
    results.push({ stage: 'update', allowed: false, reason: 'This enrollment has already exited.' });
  } else {
    results.push({ stage: 'update', allowed: true, reason: 'Available any time between Entry and Exit.' });
  }

  // Annual — draft-forces-resume takes priority over the window computation;
  // otherwise allowed only within ±30 days of a start-date anniversary, once per window.
  const annualDraft = latestDraftForStage(assessments, ANNUAL_STAGE);
  if (annualDraft) {
    results.push({
      stage: 'annual',
      allowed: false,
      reason: 'A draft Annual assessment already exists for this enrollment.',
      draftAssessmentId: annualDraft.id,
    });
  } else {
    const window = nearestAnniversaryWindow(enrollment.startDate, new Date());
    if (!window) {
      results.push({
        stage: 'annual',
        allowed: false,
        reason: 'Outside the annual reassessment window (30 days before/after an enrollment anniversary).',
      });
    } else {
      const completedInWindow = assessments.find(
        (row) =>
          row.dataCollectionStage === ANNUAL_STAGE &&
          row.status === COMPLETED_STATUS &&
          row.assessmentDate >= window.windowStart &&
          row.assessmentDate <= window.windowEnd
      );
      if (completedInWindow) {
        results.push({ stage: 'annual', allowed: false, reason: 'An Annual assessment has already been completed for this window.' });
      } else {
        results.push({ stage: 'annual', allowed: true, reason: 'Within the annual reassessment window.' });
      }
    }
  }

  // Exit — allowed only once, only while the enrollment hasn't already exited.
  const exitDraft = latestDraftForStage(assessments, EXIT_STAGE);
  if (exitDraft) {
    results.push({
      stage: 'exit',
      allowed: false,
      reason: 'A draft Exit assessment already exists for this enrollment.',
      draftAssessmentId: exitDraft.id,
    });
  } else if (exitCompleted || enrollment.status === EXITED_ENROLLMENT_STATUS) {
    results.push({ stage: 'exit', allowed: false, reason: 'This enrollment has already exited.' });
  } else {
    results.push({ stage: 'exit', allowed: true, reason: 'No Exit assessment has been recorded yet.' });
  }

  return results;
}
