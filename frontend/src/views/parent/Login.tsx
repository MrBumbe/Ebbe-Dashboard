import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import { tw } from '../../lib/theme';
import EbbeLogo from '../../components/EbbeLogo';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json() as
        | { data: { accessToken: string; refreshToken: string } }
        | { error: { code: string; message: string } };

      if (!res.ok || 'error' in json) {
        setError(t('parent.login.error'));
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
        <div className="flex flex-col items-center mb-8">
          <EbbeLogo size={64} />
          <h1 className="font-brand font-bold text-3xl text-gray-800 dark:text-gray-100 mt-3">Ebbe</h1>
          <p className={`${tw.muted} mt-1`}>{t('parent.login.title')}</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <div>
            <label className={`block ${tw.labelMd} mb-1`}>
              {t('parent.login.email')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full ${tw.input} focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] md:min-h-[40px]`}
            />
          </div>
          <div>
            <label className={`block ${tw.labelMd} mb-1`}>
              {t('parent.login.password')}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full ${tw.input} focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] md:min-h-[40px]`}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg py-2.5 min-h-[44px] transition-colors disabled:opacity-60"
          >
            {loading ? t('loading') : t('parent.login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
