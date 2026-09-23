import { Icon } from '../ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

const NOTIFICATIONS_UNREAD_STUB_COUNT = 0;

/** White card + soft lift — the bundle's treatment for every top-bar control. */
const controlCardClass = 'flex items-center rounded-lg bg-surface shadow-control';

/**
 * The bundle's header carries a search card and a status pill over a
 * transparent background; it has no notifications bell or settings control.
 * Those are required by the `shared-ui` spec, so they stay — restyled into
 * the same control idiom rather than given a look of their own.
 */
export function TopBar() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  return (
    <header className="flex flex-wrap items-center gap-7 px-14 pb-4 pt-12">
      <div className={`${controlCardClass} min-w-kpiMinWidth max-w-formCardWidth flex-1 gap-4 px-6 py-4.5`}>
        <span className="shrink-0 text-textMuted">
          <Icon name="search" size={15} strokeWidth={2} />
        </span>
        <input
          type="search"
          placeholder="Search clients, cases, referrals..."
          onChange={() => {}}
          className="w-full border-0 bg-transparent text-base text-ink outline-none placeholder:text-textMuted"
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => {}}
          className={`${controlCardClass} relative p-4.5 text-textMuted transition-colors hover:text-ink`}
        >
          <Icon name="bell" size={16} />
          <span className="absolute -right-1 -top-1 rounded-full bg-coral px-2.5 py-0.5 text-2xs font-semibold text-surface">
            {NOTIFICATIONS_UNREAD_STUB_COUNT}
          </span>
        </button>
        <button
          type="button"
          aria-label="Settings"
          onClick={() => {}}
          className={`${controlCardClass} p-4.5 text-textMuted transition-colors hover:text-ink`}
        >
          <Icon name="settings" size={16} />
        </button>

        {currentUser ? (
          <div className={`${controlCardClass} gap-4 px-6 py-4`}>
            <span className="text-sm text-textMuted">
              Welcome, <span className="font-semibold text-ink">{currentUser.firstName}</span>
            </span>
            <button
              type="button"
              onClick={() => dispatch(logout())}
              aria-label="Log out"
              className="flex items-center gap-2 rounded-sm px-2.5 py-2 text-xs font-semibold text-textMuted transition-colors hover:bg-surfaceSubtle hover:text-ink"
            >
              <Icon name="logout" size={14} />
              Log out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
