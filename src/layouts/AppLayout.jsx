import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNavigation from '../components/TopNavigation';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--c-bg-page)] text-[var(--c-text-primary)]">
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />

        <main className="flex-1 min-w-0">
          <TopNavigation onMobileMenuOpen={() => setMobileNavOpen(true)} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
