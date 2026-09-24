import { useEffect, useState } from 'react';
import type { AuthenticatedUser } from '@housing360/types';
import { getUsers } from '../../../api/client';

/** Shared across every "Case Manager" / "Assigned To" picker `case-workspace` adds. */
export function useUserOptions(): AuthenticatedUser[] {
  const [users, setUsers] = useState<AuthenticatedUser[]>([]);

  useEffect(() => {
    let cancelled = false;
    getUsers().then((response) => {
      if (!cancelled && response.success) {
        setUsers(response.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return users;
}
