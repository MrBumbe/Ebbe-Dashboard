import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import Dashboard from './Dashboard';
import Tasks from './Tasks';
import Schedule from './Schedule';
import Events from './Events';
import Rewards from './Rewards';
import MoodLog from './MoodLog';
import Timer from './Timer';
import Settings from './Settings';
import ModuleManager from './ModuleManager';
import LayoutManager from './LayoutManager';

const NAV = [
  { to: '',          icon: '🏠', key: 'dashboard' },
  { to: 'tasks',     icon: '📋', key: 'tasks' },
  { to: 'schedule',  icon: '📅', key: 'schedule' },
  { to: 'events',    icon: '🎉', key: 'events' },
  { to: 'rewards',   icon: '⭐', key: 'rewards' },
  { to: 'mood',      icon: '😊', key: 'mood' },
  { to: 'timer',     icon: '⏱️', key: 'timer' },
  { to: 'layout',    icon: '🧩', key: 'layout' },
  { to: 'settings',  icon: '⚙️', key: 'settings' },
] as const;

export default function ParentApp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, clearAuth, hydrate } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hydrate auth from localStorage on first render
  useEffect(() => { hydrate(); }, [hydrate]);

  if (!isLoggedIn) {
    return <Navigate to="/parent/login" replace />;
  }

  function handleLogout() {
    clearAuth();
    navigate('/parent/login');
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
     ${isActive ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar — hidden on mobile, visible on md+ ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-56 bg-white border-r border-gray-100 flex flex-col
        transform transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex
      `}>
        <div className="px-4 py-5 border-b border-gray-100 flex items-center gap-2">
          <span className="text-2xl">⭐</span>
          <span className="font-bold text-gray-800 text-lg">Ebbe</span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {NAV.map(({ to, icon, key }) => (
            <NavLink
              key={key}
              to={to === '' ? '/parent' : `/parent/${to}`}
              end={to === ''}
              className={linkClass}
              onClick={() => setMobileOpen(false)}
            >
              <span>{icon}</span>
              <span>{t(`parent.nav.${key}`)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <span>🚪</span>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            ☰
          </button>
          <span className="font-bold text-gray-800">Ebbe</span>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl w-full mx-auto">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="events" element={<Events />} />
            <Route path="rewards" element={<Rewards />} />
            <Route path="mood" element={<MoodLog />} />
            <Route path="timer" element={<Timer />} />
            <Route path="layout" element={<LayoutManager />} />
            <Route path="settings" element={<Settings />} />
            <Route path="modules" element={<ModuleManager />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
