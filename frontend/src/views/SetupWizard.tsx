import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { tw } from '../lib/theme';
import i18n from '../i18n';
import EmojiPicker from '../components/EmojiPicker';

// ── Types ─────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface SetupData {
  familyName:      string;
  adminName:       string;
  adminEmail:      string;
  adminPassword:   string;
  confirmPassword: string;
  language:        'en' | 'sv';
}

interface WizardChild {
  localId: string;   // temp key for React list management
  name:    string;
  emoji:   string;
  color:   string;
}

interface ResultChild {
  id:         string;
  name:       string;
  emoji:      string;
  color:      string;
  childToken: string;
  shortPin:   string | null;
}

interface SetupResult {
  children: ResultChild[];
}

// ── Preset colours (same as Children.tsx) ────────────────────────────────

const PRESET_COLORS = [
  { label: 'Blue',   value: '#1565C0' },
  { label: 'Pink',   value: '#C2185B' },
  { label: 'Green',  value: '#2E7D32' },
  { label: 'Purple', value: '#4527A0' },
  { label: 'Orange', value: '#E65100' },
  { label: 'Red',    value: '#C62828' },
  { label: 'Teal',   value: '#00695C' },
  { label: 'Yellow', value: '#F57F17' },
];

// ── QR code image component ───────────────────────────────────────────────

function QrCodeImg({ url, size = 200 }: { url: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    void QRCode.toDataURL(url, { width: size, margin: 2 }).then(setSrc);
  }, [url, size]);

  if (!src) return <div style={{ width: size, height: size }} className="bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" title="Open in new tab">
      <img src={src} alt={`QR code for ${url}`} width={size} height={size} className="rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-90 transition-opacity" />
    </a>
  );
}

// ── Clickable URL field ───────────────────────────────────────────────────

function UrlField({ url, copyKey, copied, onCopy }: {
  url:      string;
  copyKey:  string;
  copied:   string | null;
  onCopy:   (url: string, key: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex-1 text-xs font-mono break-all text-blue-600 dark:text-blue-400 hover:underline bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600"
      >
        {url}
      </a>
      <button
        onClick={() => onCopy(url, copyKey)}
        className="shrink-0 text-xs bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition-colors min-w-[56px]"
      >
        {copied === copyKey ? '✓' : 'Copy'}
      </button>
    </div>
  );
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

// ── Progress bar (steps 2–5 of 5) ────────────────────────────────────────

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

  // Step 5: children to create
  const [wizardChildren, setWizardChildren] = useState<WizardChild[]>([]);
  const [childForm, setChildForm]           = useState({ name: '', emoji: '🧒', color: '#1565C0' });
  const [childFormError, setChildFormError] = useState('');

  // Setup submission
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<SetupResult | null>(null);
  const [setupError, setSetupError] = useState('');
  const [addresses, setAddresses]   = useState<string[]>([]);
  const [copied, setCopied]         = useState<string | null>(null);

  const TOTAL_STEPS = 5; // Steps 2–5 shown in progress bar; step 6 is success

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
    if (!data.adminName.trim())              errs.push('Name is required.');
    if (!data.adminEmail.trim())             errs.push('Email address is required.');
    else if (!/\S+@\S+\.\S+/.test(data.adminEmail)) errs.push('Please enter a valid email address.');
    if (!data.adminPassword)                 errs.push('Password is required.');
    else if (data.adminPassword.length < 8) errs.push('Password must be at least 8 characters.');
    if (data.adminPassword !== data.confirmPassword) errs.push('Passwords do not match.');
    return errs;
  }

  // ── Add child to local list (step 5) ────────────────────────────────────

  function handleAddChild() {
    if (!childForm.name.trim()) { setChildFormError('Name is required.'); return; }
    setWizardChildren((prev) => [
      ...prev,
      { localId: crypto.randomUUID(), name: childForm.name.trim(), emoji: childForm.emoji, color: childForm.color },
    ]);
    setChildForm({ name: '', emoji: '🧒', color: '#1565C0' });
    setChildFormError('');
  }

  function handleRemoveChild(localId: string) {
    setWizardChildren((prev) => prev.filter((c) => c.localId !== localId));
  }

  // ── Setup submission ─────────────────────────────────────────────────────

  async function handleFinish() {
    setLoading(true);
    setSetupError('');

    // Apply language immediately — persists across the full-page reload to /parent
    localStorage.setItem('ebbe_lang', data.language);
    void i18n.changeLanguage(data.language);

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
          children:      wizardChildren.map(({ name, emoji, color }) => ({ name, emoji, color })),
        }),
      });

      const setupJson = await setupRes.json() as {
        data?: { children: ResultChild[] };
        error?: { message: string };
      };

      if (!setupRes.ok) {
        setSetupError(setupJson.error?.message ?? 'Setup failed. Please try again.');
        setLoading(false);
        return;
      }

      setResult({ children: setupJson.data!.children ?? [] });

      // Fetch LAN addresses to build display URLs
      try {
        const infoRes  = await fetch('/api/v1/system/info');
        const infoJson = await infoRes.json() as { data: { localAddresses: string[] } };
        setAddresses(infoJson.data.localAddresses ?? []);
      } catch { /* ignore — fall back to localhost */ }

      setStep(6);
    } catch {
      setSetupError('Network error. Make sure the server is running and try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Auto-login + navigate to parent panel ────────────────────────────────

  async function handleOpenParentPanel() {
    // Language is already set in localStorage from handleFinish()
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
      }
    } catch { /* ignore — still navigate */ }
    window.location.href = '/parent';
  }

  // ── URL builders ─────────────────────────────────────────────────────────

  const primaryAddr = addresses.length > 0 ? addresses[0] : 'localhost';

  function childFullUrl(token: string) {
    return `http://${primaryAddr}/child?token=${token}`;
  }

  function childShortUrl(pin: string) {
    return `http://${primaryAddr}/c/${pin}`;
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

        <div className="flex justify-between items-center">
          <button onClick={() => setStep(3)} className={tw.btnCancel}>← Back</button>
          <button onClick={() => setStep(5)} className={tw.btnPrimary}>Next →</button>
        </div>
      </WizardShell>
    );
  }

  // Step 5 — Add children
  if (step === 5) {
    return (
      <WizardShell>
        <ProgressBar step={5} total={TOTAL_STEPS} />
        <h1 className={`${tw.pageHeading} mb-1`}>Add your children</h1>
        <p className={`${tw.muted} mb-5`}>
          Add at least one child to get started. You can always add more later from the parent panel.
        </p>

        {/* Added children list */}
        {wizardChildren.length > 0 && (
          <ul className={`${tw.card} ${tw.cardDivide} mb-4`}>
            {wizardChildren.map((child) => (
              <li key={child.localId} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl">{child.emoji}</span>
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-white/30"
                  style={{ backgroundColor: child.color }}
                />
                <span className={`flex-1 text-sm font-medium ${tw.body}`}>{child.name}</span>
                <button
                  onClick={() => handleRemoveChild(child.localId)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Inline add-child form */}
        <div className={`${tw.formCard} mb-5`}>
          <p className={`text-xs font-semibold ${tw.secondary} uppercase tracking-wide`}>Add a child</p>
          <div className="flex gap-2 items-center">
            <EmojiPicker
              value={childForm.emoji}
              onChange={(e) => setChildForm((f) => ({ ...f, emoji: e }))}
            />
            <input
              type="text"
              placeholder="Child's name"
              value={childForm.name}
              onChange={(e) => { setChildForm((f) => ({ ...f, name: e.target.value })); setChildFormError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddChild()}
              className={`flex-1 ${tw.input}`}
            />
          </div>
          {/* Colour swatches */}
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => setChildForm((f) => ({ ...f, color: c.value }))}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${childForm.color === c.value ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
          {childFormError && <p className="text-xs text-red-500 dark:text-red-400">{childFormError}</p>}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddChild}
              className={tw.btnPrimary}
            >
              + Add child
            </button>
          </div>
        </div>

        {setupError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
            {setupError}
          </div>
        )}

        <div className="flex justify-between items-center">
          <button onClick={() => setStep(4)} className={tw.btnCancel}>← Back</button>
          <button
            onClick={() => void handleFinish()}
            disabled={loading || wizardChildren.length === 0}
            className={`${tw.btnPrimary} disabled:opacity-50 min-w-[140px]`}
          >
            {loading ? 'Setting up…' : 'Next →'}
          </button>
        </div>
      </WizardShell>
    );
  }

  // Step 6 — Done / Success screen
  const children = result?.children ?? [];
  const multipleAddresses = addresses.length > 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-start justify-center p-4 py-10">
      <div className={`w-full max-w-xl ${tw.card} p-8 shadow-lg`}>

        {/* Heading */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Ebbe is ready!
          </h1>
          <p className={tw.secondary}>
            Here are the links you'll need. Scan the QR code with the child's device or copy the URL.
          </p>
        </div>

        {/* Per-child sections */}
        <div className="flex flex-col gap-8 mb-8">
          {children.map((child) => {
            const fullUrl  = childFullUrl(child.childToken);
            const shortUrl = child.shortPin ? childShortUrl(child.shortPin) : null;

            return (
              <div key={child.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-5">
                {/* Child header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{child.emoji}</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{child.name}</p>
                    <p className={tw.muted}>📱 Child screen</p>
                  </div>
                </div>

                {/* QR code + URLs side by side on wider screens, stacked on mobile */}
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* QR code */}
                  <div className="shrink-0">
                    <QrCodeImg url={fullUrl} size={180} />
                  </div>

                  {/* URLs */}
                  <div className="flex-1 flex flex-col gap-3 min-w-0">
                    {shortUrl && (
                      <div>
                        <p className={`${tw.labelSm} mb-1`}>Short URL <span className="text-gray-400">(easy to type)</span></p>
                        <UrlField
                          url={shortUrl}
                          copyKey={`short-${child.id}`}
                          copied={copied}
                          onCopy={copyToClipboard}
                        />
                      </div>
                    )}
                    <div>
                      <p className={`${tw.labelSm} mb-1`}>Full URL <span className="text-gray-400">(most secure)</span></p>
                      <UrlField
                        url={fullUrl}
                        copyKey={`full-${child.id}`}
                        copied={copied}
                        onCopy={copyToClipboard}
                      />
                    </div>
                    {shortUrl && (
                      <p className={tw.muted}>
                        The short URL is convenient on your local network. The full URL works everywhere.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Parent panel URL */}
        <div className={`bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6`}>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">👨‍👩‍👧 Parent panel</p>
          <UrlField
            url={`http://${primaryAddr}/parent`}
            copyKey="parent"
            copied={copied}
            onCopy={copyToClipboard}
          />
        </div>

        {multipleAddresses && (
          <p className={`${tw.muted} mb-6 text-center`}>
            Multiple network addresses found ({addresses.join(', ')}). Try opening the links from your
            phone or tablet on the same Wi‑Fi — the right one will load Ebbe straight away.
          </p>
        )}

        {/* Reassuring note */}
        <p className={`${tw.muted} mb-6 text-center`}>
          Don't worry about saving these links right now — you can always find them later in the
          Children section of the parent panel.
        </p>

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
