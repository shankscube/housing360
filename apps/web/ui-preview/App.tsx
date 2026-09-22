import { kpiTilePreview } from './stories/KpiTile.stories';
import { statusBadgePreview } from './stories/StatusBadge.stories';
import { filterChipRowPreview } from './stories/FilterChipRow.stories';
import { dataTablePreview } from './stories/DataTable.stories';
import { pageHeaderPreview } from './stories/PageHeader.stories';
import { statusStepperPreview } from './stories/StatusStepper.stories';
import type { ComponentPreview } from './stories/types';

const PREVIEWS: ComponentPreview[] = [
  kpiTilePreview,
  statusBadgePreview,
  filterChipRowPreview,
  dataTablePreview,
  pageHeaderPreview,
  statusStepperPreview,
];

export function App() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white p-md">
        <h1 className="text-xl font-semibold text-neutral-900">Housing360 — Component Preview</h1>
        <nav className="mt-sm flex flex-wrap gap-md text-sm">
          {PREVIEWS.map((preview) => (
            <a key={preview.name} href={`#${preview.name}`} className="text-primary-700">
              {preview.name}
            </a>
          ))}
        </nav>
      </header>
      <main className="flex flex-col gap-xl p-lg">
        {PREVIEWS.map((preview) => (
          <section key={preview.name} id={preview.name}>
            <h2 className="text-lg font-semibold text-neutral-900">{preview.name}</h2>
            <div className="mt-md flex flex-col gap-md">
              {preview.variants.map((variant) => (
                <div key={variant.name} className="rounded-lg border border-neutral-200 bg-white p-lg">
                  <p className="mb-sm text-xs font-medium uppercase tracking-wide text-neutral-500">
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
