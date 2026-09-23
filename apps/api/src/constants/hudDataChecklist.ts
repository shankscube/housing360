/**
 * Plain-field context the checklist evaluates against — deliberately not the
 * Prisma `AssessmentRow`/`ClientRow`/`DisabilityRow` types themselves, since
 * `constants/` may not import from `models/` (the routes -> controllers ->
 * services -> models layering is lint-enforced; see
 * `packages/config/eslint/boundaries.js`). `case.service.ts` maps the real
 * rows into this shape before calling `check`.
 */
export interface HudDataChecklistContext {
  client: {
    veteranStatus: string | null;
    raceEthnicity: unknown;
  };
  /** Null when the case's enrollment has no Entry Assessment yet. */
  assessment: {
    situationCategory: string | null;
    incomeFromAnySource: string | null;
    benefitsFromAnySource: string | null;
    insuranceFromAnySource: string | null;
    generalHealthStatus: string | null;
    domesticViolenceSurvivor: string | null;
  } | null;
  disabilityCount: number;
}

interface HudDataChecklistDefinition {
  key: string;
  label: string;
  check: (ctx: HudDataChecklistContext) => boolean;
}

/**
 * Ordered list of HUD-required data points this case is evaluated against,
 * computed at request time (never persisted — see design.md's HUD Data
 * decision). Each maps to a field this repo already collects via the intake
 * wizard's Entry Assessment; a `false` here means that field was never
 * filled in, not that it failed validation.
 *
 * `disabilityStatus` can't yet distinguish "confirmed no disabilities" from
 * "never asked" — the intake wizard's "No known disabilities to record"
 * checkbox is a UI-only decision with no stored flag (same limitation
 * `client.service.ts`'s `sectionsWithValues` already documents for the
 * Entry Assessment's own sections).
 */
export const HUD_DATA_CHECKLIST: HudDataChecklistDefinition[] = [
  {
    key: 'livingSituation',
    label: 'Living Situation recorded',
    check: ({ assessment }) => assessment?.situationCategory != null,
  },
  {
    key: 'incomeAndBenefits',
    label: 'Income, Benefits & Insurance recorded',
    check: ({ assessment }) =>
      assessment?.incomeFromAnySource != null ||
      assessment?.benefitsFromAnySource != null ||
      assessment?.insuranceFromAnySource != null,
  },
  {
    key: 'healthAndDv',
    label: 'Health & Domestic Violence recorded',
    check: ({ assessment }) => assessment?.generalHealthStatus != null || assessment?.domesticViolenceSurvivor != null,
  },
  {
    key: 'disabilityStatus',
    label: 'Disability status recorded',
    check: ({ disabilityCount }) => disabilityCount > 0,
  },
  {
    key: 'veteranStatus',
    label: 'Veteran status recorded',
    check: ({ client }) => client.veteranStatus != null,
  },
  {
    key: 'raceEthnicity',
    label: 'Race and ethnicity recorded',
    check: ({ client }) => Array.isArray(client.raceEthnicity) && client.raceEthnicity.length > 0,
  },
];

/**
 * Rendered on the HUD Data tab from this single config value — never
 * hardcoded in a component. Wording (and whether this line survives into the
 * rebuild at all) is an explicit open item pending leadership/compliance
 * sign-off; this is a placeholder, not final copy. See this change's
 * design.md Open Questions.
 */
export const HUD_WORKSPACE_DISCLOSURE_TEXT =
  "This workspace is an operating layer. HUD reporting remains the certified HMIS's system of record.";
