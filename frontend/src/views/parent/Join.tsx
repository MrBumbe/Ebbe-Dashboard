import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';

export default function Join() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = params.get('token') ?? '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <p className="text-gray-600 dark:text-gray-300">{t('parent.join.invalidToken')}</p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('parent.join.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/users/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, email, password, phone: phone || undefined }),
      });
      const json = await res.json() as
        | { data: { accessToken: string; refreshToken: string } }
        | { error: { code: string; message: string } };

      if (!res.ok || 'error' in json) {
        const code = 'error' in json ? json.error.code : '';
        if (code === 'TOKEN_EXPIRED') setError(t('parent.join.tokenExpired'));
        else if (code === 'TOKEN_USED') setError(t('parent.join.tokenUsed'));
        else if (code === 'EMAIL_TAKEN') setError(t('parent.join.emailTaken'));
        else setError(t('errors.unknown'));
        return;
      }
      setAuth(json.data.accessToken, json.data.refreshToken);
      navigate('/parent');
    } catch {
      setError(t('errors.networkError'));
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
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">{t('parent.join.title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('parent.join.subtitle')}</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('parent.join.name')}</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('parent.login.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('parent.join.phone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('parent.join.phonePlaceholder')}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('parent.login.password')}</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? t('loading') : t('parent.join.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
