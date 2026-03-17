import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useTranslation } from 'react-i18next';
import client from '../../api/client';
import EmojiPicker from '../../components/EmojiPicker';
import { tw } from '../../lib/theme';

interface Child {
  id: string;
  name: string;
  emoji: string;
  color: string;
  birthdate: number | null;
  childToken: string;
  shortPin: string | null;
  createdAt: number;
}

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

interface FormState {
  name: string;
  emoji: string;
  color: string;
  birthdate: string; // ISO date string for <input type="date">
}

const DEFAULT_FORM: FormState = {
  name: '',
  emoji: '🧒',
  color: '#1565C0',
  birthdate: '',
};

// ── QR code inline image ────────────────────────────────────────────────────

function QrCodeImg({ url, size = 180 }: { url: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    void QRCode.toDataURL(url, { width: size, margin: 2 }).then(setSrc);
  }, [url, size]);

  if (!src) return <div style={{ width: size, height: size }} className="bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" title="Open child screen">
      <img src={src} alt="QR code" width={size} height={size} className="rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-90 transition-opacity" />
    </a>
  );
}

// ── ChildForm at module level — prevents focus loss on keystroke ───────────
// Defining the form component inside Children() would create a new component
// type on every render, unmounting and remounting the input on each keystroke.

interface ChildFormProps {
  form: FormState;
  onChange: (f: FormState) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  submitLabel: string;
  onCancel: () => void;
}

function ChildForm({ form, onChange, onSubmit, submitLabel, onCancel }: ChildFormProps) {
  const { t } = useTranslation();
  return (
    <form onSubmit={(e) => void onSubmit(e)} className={`${tw.formCard} mb-4`}>
      <div className="flex gap-3">
        <EmojiPicker value={form.emoji} onChange={(e) => onChange({ ...form, emoji: e })} />
        <input
          required
          placeholder={t('parent.children.namePlaceholder')}
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          className={`flex-1 ${tw.input}`}
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange({ ...form, color: c.value })}
            className={`w-8 h-8 rounded-full border-2 transition-transform ${form.color === c.value ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
            style={{ backgroundColor: c.value }}
            title={c.label}
          />
        ))}
      </div>
      <div>
        <label className={`${tw.labelSm} mb-1 block`}>{t('parent.children.birthdate')}</label>
        <input
          type="date"
          value={form.birthdate}
          onChange={(e) => onChange({ ...form, birthdate: e.target.value })}
          className={tw.inputSm}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className={tw.btnCancel}>{t('parent.children.cancel')}</button>
        <button type="submit" className={tw.btnPrimary}>{submitLabel}</button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Children() {
  const { t } = useTranslation();
  const [childList, setChildList] = useState<Child[]>([]);
  const [adding, setAdding]       = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState<FormState>(DEFAULT_FORM);
  const [copiedId, setCopiedId]   = useState<string | null>(null);
  const [qrChildId, setQrChildId] = useState<string | null>(null); // which child's QR is expanded

  async function load() {
    const res = await client.get<{ data: Child[] }>('/children');
    setChildList(res.data.data);
  }

  useEffect(() => { void load(); }, []);

  function cancelForm() {
    setAdding(false);
    setEditId(null);
    setForm(DEFAULT_FORM);
  }

  function startEdit(child: Child) {
    setEditId(child.id);
    setAdding(false);
    setForm({
      name: child.name,
      emoji: child.emoji,
      color: child.color,
      birthdate: child.birthdate
        ? new Date(child.birthdate).toISOString().slice(0, 10)
        : '',
    });
  }

  function buildPayload(f: FormState) {
    return {
      name:      f.name,
      emoji:     f.emoji,
      color:     f.color,
      birthdate: f.birthdate ? new Date(f.birthdate).getTime() : null,
    };
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await client.post('/children', buildPayload(form));
    cancelForm();
    await load();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    await client.patch(`/children/${editId}`, buildPayload(form));
    cancelForm();
    await load();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(t('parent.children.confirmDelete', { name }))) return;
    await client.delete(`/children/${id}`);
    await load();
  }

  async function copyUrl(child: Child) {
    const url = `${window.location.origin}/child?token=${child.childToken}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(child.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function toggleQr(id: string) {
    setQrChildId((prev) => (prev === id ? null : id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className={tw.pageHeading}>{t('parent.children.title')}</h1>
        {!adding && !editId && (
          <button
            onClick={() => { setAdding(true); setForm(DEFAULT_FORM); }}
            className={tw.btnPrimary}
          >
            + {t('parent.children.add')}
          </button>
        )}
      </div>

      {adding && (
        <ChildForm
          form={form}
          onChange={setForm}
          onSubmit={handleAdd}
          submitLabel={t('parent.tasks.save')}
          onCancel={cancelForm}
        />
      )}

      <div className={`${tw.card} ${tw.cardDivide}`}>
        {childList.length === 0 && (
          <div className={`px-4 py-8 text-center ${tw.muted}`}>{t('parent.children.empty')}</div>
        )}
        {childList.map((child) => {
          const kioskUrl = `${window.location.origin}/child?token=${child.childToken}`;
          return (
            <div key={child.id}>
              {editId === child.id ? (
                <div className="p-3">
                  <ChildForm
                    form={form}
                    onChange={setForm}
                    onSubmit={handleEdit}
                    submitLabel={t('parent.tasks.save')}
                    onCancel={cancelForm}
                  />
                </div>
              ) : (
                <div className="px-4 py-3 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{child.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${tw.body}`}>{child.name}</span>
                        <span
                          className="w-3 h-3 rounded-full inline-block border border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: child.color }}
                        />
                      </div>
                      {child.birthdate && (
                        <p className={`${tw.muted} mt-0.5`}>
                          {t('parent.children.born')}: {new Date(child.birthdate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button onClick={() => startEdit(child)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1">
                      {t('parent.users.edit')}
                    </button>
                    <button onClick={() => void handleDelete(child.id, child.name)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1">
                      {t('parent.tasks.delete')}
                    </button>
                  </div>

                  {/* Kiosk URL */}
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <code className={`flex-1 text-xs truncate ${tw.secondary}`}>
                      {kioskUrl}
                    </code>
                    <button
                      onClick={() => void copyUrl(child)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${copiedId === child.id ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-200 dark:border-gray-500'}`}
                    >
                      {copiedId === child.id ? '✓ ' + t('parent.children.copied') : t('parent.children.copy')}
                    </button>
                    <button
                      onClick={() => toggleQr(child.id)}
                      className={`text-xs px-2 py-1 rounded transition-colors bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 border border-gray-200 dark:border-gray-500`}
                      title="Show QR code"
                    >
                      {qrChildId === child.id ? t('parent.children.hideQr') : t('parent.children.showQr')}
                    </button>
                  </div>

                  {/* Short URL */}
                  {child.shortPin && (
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                      <span className={`${tw.muted} text-xs shrink-0`}>Short:</span>
                      <code className={`flex-1 text-xs truncate ${tw.secondary}`}>
                        {window.location.origin}/c/{child.shortPin}
                      </code>
                    </div>
                  )}

                  {/* QR code — expanded inline */}
                  {qrChildId === child.id && (
                    <div className="flex flex-col items-center gap-2 py-3">
                      <QrCodeImg url={kioskUrl} size={180} />
                      <p className={`${tw.muted} text-center max-w-xs`}>
                        {t('parent.children.qrHint')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className={`${tw.muted} mt-4`}>{t('parent.children.tokenHint')}</p>
    </div>
  );
}
