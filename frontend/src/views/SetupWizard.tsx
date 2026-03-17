import { useState } from 'react';
import { tw } from '../lib/theme';

// ── Types ─────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

interface SetupData {
  familyName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  language: 'en' | 'sv';
}

interface SetupResult {
  childToken: string;
}

// ── Wizard shell layout ───────────────────────────────────────────────────

function WizardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className={`w-full max-w-md ${tw.card} p-8 shadow-lg`}>
        {children}
      </div>
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step - 1) / total) * 100);
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-1.5">
        <span className={tw.muted}>Step {step} of {total}</span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── URL display card ──────────────────────────────────────────────────────

function UrlCard({ label, icon, url, copyKey, copied, onCopy }: {
  label: string;
  icon: string;
  url: string;
  copyKey: string;
  copied: string | null;
  onCopy: (url: string, key: string) => void;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
        {icon} {label}
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs text-gray-700 dark:text-gray-200 break-all font-mono bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
          {url}
        </code>
        <button
          onClick={() => onCopy(url, copyKey)}
          className="shrink-0 text-xs bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition-colors min-w-[56px]"
        >
          {copied === copyKey ? '✓' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function SetupWizard() {
  const [step, setStep]             = useState<Step>(1);
  const [data, setData]             = useState<SetupData>({
    familyName:      '',
    adminName:       '',
    adminEmail:      '',
    adminPassword:   '',
    confirmPassword: '',
    language:        'en',
  });
  const [errors, setErrors]         = useState<string[]>([]);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<SetupResult | null>(null);
  const [setupError, setSetupError] = useState('');
  const [addresses, setAddresses]   = useState<string[]>([]);
  const [copied, setCopied]         = useState<string | null>(null);

  const TOTAL_STEPS = 4; // Steps 1–4; step 5 is the success screen

  // ── Helpers ─────────────────────────────────────────────────────────────

  function update(patch: Partial<SetupData>) {
    setData((d) => ({ ...d, ...patch }));
    setErrors([]);
  }

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
  }

  function validateStep3(): string[] {
    const errs: string[] = [];
    if (!data.adminName.trim())          errs.push('Name is required.');
    if (!data.adminEmail.trim())         errs.push('Email address is required.');
    else if (!/\S+@\S+\.\S+/.test(data.adminEmail)) errs.push('Please enter a valid email address.');
    if (!data.adminPassword)             errs.push('Password is required.');
    else if (data.adminPassword.length < 8) errs.push('Password must be at least 8 characters.');
    if (data.adminPassword !== data.confirmPassword) errs.push('Passwords do not match.');
    return errs;
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleFinish() {
    setLoading(true);
    setSetupError('');

    try {
      const setupRes = await fetch('/api/v1/setup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          familyName:    data.familyName,
          adminName:     data.adminName,
          adminEmail:    data.adminEmail,
          adminPassword: data.adminPassword,
          language:      data.language,
        }),
      });

      const setupJson = await setupRes.json() as { data?: { childToken: string }; error?: { message: string } };

      if (!setupRes.ok) {
        setSetupError(setupJson.error?.message ?? 'Setup failed. Please try again.');
        setLoading(false);
        return;
      }

      setResult({ childToken: setupJson.data!.childToken });

      // Fetch local network addresses to build display URLs
      try {
        const infoRes  = await fetch('/api/v1/system/info');
        const infoJson = await infoRes.json() as { data: { localAddresses: string[] } };
        setAddresses(infoJson.data.localAddresses ?? []);
      } catch { /* ignore — we can still show localhost */ }

      setStep(5);
    } catch {
      setSetupError('Network error. Make sure the server is running and try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Auto-login and navigate to parent panel ──────────────────────────────

  async function handleOpenParentPanel() {
    try {
      const res  = await fetch('/api/v1/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: data.adminEmail, password: data.adminPassword }),
      });
      const json = await res.json() as { data?: { accessToken: string; refreshToken: string } };
      if (res.ok && json.data) {
        localStorage.setItem('ebbe_access',  json.data.accessToken);
        localStorage.setItem('ebbe_refresh', json.data.refreshToken);
        localStorage.setItem('ebbe_lang',    data.language);
      }
    } catch { /* ignore — still navigate */ }
    window.location.href = '/parent';
  }

  // ── Display URL helpers ──────────────────────────────────────────────────

  function buildUrls() {
    const token     = result?.childToken ?? '';
    const addrsToUse = addresses.length > 0 ? addresses : ['localhost'];
    return addrsToUse.map((addr) => ({
      addr,
      childUrl:  `http://${addr}/child?token=${token}`,
      parentUrl: `http://${addr}/parent`,
    }));
  }

  // ── Steps ────────────────────────────────────────────────────────────────

  // Step 1 — Welcome
  if (step === 1) {
    return (
      <WizardShell>
        <div className="text-center">
          <div className="text-6xl mb-6">👋</div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">
            Welcome to Ebbe!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
            Let's get your family dashboard set up. It only takes a minute.
          </p>
          <button
            onClick={() => setStep(2)}
            className={`${tw.btnPrimary} px-8 py-3 text-base`}
          >
            Get started →
          </button>
        </div>
      </WizardShell>
    );
  }

  // Step 2 — Family name
  if (step === 2) {
    return (
      <WizardShell>
        <ProgressBar step={2} total={TOTAL_STEPS} />
        <h1 className={`${tw.pageHeading} mb-1`}>What's your family name?</h1>
        <p className={`${tw.muted} mb-6`}>This name will appear on the dashboard.</p>
        <input
          type="text"
          autoFocus
          value={data.familyName}
          onChange={(e) => update({ familyName: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && data.familyName.trim() && setStep(3)}
          placeholder="The Johnsons"
          className={`${tw.input} w-full mb-6`}
        />
        <div className="flex justify-end">
          <button
            onClick={() => setStep(3)}
            disabled={!data.familyName.trim()}
            className={`${tw.btnPrimary} disabled:opacity-50`}
          >
            Next →
          </button>
        </div>
      </WizardShell>
    );
  }

  // Step 3 — Admin account
  if (step === 3) {
    return (
      <WizardShell>
        <ProgressBar step={3} total={TOTAL_STEPS} />
        <h1 className={`${tw.pageHeading} mb-1`}>Create your admin account</h1>
        <p className={`${tw.muted} mb-6`}>
          This will be the administrator account. You can invite other family members later.
        </p>

        <div className="flex flex-col gap-3 mb-4">
          <div>
            <label className={`${tw.labelSm} block mb-1`}>Your name</label>
            <input
              type="text"
              autoFocus
              value={data.adminName}
              onChange={(e) => update({ adminName: e.target.value })}
              placeholder="Alex"
              className={`${tw.input} w-full`}
            />
          </div>
          <div>
            <label className={`${tw.labelSm} block mb-1`}>Email address</label>
            <input
              type="email"
              value={data.adminEmail}
              onChange={(e) => update({ adminEmail: e.target.value })}
              placeholder="you@example.com"
              className={`${tw.input} w-full`}
            />
          </div>
          <div>
            <label className={`${tw.labelSm} block mb-1`}>Password</label>
            <input
              type="password"
              value={data.adminPassword}
              onChange={(e) => update({ adminPassword: e.target.value })}
              placeholder="At least 8 characters"
              className={`${tw.input} w-full`}
            />
          </div>
          <div>
            <label className={`${tw.labelSm} block mb-1`}>Confirm password</label>
            <input
              type="password"
              value={data.confirmPassword}
              onChange={(e) => update({ confirmPassword: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const errs = validateStep3();
                  if (errs.length === 0) setStep(4); else setErrors(errs);
                }
              }}
              placeholder="Repeat your password"
              className={`${tw.input} w-full`}
            />
          </div>
        </div>

        {errors.length > 0 && (
          <ul className="mb-4 text-sm text-red-500 dark:text-red-400 space-y-1">
            {errors.map((e) => <li key={e}>• {e}</li>)}
          </ul>
        )}

        <div className="flex justify-between items-center">
          <button onClick={() => setStep(2)} className={tw.btnCancel}>← Back</button>
          <button
            onClick={() => {
              const errs = validateStep3();
              if (errs.length === 0) setStep(4); else setErrors(errs);
            }}
            className={tw.btnPrimary}
          >
            Next →
          </button>
        </div>
      </WizardShell>
    );
  }

  // Step 4 — Language
  if (step === 4) {
    const LANGS = [
      { code: 'en' as const, label: 'English', flag: '🇬🇧' },
      { code: 'sv' as const, label: 'Svenska', flag: '🇸🇪' },
    ];

    return (
      <WizardShell>
        <ProgressBar step={4} total={TOTAL_STEPS} />
        <h1 className={`${tw.pageHeading} mb-1`}>Choose your language</h1>
        <p className={`${tw.muted} mb-6`}>
          This sets the language for both the parent panel and the child screen.
        </p>

        <div className="flex flex-col gap-3 mb-6">
          {LANGS.map((lang) => {
            const selected = data.language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => update({ language: lang.code })}
                className={`flex items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all
                  ${selected
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <span className="text-3xl">{lang.flag}</span>
                <span className="text-base font-medium">{lang.label}</span>
                {selected && <span className="ml-auto text-blue-600 dark:text-blue-400 text-lg">✓</span>}
              </button>
            );
          })}
        </div>

        {setupError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
            {setupError}
            <button
              onClick={() => setSetupError('')}
              className="ml-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button onClick={() => setStep(3)} className={tw.btnCancel}>← Back</button>
          <button
            onClick={() => void handleFinish()}
            disabled={loading}
            className={`${tw.btnPrimary} disabled:opacity-50 min-w-[140px]`}
          >
            {loading ? 'Setting up…' : 'Finish setup →'}
          </button>
        </div>
      </WizardShell>
    );
  }

  // Step 5 — Success
  const urls = buildUrls();
  const multipleAddresses = urls.length > 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className={`w-full max-w-lg ${tw.card} p-8 shadow-lg`}>
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Ebbe is ready!
          </h1>
          <p className={`${tw.secondary}`}>
            Here are the links you'll need. Bookmark them or save them somewhere handy.
          </p>
        </div>

        <div className="flex flex-col gap-6 mb-8">
          {urls.map(({ addr, childUrl, parentUrl }) => (
            <div key={addr} className="flex flex-col gap-3">
              {multipleAddresses && (
                <p className={`${tw.labelSm} font-mono`}>{addr}</p>
              )}
              <UrlCard
                label="Child screen"
                icon="📱"
                url={childUrl}
                copyKey={`child-${addr}`}
                copied={copied}
                onCopy={copyToClipboard}
              />
              <UrlCard
                label="Parent panel"
                icon="👨‍👩‍👧"
                url={parentUrl}
                copyKey={`parent-${addr}`}
                copied={copied}
                onCopy={copyToClipboard}
              />
            </div>
          ))}
        </div>

        {multipleAddresses && (
          <p className={`${tw.muted} mb-6 text-center`}>
            Not sure which address to use? Try opening the links from your phone or tablet on the
            same Wi‑Fi — the right one will load Ebbe straight away.
          </p>
        )}

        <button
          onClick={() => void handleOpenParentPanel()}
          className={`${tw.btnPrimary} w-full py-3 text-base`}
        >
          Open parent panel →
        </button>
      </div>
    </div>
  );
}
