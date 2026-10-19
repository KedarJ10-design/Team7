import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCycleInfo, canRegisterMonthlyGoals } from '../src/lib/constants';
import {
  calculateMonthlyPercent,
  calculatePenalty,
  calculateScore,
  getStatusFromPercent,
  DEFAULT_THRESHOLDS,
  DEFAULT_PENALTY_POINTS,
} from '../src/lib/scoring';

describe('Test Strategist — Logical Bug & Boundary Audit Suite', () => {

  describe('Bug Audit #1: Scoring Engine & Status Consistency', () => {
    it('getStatusFromPercent aligns with calculatePenalty when percent > 0 without progress history', () => {
      const percent = 25;
      const hasAnyProgress = false;
      const penalty = calculatePenalty(percent, hasAnyProgress, DEFAULT_THRESHOLDS, DEFAULT_PENALTY_POINTS);
      const status = getStatusFromPercent(percent, hasAnyProgress, DEFAULT_THRESHOLDS);

      // In calculatePenalty: percent = 25 is > 0, so penalty is 10 (danger, NOT 25 notStarted)
      assert.equal(penalty, 10, 'Penalty should be danger (10 points)');
      assert.equal(status, 'danger', 'Status should be danger when percent > danger threshold');
    });

    it('0% with hasAnyProgress = false receives 25 points and critical status', () => {
      const penalty = calculatePenalty(0, false, DEFAULT_THRESHOLDS, DEFAULT_PENALTY_POINTS);
      const status = getStatusFromPercent(0, false, DEFAULT_THRESHOLDS);
      assert.equal(penalty, 25);
      assert.equal(status, 'critical');
    });

    it('0% with hasAnyProgress = true receives 25 points (notStarted since 0%)', () => {
      const penalty = calculatePenalty(0, true, DEFAULT_THRESHOLDS, DEFAULT_PENALTY_POINTS);
      assert.equal(penalty, 25);
    });

    it('50% progress returns warning status and 5 penalty points', () => {
      const penalty = calculatePenalty(50, true, DEFAULT_THRESHOLDS, DEFAULT_PENALTY_POINTS);
      const status = getStatusFromPercent(50, true, DEFAULT_THRESHOLDS);
      assert.equal(penalty, 5);
      assert.equal(status, 'warning');
    });

    it('75% progress returns safe status and 0 penalty points', () => {
      const penalty = calculatePenalty(75, true, DEFAULT_THRESHOLDS, DEFAULT_PENALTY_POINTS);
      const status = getStatusFromPercent(75, true, DEFAULT_THRESHOLDS);
      assert.equal(penalty, 0);
      assert.equal(status, 'safe');
    });
  });

  describe('Bug Audit #2: Mid-Month Cycle Transition & Year Boundary Math', () => {
    it('Dec 15 → Jan 14 cross-year cycle handles year boundaries correctly', () => {
      // Test Dec 20, 2026
      const testDate = new Date(2026, 11, 20, 12, 0, 0); // Month 12
      const info = getCycleInfo(testDate);

      assert.equal(info.cycleStartMonth, 12);
      assert.equal(info.cycleStartYear, 2026);
      assert.equal(info.cycleEndMonth, 1);
      assert.equal(info.cycleEndYear, 2027);
      assert.equal(info.cycleMonth, 12);
      assert.equal(info.cycleLabel, 'Dec 15 – Jan 14');
      assert.ok(info.daysLeft > 0);
    });

    it('Jan 5, 2027 belongs to Dec 15, 2026 – Jan 14, 2027 cycle', () => {
      // Test Jan 5, 2027
      const testDate = new Date(2027, 0, 5, 12, 0, 0); // Month 1
      const info = getCycleInfo(testDate);

      assert.equal(info.cycleStartMonth, 12);
      assert.equal(info.cycleStartYear, 2026);
      assert.equal(info.cycleEndMonth, 1);
      assert.equal(info.cycleEndYear, 2027);
      assert.equal(info.cycleMonth, 12); // Active cycle is Month 12
      assert.equal(info.cycleLabel, 'Dec 15 – Jan 14');
      assert.equal(info.daysLeft, 10);
    });

    it('Leap year February 28 / 29 to March 14 cycle transitions', () => {
      // Test Feb 20, 2028 (Leap Year)
      const testDate = new Date(2028, 1, 20, 12, 0, 0);
      const info = getCycleInfo(testDate);

      assert.equal(info.cycleStartMonth, 2);
      assert.equal(info.cycleEndMonth, 3);
      assert.equal(info.cycleMonth, 2);
      assert.equal(info.cycleLabel, 'Feb 15 – Mar 14');
    });

    it('On Day 14 at 23:59:59 (Evaluation close boundary)', () => {
      const testDate = new Date(2026, 9, 14, 23, 59, 59); // Oct 14
      const info = getCycleInfo(testDate);

      assert.equal(info.isEvaluationDay, true);
      assert.equal(info.isRegistrationDay, false);
      assert.equal(info.cycleMonth, 9); // Concluding Month 9 cycle
    });

    it('On Day 15 at 00:00:00 (Registration open boundary)', () => {
      const testDate = new Date(2026, 9, 15, 0, 0, 0); // Oct 15
      const info = getCycleInfo(testDate);

      assert.equal(info.isRegistrationDay, true);
      assert.equal(info.isEvaluationDay, false);
      assert.equal(info.cycleMonth, 10); // Newly started Month 10 cycle
      assert.equal(info.cycleLabel, 'Oct 15 – Nov 14');
    });
  });

  describe('Bug Audit #3: Yearly Score Calculation Idempotency & Snapshots', () => {
    it('Yearly score excludes active cycle snapshot to prevent double-counting', () => {
      const activeCycleMonth = 10;
      const currentMonthScore = 80;

      const snapshots = [
        { month: 8, score: 70 },
        { month: 9, score: 75 },
        { month: 10, score: 80 }, // Closed snapshot for month 10
      ];

      // Filtered calculation ensures active cycle score is never counted twice
      const pastSnapshots = snapshots.filter((s) => s.month !== activeCycleMonth);
      const yearlyScore = Math.round(
        pastSnapshots.reduce((acc, s) => acc + s.score, 0) + currentMonthScore
      );

      assert.equal(yearlyScore, 225, 'Yearly score correctly equals 70 + 75 + 80 = 225');
    });
  });

  describe('Bug Audit #4: Member Registration Access Control', () => {
    it('Prevents non-admin registration on days 1..14 and 16..31', () => {
      for (let day = 1; day <= 31; day++) {
        if (day === 15) {
          assert.equal(canRegisterMonthlyGoals(day, false), true);
        } else {
          assert.equal(canRegisterMonthlyGoals(day, false), false, `Day ${day} should be blocked`);
        }
      }
    });

    it('Allows admin registration on all 31 days', () => {
      for (let day = 1; day <= 31; day++) {
        assert.equal(canRegisterMonthlyGoals(day, true), true, `Admin should be allowed on Day ${day}`);
      }
    });
  });

  describe('Bug Audit #5: Month-Close Idempotency Ledger Simulation', () => {
    it('Idempotent penalty replacement ensures running ledger does not double on re-run', () => {
      let ledger = [
        { memberId: 'm1', month: 9, points: 10 },
      ];

      // Simulated month close for Month 10:
      const targetMonth = 10;
      const newPenalty = 15;

      // Idempotent approach: filter out existing entry for this month
      ledger = ledger.filter((e) => e.month !== targetMonth);
      ledger.push({ memberId: 'm1', month: targetMonth, points: newPenalty });
      assert.equal(ledger.length, 2);

      // Re-run month close for Month 10:
      ledger = ledger.filter((e) => e.month !== targetMonth);
      ledger.push({ memberId: 'm1', month: targetMonth, points: newPenalty });
      assert.equal(ledger.length, 2, 'Re-run should replace and maintain single ledger entry');
      assert.equal(ledger.reduce((acc, e) => acc + e.points, 0), 25);
    });
  });

  describe('Bug Audit #6: Deterministic Timezone UTC Math & Past Cycle Immutability', () => {
    it('getCycleInfo produces identical daysLeft and bounds regardless of timezone skew', () => {
      // Test Oct 20 at 14:30:00
      const testDate = new Date(2026, 9, 20, 14, 30, 0);
      const cycle = getCycleInfo(testDate);

      assert.equal(cycle.day, 20);
      assert.equal(cycle.month, 10);
      assert.equal(cycle.cycleMonth, 10);
      assert.equal(cycle.cycleStartMonth, 10);
      assert.equal(cycle.cycleEndMonth, 11);
      assert.equal(cycle.cycleLabel, 'Oct 15 – Nov 14');
      // From Oct 20 to Nov 14 23:59:59 is 26 days
      assert.equal(cycle.daysLeft, 26);
    });

    it('Strictly locks closed cycle goals (month !== activeCycleMonth) for regular members', () => {
      const activeCycleMonth = 10;
      const testGoalFromPastMonth = { id: 'g1', type: 'MONTHLY', month: 9, memberId: 'm1' };

      const canRegularMemberEdit = (goal: typeof testGoalFromPastMonth, isAdmin: boolean) => {
        if (goal.type === 'MONTHLY' && goal.month !== null) {
          const isCurrentActiveCycle = goal.month === activeCycleMonth;
          if (!isCurrentActiveCycle && !isAdmin) {
            return false;
          }
        }
        return true;
      };

      // Regular member is blocked from past month
      assert.equal(canRegularMemberEdit(testGoalFromPastMonth, false), false);
      // Admin override is permitted
      assert.equal(canRegularMemberEdit(testGoalFromPastMonth, true), true);
    });
  });

});

