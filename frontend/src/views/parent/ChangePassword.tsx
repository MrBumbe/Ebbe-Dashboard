import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';

export default function ChangePassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setMustChangePassword } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError(t('parent.join.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await client.patch('/users/me/password', { currentPassword, newPassword });
      setMustChangePassword(false);
      navigate('/parent');
    } catch (err: unknown) {
      const resp = err as { response?: { data?: { error?: { code?: string } } } };
      const code = resp.response?.data?.error?.code;
      if (code === 'INVALID_PASSWORD') {
        setError(t('parent.changePassword.wrongCurrent'));
      } else {
        setError(t('errors.unknown'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">⭐</span>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Ebbe</h1>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">{t('parent.changePassword.title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('parent.changePassword.subtitle')}</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('parent.changePassword.current')}</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('parent.changePassword.new')}</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('parent.join.confirmPassword')}</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg py-2.5 min-h-[44px] transition-colors disabled:opacity-60"
          >
            {loading ? t('loading') : t('parent.changePassword.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
