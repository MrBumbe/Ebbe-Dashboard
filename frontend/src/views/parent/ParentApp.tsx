import { useEffect, useRef, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import client from '../../api/client';
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
import Users from './Users';
import Children from './Children';
import ChangePassword from './ChangePassword';

// ── Child selector ────────────────────────────────────────────────────────────

interface ChildInfo {
  id: string;
  name: string;
  emoji: string;
  color: string;
  childToken: string;
}

function ChildSelector() {
  const { t } = useTranslation();
  const { activeChildId, setActiveChildId } = useAuthStore();
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    client.get<{ data: ChildInfo[] }>('/children').then((res) => {
      const list = res.data.data;
      setChildren(list);
      // If no active child is selected yet, default to the first child
      if (!activeChildId && list.length > 0) {
        setActiveChildId(list[0].id);
      }
    }).catch(() => {/* ignore */});
  }, [activeChildId, setActiveChildId]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (children.length === 0) return null;

  const active = children.find((c) => c.id === activeChildId) ?? children[0];

  function select(id: string) {
    setActiveChildId(id);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-600 dark:text-gray-300 transition-colors"
      >
        <span>{active.emoji}</span>
        <span className="flex-1 text-left truncate font-medium">{active.name}</span>
        <span className="text-gray-400 dark:text-gray-500 text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => select(c.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${c.id === (activeChildId ?? children[0]?.id) ? 'font-semibold text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}
            >
              <span>{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          ))}
          <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
            <NavLink
              to="/parent/children"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {t('parent.children.manage')}
            </NavLink>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Profile panel ─────────────────────────────────────────────────────────────

interface ProfilePanelProps {
  onClose: () => void;
}

function ProfilePanel({ onClose }: ProfilePanelProps) {
  const { t } = useTranslation();
  const { name, role, darkMode, setDarkMode, setMustChangePassword } = useAuthStore();

  const [displayName, setDisplayName] = useState(name ?? '');
  const [phone, setPhone] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    client.get<{ data: { name: string; phone: string | null } }>('/users/me').then((res) => {
      setDisplayName(res.data.data.name);
      setPhone(res.data.data.phone ?? '');
    }).catch(() => {/* ignore */});
  }, []);

  async function handleSaveProfile() {
    await client.patch('/users/me/profile', { name: displayName, phone: phone || null });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  async function handleChangePassword() {
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError(t('parent.join.passwordMismatch'));
      return;
    }
    try {
      await client.patch('/users/me/password', { currentPassword, newPassword });
      setMustChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    } catch (err: unknown) {
      const resp = err as { response?: { data?: { error?: { code?: string } } } };
      if (resp.response?.data?.error?.code === 'INVALID_PASSWORD') {
        setPasswordError(t('parent.changePassword.wrongCurrent'));
      } else {
        setPasswordError(t('errors.unknown'));
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* Panel */}
      <div className="relative h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t('parent.profile.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">×</button>
        </div>

        <div className="flex-1 p-5 flex flex-col gap-6">
          {/* Profile info */}
          <section>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('parent.profile.info')}</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('parent.join.name')}</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('parent.join.phone')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('parent.join.phonePlaceholder')}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('parent.profile.role')}</label>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{role === 'admin' ? t('parent.users.roleAdmin') : t('parent.users.roleParent')}</p>
              </div>
              <button
                onClick={() => void handleSaveProfile()}
                className="self-end bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800"
              >
                {profileSaved ? '✓ ' + t('parent.profile.saved') : t('parent.tasks.save')}
              </button>
            </div>
          </section>

          {/* Change password */}
          <section>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('parent.changePassword.title')}</p>
            <div className="flex flex-col gap-3">
              <input
                type="password"
                placeholder={t('parent.changePassword.current')}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="password"
                placeholder={t('parent.changePassword.new')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="password"
                placeholder={t('parent.join.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
              />
              {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
              <button
                onClick={() => void handleChangePassword()}
                disabled={!currentPassword || !newPassword || !confirmPassword}
                className="self-end bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50"
              >
                {passwordSaved ? '✓ ' + t('parent.profile.saved') : t('parent.changePassword.submit')}
              </button>
            </div>
          </section>

          {/* Dark mode */}
          <section>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('parent.profile.appearance')}</p>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('parent.profile.darkMode')}</span>
              <div
                onClick={() => setDarkMode(!darkMode)}
                className={`relative w-10 h-6 rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-4' : ''}`} />
              </div>
            </label>
          </section>

          {/* Admin section */}
          {role === 'admin' && (
            <section>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('parent.profile.adminSection')}</p>
              <NavLink
                to="/parent/users"
                onClick={onClose}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                👥 {t('parent.nav.users')}
              </NavLink>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main nav ──────────────────────────────────────────────────────────────────

const NAV_BASE = [
  { to: '',          icon: '🏠', key: 'dashboard' },
  { to: 'tasks',     icon: '📋', key: 'tasks' },
  { to: 'schedule',  icon: '📅', key: 'schedule' },
  { to: 'events',    icon: '🎉', key: 'events' },
  { to: 'rewards',   icon: '⭐', key: 'rewards' },
  { to: 'mood',      icon: '😊', key: 'mood' },
  { to: 'timer',     icon: '⏱️', key: 'timer' },
  { to: 'layout',    icon: '🧩', key: 'layout' },
  { to: 'children',  icon: '👧', key: 'children' },
  { to: 'settings',  icon: '⚙️', key: 'settings' },
] as const;

const NAV_ADMIN = [
  { to: 'users',     icon: '👥', key: 'users' },
] as const;

// ── ParentApp ─────────────────────────────────────────────────────────────────

export default function ParentApp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, clearAuth, hydrate, role, name, mustChangePassword } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  if (!isLoggedIn) {
    return <Navigate to="/parent/login" replace />;
  }

  // Force password change screen
  if (mustChangePassword) {
    return <ChangePassword />;
  }

  function handleLogout() {
    clearAuth();
    navigate('/parent/login');
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
     ${isActive
       ? 'bg-blue-700 text-white'
       : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`;

  const allNav = role === 'admin'
    ? [...NAV_BASE, ...NAV_ADMIN]
    : [...NAV_BASE];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-56 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col
        transform transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex
      `}>
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">⭐</span>
            <span className="font-bold text-gray-800 dark:text-gray-100 text-lg">Ebbe</span>
          </div>
          {/* Child selector */}
          <ChildSelector />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {allNav.map(({ to, icon, key }) => (
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

        {/* Footer: user + logout */}
        <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-1">
          {/* User pill */}
          <button
            onClick={() => setProfileOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {(name ?? '?')[0]?.toUpperCase()}
            </span>
            <span className="flex-1 text-left truncate">{name}</span>
            <span className="text-gray-400 dark:text-gray-500">⚙️</span>
          </button>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span>🚪</span>
            <span>{t('parent.nav.logout')}</span>
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
        <header className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            ☰
          </button>
          <span className="font-bold text-gray-800 dark:text-gray-100">Ebbe</span>
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
            <Route path="users" element={<Users />} />
            <Route path="children" element={<Children />} />
          </Routes>
        </main>
      </div>

      {/* Profile panel */}
      {profileOpen && <ProfilePanel onClose={() => setProfileOpen(false)} />}
    </div>
  );
}
