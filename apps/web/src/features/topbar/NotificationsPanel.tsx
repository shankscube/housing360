import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchNotifications, markStatusUpdatesSeen } from '../../store/slices/notificationsSlice';

/** White card + soft lift — the bundle's treatment for every top-bar control (matches TopBar.tsx). */
const controlCardClass = 'flex items-center rounded-lg bg-surface shadow-control';

interface PanelPosition {
  top: number;
  right: number;
}

/**
 * Replaces `TopBar.tsx`'s static bell stub. Self-contained: fetches its own
 * data, owns its own open/close state, and portals its dropdown to
 * `document.body` (same technique as `NavRail.tsx`'s account menu) so no
 * ancestor `overflow-hidden` can clip it.
 *
 * Known gap (see task brief): there is no Referrals detail route yet, so
 * clicking a notification item never navigates anywhere — a "New Referrals"
 * row is a no-op, and a "Referral Updates" row only marks status updates
 * seen. A future change with a real referral/case detail route should wire
 * real navigation here.
 */
export function NotificationsPanel() {
  const dispatch = useAppDispatch();
  const pendingReferrals = useAppSelector((state) => state.notifications.pendingReferrals);
  const statusUpdates = useAppSelector((state) => state.notifications.statusUpdates);

  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    if (!panelPosition) {
      return;
    }
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) {
        return;
      }
      if (!(target instanceof Element) || !target.closest('[data-notifications-panel]')) {
        setPanelPosition(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panelPosition]);

  const totalCount = pendingReferrals.length + statusUpdates.length;
  const isEmpty = pendingReferrals.length === 0 && statusUpdates.length === 0;

  function togglePanel() {
    if (panelPosition) {
      setPanelPosition(null);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    setPanelPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
  }

  function handleStatusUpdateClick() {
    // No referral detail route exists yet (see the module-level note above) —
    // the only real effect of clicking a status update is marking it seen.
    dispatch(markStatusUpdatesSeen());
  }

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={panelPosition !== null}
        onClick={togglePanel}
        className={`${controlCardClass} relative p-4.5 text-textMuted transition-colors hover:text-ink`}
      >
        <Icon name="bell" size={16} />
        {totalCount > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-coral px-2.5 py-0.5 text-2xs font-semibold text-surface">
            {totalCount}
          </span>
        ) : null}
      </button>

      {panelPosition
        ? createPortal(
            <div
              data-notifications-panel
              style={{ position: 'fixed', top: panelPosition.top, right: panelPosition.right }}
              className="z-50 w-full max-w-formCardWidth rounded-lg bg-surface py-3 shadow-lifted"
            >
              {isEmpty ? (
                <p className="px-5 py-4 text-sm text-textMuted">No new notifications right now.</p>
              ) : (
                <>
                  {pendingReferrals.length > 0 ? (
                    <section>
                      <h3 className="px-5 pb-2 pt-1 text-2xs font-semibold uppercase tracking-wider text-textMuted">
                        New Referrals
                      </h3>
                      <ul>
                        {pendingReferrals.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => {
                                /* No referral detail route exists yet — see the module-level note. */
                              }}
                              className="flex w-full flex-col gap-1 px-5 py-3 text-left transition-colors hover:bg-surfaceHover"
                            >
                              <span className="text-sm font-semibold text-ink">{item.title}</span>
                              <span className="text-xs text-textMuted">
                                {item.client}
                                {item.program ? ` · ${item.program}` : ''}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {statusUpdates.length > 0 ? (
                    <section>
                      <h3 className="px-5 pb-2 pt-3 text-2xs font-semibold uppercase tracking-wider text-textMuted">
                        Referral Updates
                      </h3>
                      <ul>
                        {statusUpdates.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={handleStatusUpdateClick}
                              className="flex w-full flex-col gap-1 px-5 py-3 text-left transition-colors hover:bg-surfaceHover"
                            >
                              <span className="text-sm font-semibold text-ink">{item.title}</span>
                              <span className="text-xs text-textMuted">{item.statusLabel}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </>
              )}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
