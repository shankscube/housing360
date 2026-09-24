export interface AuthenticatedUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  /**
   * Optional so existing call sites that build an `AuthenticatedUser` without
   * a role (e.g. `GET /api/users`'s picker-backing list, which doesn't select
   * it) still type-check — added by assessment-and-ce-workspace for the
   * `ce:manage-rules` permission gate (`requirePermission` middleware).
   * Always populated on `req.user` (via `auth.service.ts`'s
   * `toAuthenticatedUser`, which reads the real `User.role` column).
   */
  role?: string;
}
