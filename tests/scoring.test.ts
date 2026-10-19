import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMonthlyPercent,
  calculatePenalty,
  calculateScore,
  DEFAULT_THRESHOLDS,
  DEFAULT_PENALTY_POINTS,
} from '../src/lib/scoring';

describe('Team Goal Tracker — Scoring Engine & Penalty Boundary Tests', () => {
  const thresholds = DEFAULT_THRESHOLDS; // safe: 75, warning: 50, danger: 0
  const points = DEFAULT_PENALTY_POINTS; // safe: 0, warning: 5, danger: 10, notStarted: 25

  describe('Penalty Boundary Tests (Client Spec Section 8)', () => {
    it('0% with no progress recorded → 25 penalty points (not started)', () => {
      const penalty = calculatePenalty(0, false, thresholds, points);
      assert.equal(penalty, 25);
    });

    it('0.01% with progress recorded → 10 penalty points (> 0 to < 50)', () => {
      const penalty = calculatePenalty(0.01, true, thresholds, points);
      assert.equal(penalty, 10);
    });

    it('49.99% with progress recorded → 10 penalty points (> 0 to < 50)', () => {
      const penalty = calculatePenalty(49.99, true, thresholds, points);
      assert.equal(penalty, 10);
    });

    it('Exactly 50% → 5 penalty points (50 to < 75 boundary)', () => {
      const penalty = calculatePenalty(50, true, thresholds, points);
      assert.equal(penalty, 5);
    });

    it('74.99% → 5 penalty points (50 to < 75 boundary)', () => {
      const penalty = calculatePenalty(74.99, true, thresholds, points);
      assert.equal(penalty, 5);
    });

    it('Exactly 75% → 0 penalty points (safe boundary)', () => {
      const penalty = calculatePenalty(75, true, thresholds, points);
      assert.equal(penalty, 0);
    });

    it('100% → 0 penalty points (safe boundary)', () => {
      const penalty = calculatePenalty(100, true, thresholds, points);
      assert.equal(penalty, 0);
    });
  });

  describe('Equal-Weight Average Tests (Client Spec Section 8)', () => {
    it('1 goal at 80% → 80%', () => {
      const avg = calculateMonthlyPercent([80]);
      assert.equal(avg, 80);
    });

    it('3 goals (100%, 50%, 30%) → 60%', () => {
      const avg = calculateMonthlyPercent([100, 50, 30]);
      assert.equal(avg, 60);
    });

    it('4 goals (100%, 75%, 50%, 25%) → 63% (round(250/4) = 63%)', () => {
      const avg = calculateMonthlyPercent([100, 75, 50, 25]);
      assert.equal(avg, 63);
    });

    it('7 goals (100, 90, 80, 70, 60, 50, 40) → 70%', () => {
      const avg = calculateMonthlyPercent([100, 90, 80, 70, 60, 50, 40]);
      assert.equal(avg, 70);
    });

    it('0 goals → 0%', () => {
      const avg = calculateMonthlyPercent([]);
      assert.equal(avg, 0);
    });
  });

  describe('Monthly Score Calculation Tests', () => {
    it('80% average with 0 penalty → score 80', () => {
      const score = calculateScore(80, 0);
      assert.equal(score, 80);
    });

    it('60% average with 5 penalty → score 55', () => {
      const score = calculateScore(60, 5);
      assert.equal(score, 55);
    });

    it('20% average with 10 penalty → score 10', () => {
      const score = calculateScore(20, 10);
      assert.equal(score, 10);
    });

    it('0% average with 25 penalty → score -25 (penalties can make monthly score negative)', () => {
      const score = calculateScore(0, 25);
      assert.equal(score, -25);
    });
  });
});
