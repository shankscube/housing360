import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { NavRail } from './NavRail';
import { TopBar } from './TopBar';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-50">
      <NavRail collapsed={collapsed} onToggleCollapsed={() => setCollapsed((value) => !value)} />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <TopBar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
