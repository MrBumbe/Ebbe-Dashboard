/**
 * Ebbe — semantic Tailwind class tokens.
 *
 * Every string value below is a list of FULL Tailwind class names so that the
 * Tailwind CLI can detect them during the content scan and include them in the
 * compiled CSS.  Do NOT build class names dynamically (e.g. `bg-${color}-100`)
 * — always use the literal strings defined here.
 *
 * Usage in JSX:
 *   import { tw } from '../../lib/theme';
 *   <h1 className={tw.pageHeading}>...</h1>
 *   <div className={`${tw.card} ${tw.cardDivide} mb-6`}>...</div>
 *   <input className={`${tw.input} w-full`} />
 */
export const tw = {
  // ── Typography ─────────────────────────────────────────────────────────────
  /** Page-level h1 */
  pageHeading:    'text-2xl font-bold text-gray-800 dark:text-gray-100',
  /** Section sub-heading (uppercase label above a list) */
  sectionHeading: 'text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide',
  /** Form field label — medium weight */
  labelMd:        'text-sm font-medium text-gray-700 dark:text-gray-200',
  /** Form field label — small / secondary */
  labelSm:        'text-xs text-gray-600 dark:text-gray-400',
  /** Body copy */
  body:           'text-sm text-gray-700 dark:text-gray-200',
  /** Secondary / supporting text */
  secondary:      'text-sm text-gray-500 dark:text-gray-400',
  /** Muted / hint text */
  muted:          'text-xs text-gray-400 dark:text-gray-500',

  // ── Cards / containers ─────────────────────────────────────────────────────
  /** Standard rounded card with border */
  card:           'bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700',
  /** Adds hairline dividers between child rows */
  cardDivide:     'divide-y divide-gray-50 dark:divide-gray-700',
  /** Tinted header row inside a card (e.g. "Family members" bar) */
  cardHeaderBg:   'bg-gray-50 dark:bg-gray-900/30',
  /** Bottom border for a card header row */
  cardHeaderBorder: 'border-b border-gray-100 dark:border-gray-700',
  /** Form card (slightly stronger border than list card) */
  formCard:       'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-3',

  // ── List rows ──────────────────────────────────────────────────────────────
  /** Hover highlight for list rows */
  listRow:        'hover:bg-gray-50 dark:hover:bg-gray-700/30',

  // ── Inputs / selects ──────────────────────────────────────────────────────
  /** Standard text input */
  input:          'border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
  /** Compact input (smaller padding) */
  inputSm:        'border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
  /** Select / dropdown */
  select:         'border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',

  // ── Buttons ────────────────────────────────────────────────────────────────
  /** Primary action button */
  btnPrimary:     'bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors',
  /** Cancel / secondary text button */
  btnCancel:      'text-sm text-gray-500 dark:text-gray-400 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg',

  // ── Inline badges ─────────────────────────────────────────────────────────
  badgeGreen:     'text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded-md',
  badgeGray:      'text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-md',
  badgeAmber:     'text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-md',
  badgeBlue:      'text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded',
  badgePurple:    'text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded',
} as const;
