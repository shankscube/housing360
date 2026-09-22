import type { ReactNode } from 'react';
import { PageHeader, KpiTile, type PageHeaderAction, type KpiTileProps } from '../ui';

export interface ContentAreaTemplateProps {
  title: string;
  actions?: PageHeaderAction[];
  /** Optional KPI row rendered between the title band and the main content. */
  kpiTiles?: KpiTileProps[];
  children: ReactNode;
}

/**
 * Page-title band → optional KPI tile row → main content. Every routed
 * screen mounts inside this instead of rebuilding the layout itself.
 */
export function ContentAreaTemplate({ title, actions, kpiTiles, children }: ContentAreaTemplateProps) {
  return (
    <div className="flex flex-col gap-lg p-lg">
      <PageHeader title={title} actions={actions} />
      {kpiTiles && kpiTiles.length > 0 ? (
        <div className="flex flex-wrap gap-md">
          {kpiTiles.map((tile) => (
            <KpiTile key={tile.label} {...tile} />
          ))}
        </div>
      ) : null}
      <div>{children}</div>
    </div>
  );
}
