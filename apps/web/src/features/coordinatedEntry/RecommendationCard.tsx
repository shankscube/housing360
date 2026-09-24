import type { CeAppliedOverride, CeAssessmentDetail } from '@housing360/types';
import { StatusBadge, type StatusTone } from '../../components/ui';

export interface RecommendationCardProps {
  assessment: CeAssessmentDetail;
}

/**
 * `CeScoreBand.badgeColor` (seeded as literal `'teal'|'gold'|'coral'` per
 * priority tier) is only exposed through the admin rule-CRUD types — none of
 * the client-facing endpoints this feature calls (`POST /api/ce/assessments`,
 * `GET /api/ce/assessments/:id`, `GET /api/ce/clients/:id/recommendation`)
 * return it. Since the band name itself already carries the tier
 * ("Low/Medium/High Priority" in the seed data), we infer a tone from the
 * name's own text rather than introduce a second fetch or an inline color —
 * this happens to reproduce the actual seeded colors, but is a text
 * heuristic, not a read of the real `badgeColor` value.
 */
function bandTone(bandName: string | null): StatusTone | undefined {
  if (!bandName) return undefined;
  const normalized = bandName.toLowerCase();
  if (normalized.includes('high')) return 'coral';
  if (normalized.includes('medium')) return 'gold';
  if (normalized.includes('low')) return 'teal';
  return undefined;
}

function overrideFlagLabel(flag: string): string {
  if (flag === 'veteran') return 'Veteran';
  if (flag === 'unaccompaniedYouth') return 'Unaccompanied Youth';
  if (flag === 'safetyAlert') return 'Safety Alert';
  return flag;
}

function OverrideMarker({ override }: { override: CeAppliedOverride }) {
  return (
    <span className="rounded-md bg-navyTint px-3.5 py-1.5 text-xs font-semibold text-ink">
      {overrideFlagLabel(override.flag)} override applied ({override.behavior})
    </span>
  );
}

/**
 * Shown once a `CeAssessment` exists for the client in this flow (10.2) —
 * persists across steps 2-4 so the score/band/overrides/suppression state
 * stays visible while those steps are worked through.
 */
export function RecommendationCard({ assessment }: RecommendationCardProps) {
  const { totalScore, bandName, appliedOverrides, referralSuppressed, externalReferralMessage } = assessment;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-borderRow bg-surfaceMuted p-7">
      <div>
        <h3 className="font-display text-base text-ink">Coordinated Entry Recommendation</h3>
        <p className="mt-1 text-xs text-textMuted">
          Score-based routing per the Coordinated Entry scoring model.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <span className="font-display text-3xl font-semibold text-ink">{totalScore}</span>
        {bandName ? <StatusBadge label={bandName} tone={bandTone(bandName)} /> : null}
      </div>

      {appliedOverrides.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {appliedOverrides.map((override) => (
            <OverrideMarker key={override.flag} override={override} />
          ))}
        </div>
      ) : null}

      {referralSuppressed ? (
        <div className="rounded-lg border border-coral bg-coralTint p-5">
          <p className="text-sm font-semibold text-coralDeep">Safety Alert — Referral Suppressed</p>
          <p className="mt-1 text-sm text-ink">
            {externalReferralMessage ??
              'Referral to an external partner is suppressed for this client. Follow internal safety protocol instead.'}
          </p>
        </div>
      ) : null}
    </div>
  );
}
