import { Icon } from '../ui';
import { useAppSelector } from '../../store/hooks';
import { GlobalSearchDropdown } from '../../features/topbar/GlobalSearchDropdown';
import { NotificationsPanel } from '../../features/topbar/NotificationsPanel';

/** White card + soft lift — the bundle's treatment for every top-bar control. */
const controlCardClass = 'flex items-center rounded-lg bg-surface shadow-control';

/**
 * The bundle's header carries a search card and a status pill over a
 * transparent background; it has no notifications bell or settings control.
 * Those are required by the `shared-ui` spec, so they stay — restyled into
 * the same control idiom rather than given a look of their own. Search and
 * notifications are real as of `home-workspace` (`GlobalSearchDropdown`/
 * `NotificationsPanel`), replacing the earlier inert stubs.
 *
 * Log out lives on the nav rail's user card (click it), not here.
 */
export function TopBar() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  return (
    <header className="flex flex-wrap items-center gap-7 px-14 pb-4 pt-12">
      <GlobalSearchDropdown />

      <div className="ml-auto flex items-center gap-4">
        <NotificationsPanel />
        <button
          type="button"
          aria-label="Settings"
          onClick={() => {}}
          className={`${controlCardClass} p-4.5 text-textMuted transition-colors hover:text-ink`}
        >
          <Icon name="settings" size={16} />
        </button>

        {currentUser ? (
          <div className={`${controlCardClass} px-6 py-4`}>
            <span className="text-sm text-textMuted">
              Welcome, <span className="font-semibold text-ink">{currentUser.firstName}</span>
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
