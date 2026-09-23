export interface HudOption {
  value: string;
  label: string;
}

/** `GET /api/reference/hud-options` response shape — one map, keyed by list name. */
export type HudOptionsResponse = Record<string, HudOption[]>;
