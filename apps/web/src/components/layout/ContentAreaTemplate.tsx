import type { ReactNode } from 'react';
import { PageHeader, KpiTile, type PageHeaderAction, type KpiTileProps } from '../ui';

export interface ContentAreaTemplateProps {
  title: string;
  /** Muted line under the title — the bundle carries one on every screen. */
  subtitle?: string;
  actions?: PageHeaderAction[];
  /** Optional KPI row rendered between the title band and the main content. */
  kpiTiles?: KpiTileProps[];
  children: ReactNode;
}

/**
 * Page-title band → optional KPI tile row → main content. Every routed
 * screen mounts inside this instead of rebuilding the layout itself.
 */
export function ContentAreaTemplate({
  title,
  subtitle,
  actions,
  kpiTiles,
  children,
}: ContentAreaTemplateProps) {
  return (
    <div className="flex flex-col gap-10 px-14 pb-24 pt-2">
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      {kpiTiles && kpiTiles.length > 0 ? (
        <div className="flex flex-wrap gap-7">
          {kpiTiles.map((tile) => (
            <KpiTile key={tile.label} {...tile} />
          ))}
        </div>
      ) : null}
      <div>{children}</div>
    </div>
  );
}
