import { iconPreview } from './stories/Icon.stories';
import { buttonPreview } from './stories/Button.stories';
import { kpiTilePreview } from './stories/KpiTile.stories';
import { statusBadgePreview } from './stories/StatusBadge.stories';
import { filterChipRowPreview } from './stories/FilterChipRow.stories';
import { dataTablePreview } from './stories/DataTable.stories';
import { pageHeaderPreview } from './stories/PageHeader.stories';
import { statusStepperPreview } from './stories/StatusStepper.stories';
import { gatedFieldPreview } from './stories/GatedField.stories';
import { dualListboxPreview } from './stories/DualListbox.stories';
import { stepRailPreview } from './stories/StepRail.stories';
import { tabsPreview } from './stories/Tabs.stories';
import { modalPreview } from './stories/Modal.stories';
import { expandableRowPreview } from './stories/ExpandableRow.stories';
import { signaturePadPreview } from './stories/SignaturePad.stories';
import { listCardPreview } from './stories/ListCard.stories';
import type { ComponentPreview } from './stories/types';

const PREVIEWS: ComponentPreview[] = [
  iconPreview,
  buttonPreview,
  kpiTilePreview,
  statusBadgePreview,
  filterChipRowPreview,
  dataTablePreview,
  pageHeaderPreview,
  statusStepperPreview,
  gatedFieldPreview,
  dualListboxPreview,
  stepRailPreview,
  tabsPreview,
  modalPreview,
  expandableRowPreview,
  signaturePadPreview,
  listCardPreview,
];

/**
 * Served by Vite from `apps/web`, so the repo root is two levels up. Opens the
 * design bundle in a new tab for a side-by-side comparison.
 */
const BUNDLE_PATH = '../../docs/Housing360 Portal.html';

export function App() {
  return (
    <div className="min-h-screen bg-surfaceApp">
      <header className="bg-surface px-14 pb-9 pt-12 shadow-card">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Housing360 — Component Preview
        </h1>
        <p className="mt-2.5 text-sm text-textMuted">
          Each section names the part of the design bundle it mirrors.{' '}
          <a
            href={BUNDLE_PATH}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-tealDeep underline"
          >
            Open docs/Housing360 Portal.html
          </a>{' '}
          in a second window to compare side by side.
        </p>
        <nav className="mt-7 flex flex-wrap gap-6 text-sm">
          {PREVIEWS.map((preview) => (
            <a
              key={preview.name}
              href={`#${preview.name}`}
              className="font-semibold text-textMuted transition-colors hover:text-tealDeep"
            >
              {preview.name}
            </a>
          ))}
        </nav>
      </header>

      <main className="flex flex-col gap-14 px-14 pb-24 pt-11">
        {PREVIEWS.map((preview) => (
          <section key={preview.name} id={preview.name}>
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
              {preview.name}
            </h2>
            <p className="mt-2 text-sm text-textMuted">
              <span className="font-semibold uppercase tracking-wide text-textFaint">
                Bundle reference:{' '}
              </span>
              {preview.reference}
            </p>
            <div className="mt-7 flex flex-col gap-7">
              {preview.variants.map((variant) => (
                <div key={variant.name} className="rounded-2xl bg-surface p-10 shadow-card">
                  <p className="mb-7 text-2xs font-semibold uppercase tracking-wide text-textMuted">
                    {variant.name}
                  </p>
                  {variant.element}
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
