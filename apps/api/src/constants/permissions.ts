/**
 * Minimal permission map — the smallest thing that lets us gate
 * `ce:manage-rules` (Coordinated Entry rule administration: questions,
 * answer options, score bands, flag overrides). This is NOT a
 * general-purpose role/permission management system — no role-management UI,
 * no multi-role-per-user, no scoped resource permissions. See
 * `assessment-and-ce-workspace`'s design.md Decision 8. Extend this map
 * (never `requirePermission` itself) when a new permission is needed.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['ce:manage-rules'],
  case_manager: [],
};

export function roleHasPermission(role: string | undefined, permission: string): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
