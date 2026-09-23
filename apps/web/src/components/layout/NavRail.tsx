import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { Icon } from '../ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { NAV_ITEMS, type NavItem } from './navConfig';
import { useReferralsBadgeCount } from './useReferralsBadgeCount';

export interface NavRailProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const itemBaseClass =
  'flex w-full items-center gap-4.5 rounded-lg text-base transition-colors hover:bg-surfaceHover';
const itemRestClass = 'font-medium text-textMuted';
const itemActiveClass = 'bg-tealTint font-semibold text-ink';

export function NavRail({ collapsed, onToggleCollapsed }: NavRailProps) {
  const referralsBadgeCount = useReferralsBadgeCount();

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col overflow-hidden bg-surface transition-width duration-200 ${
        collapsed ? 'w-railWidthCollapsed' : 'w-railWidth'
      }`}
    >
      <div
        className={`flex items-start justify-between pb-9 pt-11 ${collapsed ? 'px-5' : 'px-10'}`}
      >
        {collapsed ? null : (
          <div className="min-w-0">
            {/* The wordmark, extracted from the design bundle's own asset. */}
            <img src="/housing360-logo.png" alt="Housing360" className="block h-auto w-logo" />
            <div className="mt-4 text-2xs font-semibold uppercase tracking-wider text-textMuted">
              Case Manager Portal
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          className="rounded-sm p-2 text-textMuted transition-colors hover:bg-surfaceHover hover:text-ink"
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={16} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 pb-10 pt-2">
        {NAV_ITEMS.map((item) => (
          <NavRailEntry
            key={item.key}
            item={item}
            collapsed={collapsed}
            referralsBadgeCount={referralsBadgeCount}
          />
        ))}
      </nav>

      <UserCard collapsed={collapsed} />
    </aside>
  );
}

interface NavRailEntryProps {
  item: NavItem;
  collapsed: boolean;
  referralsBadgeCount: number;
}

function NavRailEntry({ item, collapsed, referralsBadgeCount }: NavRailEntryProps) {
  const showBadge = item.badge === 'referrals' && !collapsed;

  return (
    <div>
      {item.to ? (
        <NavLink
          to={item.to}
          end={item.to === '/'}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            [
              itemBaseClass,
              isActive ? itemActiveClass : itemRestClass,
              collapsed ? 'justify-center px-4 py-4' : 'px-5.5 py-4',
            ].join(' ')
          }
        >
          {item.icon ? (
            <span className="shrink-0 opacity-90">
              <Icon name={item.icon} />
            </span>
          ) : null}
          {collapsed ? null : (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {showBadge ? (
                <span className="rounded-full bg-tealTintStrong px-2.5 py-0.5 text-xs font-semibold text-tealDeep">
                  {referralsBadgeCount}
                </span>
              ) : null}
            </>
          )}
        </NavLink>
      ) : collapsed ? (
        // A group header has nothing to show at icon-only width.
        null
      ) : (
        <div className="px-5 pb-2 pt-8 text-2xs font-semibold uppercase tracking-wider text-textMuted">
          {item.label}
        </div>
      )}

      {item.children && !collapsed
        ? item.children.map((child) => (
            <NavLink
              key={child.key}
              to={child.to ?? '#'}
              className={({ isActive }) =>
                [
                  itemBaseClass,
                  isActive ? itemActiveClass : itemRestClass,
                  'py-4 pl-16 pr-5',
                ].join(' ')
              }
            >
              <span className="truncate">{child.label}</span>
            </NavLink>
          ))
        : null}
    </div>
  );
}

interface MenuPosition {
  left: number;
  bottom: number;
}

function UserCard({ collapsed }: { collapsed: boolean }) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuPosition) {
      return;
    }
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) {
        return;
      }
      if (!(target instanceof Element) || !target.closest('[data-account-menu]')) {
        setMenuPosition(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuPosition]);

  if (!currentUser) {
    return null;
  }

  const initials = `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`;
  const fullName = `${currentUser.firstName} ${currentUser.lastName}`;

  function toggleMenu() {
    if (menuPosition) {
      setMenuPosition(null);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    // Opens to the icon's bottom right — a fixed-position portal so the nav
    // rail's own `overflow-hidden` (needed for the collapse animation) can't
    // clip it.
    setMenuPosition({ left: rect.right + 8, bottom: window.innerHeight - rect.bottom });
  }

  return (
    <div className={collapsed ? 'mx-4 mb-7' : 'mx-6 mb-7'}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={menuPosition !== null}
        aria-label={`Account menu for ${fullName}`}
        title={collapsed ? fullName : undefined}
        className={`flex w-full items-center gap-4 rounded-xl bg-surfaceApp py-5 transition-colors hover:bg-surfaceHover ${
          collapsed ? 'justify-center px-4' : 'px-5.5'
        }`}
      >
        <span className="flex h-avatar w-avatar shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-teal">
          {initials}
        </span>
        {collapsed ? null : (
          <div className="min-w-0 flex-1 truncate leading-tight">
            <div className="truncate text-sm font-semibold text-ink">{fullName}</div>
            <div className="truncate text-xs text-textMuted">{currentUser.email}</div>
          </div>
        )}
      </button>

      {menuPosition
        ? createPortal(
            <div
              data-account-menu
              style={{ position: 'fixed', left: menuPosition.left, bottom: menuPosition.bottom }}
              className="z-50 w-menuWidth rounded-lg bg-surface py-2 shadow-lifted"
            >
              <button
                type="button"
                onClick={() => {
                  setMenuPosition(null);
                  dispatch(logout());
                }}
                className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm font-medium text-textMuted transition-colors hover:bg-surfaceHover hover:text-ink"
              >
                <Icon name="logout" size={14} />
                Log out
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
