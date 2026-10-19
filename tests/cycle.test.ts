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
});
