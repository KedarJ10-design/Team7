import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCycleInfo, canRegisterMonthlyGoals } from '../src/lib/constants';

describe('30-Day Mid-Month Goal Lifecycle Tests (15th to 14th)', () => {
  describe('Registration Window (1-day on the 15th)', () => {
    it('Allows goal registration on the 15th for regular members', () => {
      const allowed = canRegisterMonthlyGoals(15, false);
      assert.equal(allowed, true);
    });

    it('Blocks goal registration on the 16th for regular members', () => {
      const allowed = canRegisterMonthlyGoals(16, false);
      assert.equal(allowed, false);
    });

    it('Blocks goal registration on the 1st for regular members', () => {
      const allowed = canRegisterMonthlyGoals(1, false);
      assert.equal(allowed, false);
    });

    it('Allows goal registration on ANY day for Admins (Admin Override)', () => {
      assert.equal(canRegisterMonthlyGoals(1, true), true);
      assert.equal(canRegisterMonthlyGoals(10, true), true);
      assert.equal(canRegisterMonthlyGoals(15, true), true);
      assert.equal(canRegisterMonthlyGoals(20, true), true);
      assert.equal(canRegisterMonthlyGoals(31, true), true);
    });
  });

  describe('Cycle Bounds & Date Calculations (15th to 14th)', () => {
    it('On the 15th: cycle starts, isRegistrationDay is true, end month is next month', () => {
      // Test Oct 15, 2026
      const testDate = new Date(2026, 9, 15, 10, 0, 0); // month is 0-indexed in JS Date: 9 = October
      const info = getCycleInfo(testDate);

      assert.equal(info.day, 15);
      assert.equal(info.isRegistrationDay, true);
      assert.equal(info.isEvaluationDay, false);
      assert.equal(info.cycleStartMonth, 10); // Oct
      assert.equal(info.cycleEndMonth, 11);   // Nov
      assert.equal(info.cycleMonth, 10);      // Active cycle is Month 10
      assert.equal(info.cycleLabel, 'Oct 15 – Nov 14');
      assert.ok(info.daysLeft >= 30);
    });

    it('On the 19th: mid-cycle, isRegistrationDay is false, 30-day update active', () => {
      // Test Oct 19, 2026
      const testDate = new Date(2026, 9, 19, 10, 0, 0);
      const info = getCycleInfo(testDate);

      assert.equal(info.day, 19);
      assert.equal(info.isRegistrationDay, false);
      assert.equal(info.isEvaluationDay, false);
      assert.equal(info.cycleStartMonth, 10);
      assert.equal(info.cycleEndMonth, 11);
      assert.equal(info.cycleLabel, 'Oct 15 – Nov 14');
      assert.equal(info.daysLeft, 27);
    });

    it('On the 14th: evaluation day, isEvaluationDay is true', () => {
      // Test Nov 14, 2026
      const testDate = new Date(2026, 10, 14, 10, 0, 0); // 10 = November
      const info = getCycleInfo(testDate);

      assert.equal(info.day, 14);
      assert.equal(info.isRegistrationDay, false);
      assert.equal(info.isEvaluationDay, true);
      assert.equal(info.cycleStartMonth, 10); // Started in Oct
      assert.equal(info.cycleEndMonth, 11);   // Concludes Nov 14
      assert.equal(info.cycleLabel, 'Oct 15 – Nov 14');
    });

    it('On Day 5: belongs to cycle that started on 15th of previous month', () => {
      // Test Nov 5, 2026
      const testDate = new Date(2026, 10, 5, 10, 0, 0);
      const info = getCycleInfo(testDate);

      assert.equal(info.day, 5);
      assert.equal(info.isRegistrationDay, false);
      assert.equal(info.cycleStartMonth, 10); // Oct 15
      assert.equal(info.cycleEndMonth, 11);   // Nov 14
      assert.equal(info.cycleMonth, 10);
      assert.equal(info.cycleLabel, 'Oct 15 – Nov 14');
      assert.equal(info.daysLeft, 10);
    });
  });

  describe('Dynamic Cutoff Day Configuration (e.g. 20th to 19th)', () => {
    it('Allows goal registration on the 20th when cutoffDay is 20', () => {
      assert.equal(canRegisterMonthlyGoals(20, false, 20), true);
      assert.equal(canRegisterMonthlyGoals(15, false, 20), false);
      assert.equal(canRegisterMonthlyGoals(21, false, 20), false);
    });

    it('Computes dynamic 20th-19th cycle bounds correctly on start day', () => {
      // Test Oct 20, 2026 with cutoffDay = 20
      const testDate = new Date(2026, 9, 20, 10, 0, 0); // Oct 20
      const info = getCycleInfo(20, testDate);

      assert.equal(info.day, 20);
      assert.equal(info.cutoffDay, 20);
      assert.equal(info.settlementDay, 19);
      assert.equal(info.isRegistrationDay, true);
      assert.equal(info.isEvaluationDay, false);
      assert.equal(info.cycleStartMonth, 10); // Oct
      assert.equal(info.cycleEndMonth, 11);   // Nov
      assert.equal(info.cycleLabel, 'Oct 20 – Nov 19');
      assert.ok(info.daysLeft >= 30);
    });

    it('Triggers evaluation day on the 19th when cutoffDay is 20', () => {
      // Test Nov 19, 2026 with cutoffDay = 20
      const testDate = new Date(2026, 10, 19, 10, 0, 0); // Nov 19
      const info = getCycleInfo(20, testDate);

      assert.equal(info.day, 19);
      assert.equal(info.cutoffDay, 20);
      assert.equal(info.settlementDay, 19);
      assert.equal(info.isRegistrationDay, false);
      assert.equal(info.isEvaluationDay, true);
      assert.equal(info.cycleStartMonth, 10);
      assert.equal(info.cycleEndMonth, 11);
      assert.equal(info.cycleLabel, 'Oct 20 – Nov 19');
      assert.equal(info.daysLeft, 1);
    });

    it('Seamlessly rolls over to new cycle on the 20th of the next month', () => {
      // Test Nov 20, 2026 with cutoffDay = 20
      const testDate = new Date(2026, 10, 20, 10, 0, 0); // Nov 20
      const info = getCycleInfo(20, testDate);

      assert.equal(info.day, 20);
      assert.equal(info.cutoffDay, 20);
      assert.equal(info.settlementDay, 19);
      assert.equal(info.isRegistrationDay, true);
      assert.equal(info.cycleStartMonth, 11); // Nov
      assert.equal(info.cycleEndMonth, 12);   // Dec
      assert.equal(info.cycleLabel, 'Nov 20 – Dec 19');
    });

    it('Handles edge case where cutoffDay = 1 and settlement falls on month end', () => {
      // Test Jan 1, 2026 with cutoffDay = 1
      const testDate = new Date(2026, 0, 1, 10, 0, 0);
      const info = getCycleInfo(1, testDate);

      assert.equal(info.cutoffDay, 1);
      assert.equal(info.settlementDay, 28); // Feb 2026 has 28 days
      assert.equal(info.isRegistrationDay, true);
      assert.equal(info.cycleLabel, 'Jan 1 – Feb 28');
    });
  });
});
