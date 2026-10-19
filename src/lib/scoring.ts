// ═══════════════════════════════════════════
// Scoring Engine — Monthly %, Penalties, Scores
// ═══════════════════════════════════════════

import { PenaltyThresholds, PenaltyPointValues } from '@/types';

/**
 * Calculate the equal-weight average of monthly goal progress.
 * Each goal has equal weight: N goals = 100/N% weight each.
 * Returns 0 if no goals exist.
 */
export function calculateMonthlyPercent(goalProgressValues: number[]): number {
  if (goalProgressValues.length === 0) return 0;
  const sum = goalProgressValues.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / goalProgressValues.length);
}

/**
 * Determine penalty points based on monthly average %.
 *
 * Boundary rules (from the client spec):
 * - ≥ 75% → 0 (safe)
 * - 50% to < 75% → 5 (warning)
 * - > 0% to < 50% → 10 (danger)
 * - 0% with no progress recorded → 25 (not started)
 *
 * "Not started" means 0% AND no progress updates were ever recorded.
 */
export function calculatePenalty(
  percent: number,
  hasAnyProgress: boolean,
  thresholds: PenaltyThresholds,
  points: PenaltyPointValues
): number {
  if (percent >= thresholds.safe) return points.safe;          // ≥ 75 → 0
  if (percent >= thresholds.warning) return points.warning;    // 50–74 → 5
  if (percent > thresholds.danger && hasAnyProgress) return points.danger; // 1–49 → 10
  if (percent > 0) return points.danger;                       // > 0 but no updates → 10
  return points.notStarted;                                    // 0 with no progress → 25
}

/**
 * Calculate monthly score: round(monthly %) − penalty points.
 * Can be negative if penalty exceeds percent.
 */
export function calculateScore(percent: number, penalty: number): number {
  return Math.round(percent) - penalty;
}

/**
 * Get status color category based on monthly percent.
 */
export function getStatusFromPercent(
  percent: number,
  hasAnyProgress: boolean,
  thresholds: PenaltyThresholds
): 'safe' | 'warning' | 'danger' | 'critical' {
  if (percent >= thresholds.safe) return 'safe';
  if (percent >= thresholds.warning) return 'warning';
  if (percent > thresholds.danger) return 'danger';
  return 'critical';
}

/**
 * Default thresholds (used if settings can't be loaded)
 */
export const DEFAULT_THRESHOLDS: PenaltyThresholds = {
  safe: 75,
  warning: 50,
  danger: 0,
};

export const DEFAULT_PENALTY_POINTS: PenaltyPointValues = {
  safe: 0,
  warning: 5,
  danger: 10,
  notStarted: 25,
};
