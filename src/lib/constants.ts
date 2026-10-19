// ═══════════════════════════════════════════
// Constants — Colors, defaults, and config
// ═══════════════════════════════════════════

export const STATUS_COLORS = {
  safe: '#22c55e',
  warning: '#f59e0b',
  danger: '#f97316',
  critical: '#ef4444',
} as const;

export const AVATAR_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#3b82f6', // blue
] as const;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
] as const;

export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/**
 * Get the current month (1-12) and year in IST
 */
export function getCurrentIST(): { month: number; year: number; day: number; date: Date } {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istDate = new Date(now.getTime() + istOffset);
  return {
    month: istDate.getUTCMonth() + 1,
    year: istDate.getUTCFullYear(),
    day: istDate.getUTCDate(),
    date: istDate,
  };
}

/**
 * Calculate days until cutoff for a given month
 */
export function getDaysUntilCutoff(cutoffDay: number): number {
  const { day, month, year } = getCurrentIST();
  if (day > cutoffDay) return 0; // Cutoff has passed
  
  const cutoffDate = new Date(year, month - 1, cutoffDay);
  const today = new Date(year, month - 1, day);
  const diffTime = cutoffDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if the current date is before the cutoff
 */
export function isBeforeCutoff(cutoffDay: number): boolean {
  const { day } = getCurrentIST();
  return day <= cutoffDay;
}

export interface CycleInfo {
  day: number;
  month: number;
  year: number;
  cycleMonth: number;
  cycleYear: number;
  cycleStartMonth: number;
  cycleStartYear: number;
  cycleEndMonth: number;
  cycleEndYear: number;
  isRegistrationDay: boolean;
  isEvaluationDay: boolean;
  daysLeft: number;
  cycleLabel: string;
}

/**
 * Get the current 30-day mid-month tracking cycle info (15th to 14th)
 */
export function getCycleInfo(testDate?: Date): CycleInfo {
  const istOffset = 5.5 * 60 * 60 * 1000;
  let year: number;
  let month: number;
  let day: number;
  let currentMs: number;

  if (testDate) {
    year = testDate.getFullYear();
    month = testDate.getMonth() + 1;
    day = testDate.getDate();
    currentMs = Date.UTC(year, month - 1, day, testDate.getHours(), testDate.getMinutes(), testDate.getSeconds());
  } else {
    const now = new Date();
    const istInstant = new Date(now.getTime() + istOffset);
    year = istInstant.getUTCFullYear();
    month = istInstant.getUTCMonth() + 1;
    day = istInstant.getUTCDate();
    currentMs = Date.UTC(year, month - 1, day, istInstant.getUTCHours(), istInstant.getUTCMinutes(), istInstant.getUTCSeconds());
  }

  const isRegistrationDay = day === 15;
  const isEvaluationDay = day === 14;

  let cycleStartMonth = month;
  let cycleStartYear = year;
  let cycleEndMonth = month === 12 ? 1 : month + 1;
  let cycleEndYear = month === 12 ? year + 1 : year;
  let cycleMonth = month;
  let cycleYear = year;

  if (day < 15) {
    cycleStartMonth = month === 1 ? 12 : month - 1;
    cycleStartYear = month === 1 ? year - 1 : year;
    cycleEndMonth = month;
    cycleEndYear = year;
    cycleMonth = cycleStartMonth;
    cycleYear = cycleStartYear;
  }

  // Target end date in IST is the 14th of cycleEndMonth at 23:59:59
  const endMs = Date.UTC(cycleEndYear, cycleEndMonth - 1, 14, 23, 59, 59);
  const diffMs = endMs - currentMs;
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    day,
    month,
    year,
    cycleMonth,
    cycleYear,
    cycleStartMonth,
    cycleStartYear,
    cycleEndMonth,
    cycleEndYear,
    isRegistrationDay,
    isEvaluationDay,
    daysLeft,
    cycleLabel: `${MONTH_SHORT[cycleStartMonth - 1]} 15 – ${MONTH_SHORT[cycleEndMonth - 1]} 14`,
  };
}

/**
 * Check if registration for new monthly goals is open (only 1 day: the 15th, or admin)
 */
export function canRegisterMonthlyGoals(day: number, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  return day === 15;
}

