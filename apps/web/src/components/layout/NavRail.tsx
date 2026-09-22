import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, type NavItem } from './navConfig';
import { useReferralsBadgeCount } from './useReferralsBadgeCount';

export interface NavRailProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const linkBaseClass = 'flex items-center gap-sm rounded-md px-md py-sm text-sm';
const linkInactiveClass = `${linkBaseClass} text-neutral-700 hover:bg-neutral-100`;
const linkActiveClass = `${linkBaseClass} bg-primary-50 font-semibold text-primary-700`;

export function NavRail({ collapsed, onToggleCollapsed }: NavRailProps) {
  const referralsBadgeCount = useReferralsBadgeCount();

  return (
    <aside
      className={`flex h-screen flex-col border-r border-neutral-200 bg-white ${collapsed ? 'w-16' : 'w-64'}`}
    >
      <div className="flex items-center justify-between border-b border-neutral-200 p-md">
        {!collapsed && <span className="font-semibold text-neutral-900">Housing360</span>}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          className="rounded p-xs text-neutral-500 hover:bg-neutral-100"
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-xs overflow-y-auto p-sm">
        {NAV_ITEMS.map((item) => (
          <NavRailEntry
            key={item.key}
            item={item}
            collapsed={collapsed}
            referralsBadgeCount={referralsBadgeCount}
          />
        ))}
      </nav>
    </aside>
  );
}

interface NavRailEntryProps {
  item: NavItem;
  collapsed: boolean;
  referralsBadgeCount: number;
}

function NavRailEntry({ item, collapsed, referralsBadgeCount }: NavRailEntryProps) {
  const showBadge = item.badge === 'referrals';

  return (
    <div>
      {item.to ? (
        <NavLink
          to={item.to}
          end={item.to === '/'}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) => (isActive ? linkActiveClass : linkInactiveClass)}
        >
          {collapsed ? (
            <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold">
              {item.label.charAt(0)}
            </span>
          ) : (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {showBadge && (
                <span className="rounded-full bg-primary-600 px-sm py-xs text-xs font-medium text-white">
                  {referralsBadgeCount}
                </span>
              )}
            </>
          )}
        </NavLink>
      ) : !collapsed ? (
        <div className="px-md pb-xs pt-md text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {item.label}
        </div>
      ) : null}

      {item.children && !collapsed ? (
        <div className="ml-lg flex flex-col gap-xs border-l border-neutral-100 pl-sm">
          {item.children.map((child) => (
            <NavLink
              key={child.key}
              to={child.to ?? '#'}
              className={({ isActive }) => (isActive ? linkActiveClass : linkInactiveClass)}
            >
              <span className="truncate text-sm">{child.label}</span>
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}
