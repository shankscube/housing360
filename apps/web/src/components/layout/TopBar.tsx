import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

const NOTIFICATIONS_UNREAD_STUB_COUNT = 0;

export function TopBar() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  return (
    <header className="flex items-center gap-md border-b border-neutral-200 bg-white px-lg py-sm">
      <input
        type="search"
        placeholder="Search clients, cases, referrals..."
        onChange={() => {}}
        className="w-full max-w-md rounded-md border border-neutral-300 px-md py-xs text-sm"
      />
      <div className="ml-auto flex items-center gap-md">
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => {}}
          className="relative rounded p-xs text-neutral-500 hover:bg-neutral-100"
        >
          <span aria-hidden>🔔</span>
          <span className="absolute -right-1 -top-1 rounded-full bg-danger px-xs text-[10px] font-medium text-white">
            {NOTIFICATIONS_UNREAD_STUB_COUNT}
          </span>
        </button>
        <button
          type="button"
          aria-label="Settings"
          onClick={() => {}}
          className="rounded p-xs text-neutral-500 hover:bg-neutral-100"
        >
          <span aria-hidden>⚙</span>
        </button>
        {currentUser ? (
          <div className="flex items-center gap-sm text-sm">
            <span className="text-neutral-700">Welcome, {currentUser.firstName}</span>
            <button
              type="button"
              onClick={() => dispatch(logout())}
              className="rounded-md border border-neutral-300 px-sm py-xs text-xs font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Log out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
