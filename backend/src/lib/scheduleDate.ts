/**
 * Date utilities for schedule items that support both weekly recurrence
 * and specific calendar dates.
 *
 * Day-of-week convention throughout: 0 = Monday … 6 = Sunday (Ebbe)
 * JS Date.getDay() returns 0 = Sunday … 6 = Saturday.
 */

/** Convert JS getDay() → Ebbe day (0=Mon … 6=Sun) */
export function jsToEbbeDay(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

/** Monday 00:00:00 of the week containing `now` (defaults to today) */
export function getWeekStart(now: Date = new Date()): Date {
  const jsDay = now.getDay(); // 0=Sun
  const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** First moment of next Monday (exclusive end of current week) */
export function getWeekEnd(now: Date = new Date()): Date {
  const start = getWeekStart(now);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return end;
}

/**
 * Compute the Ebbe day-of-week at which `item` should appear in the grid
 * for the current week.
 *
 * Rules:
 * - No specificDate → weekly recurrence by `dayOfWeek`, always returns dayOfWeek.
 * - isRecurring=false + specificDate → one-time; returns the effective weekday
 *   only if the date falls in the current week, otherwise null.
 * - isRecurring=true + specificDate → annual on that month/day; returns the
 *   effective weekday if that date falls in the current week (this year or next
 *   for end-of-year edge cases), otherwise null.
 */
export function getEffectiveDayOfWeek(item: {
  dayOfWeek: number;
  isRecurring: boolean;
  specificDate?: number | null;
}, now: Date = new Date()): number | null {
  if (!item.specificDate) {
    // Pure weekly – always visible
    return item.dayOfWeek;
  }

  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);
  const anchor = new Date(item.specificDate);

  if (!item.isRecurring) {
    // One-time: the item only appears during its specific week
    if (anchor >= weekStart && anchor < weekEnd) {
      return jsToEbbeDay(anchor.getDay());
    }
    return null;
  }

  // Annual recurrence: check this year's occurrence and the next (for weeks
  // that span the new year boundary).
  for (const year of [weekStart.getFullYear(), weekStart.getFullYear() + 1]) {
    const occurrence = new Date(year, anchor.getMonth(), anchor.getDate());
    if (occurrence >= weekStart && occurrence < weekEnd) {
      return jsToEbbeDay(occurrence.getDay());
    }
  }
  return null;
}

/**
 * Filter and resolve a list of schedule items for display in the current week.
 *
 * - Pure weekly items (no specificDate) always pass through with their dayOfWeek.
 * - Date-specific items only appear if they fall within the current week.
 * - Returns each matching item augmented with `effectiveDayOfWeek`.
 */
export function resolveItemsForWeek<T extends {
  dayOfWeek: number;
  isRecurring: boolean;
  specificDate?: number | null;
}>(items: T[], now: Date = new Date()): (T & { effectiveDayOfWeek: number })[] {
  const result: (T & { effectiveDayOfWeek: number })[] = [];
  for (const item of items) {
    const day = getEffectiveDayOfWeek(item, now);
    if (day !== null) {
      result.push({ ...item, effectiveDayOfWeek: day });
    }
  }
  return result;
}
