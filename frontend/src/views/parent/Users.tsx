import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'parent';
  roleTitle: string | null;
  mustChangePassword: boolean;
  createdAt: number;
}

interface FamilyInfo {
  id: string;
  name: string;
}

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [editingFamilyName, setEditingFamilyName] = useState(false);

  // Invite state
  const [inviteRole, setInviteRole] = useState<'admin' | 'parent'>('parent');
  const [inviteResult, setInviteResult] = useState<{ url: string; expiresAt: number } | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Edit user state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'parent'>('parent');
  const [editRoleTitle, setEditRoleTitle] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Reset password state
  const [resetResult, setResetResult] = useState<{ userId: string; tempPassword: string } | null>(null);

  async function load() {
    const [usersRes, familyRes] = await Promise.all([
      client.get<{ data: User[] }>('/users'),
      client.get<{ data: FamilyInfo }>('/family'),
    ]);
    setUsers(usersRes.data.data);
    setFamily(familyRes.data.data);
    setFamilyName(familyRes.data.data.name);
  }

  useEffect(() => { void load(); }, []);

  async function handleSaveFamilyName() {
    await client.patch('/family', { name: familyName });
    setEditingFamilyName(false);
    await load();
  }

  async function handleInvite() {
    setInviteLoading(true);
    setInviteResult(null);
    try {
      const res = await client.post<{ data: { inviteUrl: string; expiresAt: number } }>('/users/invite', { role: inviteRole });
      setInviteResult({ url: window.location.origin + res.data.data.inviteUrl, expiresAt: res.data.data.expiresAt });
    } finally {
      setInviteLoading(false);
    }
  }

  function startEdit(user: User) {
    setEditId(user.id);
    setEditName(user.name);
    setEditRole(user.role);
    setEditRoleTitle(user.roleTitle ?? '');
    setEditPhone(user.phone ?? '');
    setResetResult(null);
  }

  async function handleSaveEdit() {
    if (!editId) return;
    await client.patch(`/users/${editId}`, {
      name: editName,
      role: editRole,
      roleTitle: editRoleTitle || null,
      phone: editPhone || null,
    });
    setEditId(null);
    await load();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(t('parent.users.confirmDelete', { name }))) return;
    await client.delete(`/users/${id}`);
    await load();
  }

  async function handleResetPassword(userId: string) {
    const res = await client.post<{ data: { tempPassword: string } }>(`/users/${userId}/reset-password`, {});
    setResetResult({ userId, tempPassword: res.data.data.tempPassword });
  }

  function roleName(user: User) {
    if (user.roleTitle) return user.roleTitle;
    return user.role === 'admin' ? t('parent.users.roleAdmin') : t('parent.users.roleParent');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{t('parent.users.title')}</h1>

      {/* Family name */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('parent.users.familyName')}</p>
        {editingFamilyName ? (
          <div className="flex gap-2">
            <input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <button onClick={() => void handleSaveFamilyName()} className="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800">
              {t('parent.tasks.save')}
            </button>
            <button onClick={() => { setEditingFamilyName(false); setFamilyName(family?.name ?? ''); }} className="text-sm text-gray-500 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-gray-800 dark:text-gray-100 font-medium">{family?.name}</span>
            <button onClick={() => setEditingFamilyName(true)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1">
              {t('parent.users.edit')}
            </button>
          </div>
        )}
      </div>

      {/* User list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700 mb-6">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/30 rounded-t-xl flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('parent.users.members')}</p>
        </div>
        {users.map((user) => (
          <div key={user.id}>
            {editId === user.id ? (
              <div className="p-4 flex flex-col gap-3">
                <div className="flex gap-3 flex-wrap">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={t('parent.users.namePlaceholder')}
                    className="flex-1 min-w-[140px] border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder={t('parent.users.phonePlaceholder')}
                    className="flex-1 min-w-[140px] border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div className="flex gap-3 flex-wrap">
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'admin' | 'parent')}
                    className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="admin">{t('parent.users.roleAdmin')}</option>
                    <option value="parent">{t('parent.users.roleParent')}</option>
                  </select>
                  <input
                    value={editRoleTitle}
                    onChange={(e) => setEditRoleTitle(e.target.value)}
                    placeholder={t('parent.users.roleTitlePlaceholder')}
                    className="flex-1 min-w-[140px] border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditId(null)} className="text-sm text-gray-500 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                  <button onClick={() => void handleSaveEdit()} className="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800">{t('parent.tasks.save')}</button>
                </div>

                {/* Reset password result */}
                {resetResult?.userId === user.id && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">{t('parent.users.tempPasswordLabel')}</p>
                    <code className="font-mono text-lg tracking-widest text-amber-900 dark:text-amber-100">{resetResult.tempPassword}</code>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t('parent.users.tempPasswordHint')}</p>
                  </div>
                )}
                {resetResult?.userId !== user.id && (
                  <button
                    onClick={() => void handleResetPassword(user.id)}
                    className="text-xs text-orange-500 hover:text-orange-700 text-left px-1"
                  >
                    {t('parent.users.resetPassword')}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{user.name}</span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">{roleName(user)}</span>
                    {user.mustChangePassword && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">{t('parent.users.mustChangePassword')}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{user.email}</p>
                </div>
                <button onClick={() => startEdit(user)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1">
                  {t('parent.users.edit')}
                </button>
                <button onClick={() => void handleDelete(user.id, user.name)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1">
                  {t('parent.tasks.delete')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Invite new user */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('parent.users.inviteNew')}</p>
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('parent.users.inviteRole')}</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'admin' | 'parent')}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            >
              <option value="parent">{t('parent.users.roleParent')}</option>
              <option value="admin">{t('parent.users.roleAdmin')}</option>
            </select>
          </div>
          <button
            onClick={() => void handleInvite()}
            disabled={inviteLoading}
            className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-60"
          >
            {inviteLoading ? t('loading') : t('parent.users.generateLink')}
          </button>
        </div>

        {inviteResult && (
          <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">{t('parent.users.inviteLinkReady')}</p>
            <div className="flex gap-2 items-center">
              <code className="flex-1 text-xs break-all bg-white dark:bg-gray-700 border border-green-200 dark:border-green-600 rounded px-2 py-1.5 text-green-900 dark:text-green-100">
                {inviteResult.url}
              </code>
              <button
                onClick={() => void navigator.clipboard.writeText(inviteResult.url)}
                className="text-xs bg-green-700 text-white px-3 py-2 rounded-lg hover:bg-green-800 whitespace-nowrap"
              >
                {t('parent.children.copy')}
              </button>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {t('parent.users.inviteExpires', { time: new Date(inviteResult.expiresAt).toLocaleString() })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
