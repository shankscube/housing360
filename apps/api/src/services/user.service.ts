import type { AuthenticatedUser } from '@housing360/types';
import { findAllUsers } from '../models/user.model';

export async function listUsers(): Promise<AuthenticatedUser[]> {
  const rows = await findAllUsers();
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
  }));
}
