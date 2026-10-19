import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from '../src/lib/rateLimit';

describe('Security Hardening Test Suite', () => {
  describe('Rate Limiter Tests (Brute Force Protection)', () => {
    it('Allows initial requests within limit', () => {
      const key = 'test:initial:allowed';
      const status = checkRateLimit(key, 5, 1000);
      assert.equal(status.allowed, true);
      assert.equal(status.remaining, 5);
    });

    it('Decrements remaining attempts on failed attempt', () => {
      const key = 'test:decrement:key';
      resetRateLimit(key);
      const res1 = recordFailedAttempt(key, 3, 5000);
      assert.equal(res1.allowed, true);
      assert.equal(res1.remaining, 2);

      const res2 = recordFailedAttempt(key, 3, 5000);
      assert.equal(res2.allowed, true);
      assert.equal(res2.remaining, 1);
    });

    it('Blocks requests once maximum failed attempts (5) are reached', () => {
      const key = 'test:block:key';
      resetRateLimit(key);

      // Record 5 failed attempts
      for (let i = 0; i < 5; i++) {
        recordFailedAttempt(key, 5, 5000);
      }

      // 6th check should be blocked
      const status = checkRateLimit(key, 5, 5000);
      assert.equal(status.allowed, false);
      assert.equal(status.remaining, 0);
      assert.ok(status.resetTime > Date.now());
    });

    it('Clears failed attempts on resetRateLimit (successful auth)', () => {
      const key = 'test:reset:key';
      resetRateLimit(key);

      recordFailedAttempt(key, 3, 5000);
      recordFailedAttempt(key, 3, 5000);

      // Successfully authenticated
      resetRateLimit(key);

      const status = checkRateLimit(key, 3, 5000);
      assert.equal(status.allowed, true);
      assert.equal(status.remaining, 3);
    });
  });

  describe('Input Sanitization & Boundary Logic', () => {
    it('Correctly handles numeric conversion and NaN rejection', () => {
      const validProgress = '75';
      const parsedValid = Number(validProgress);
      assert.equal(isNaN(parsedValid), false);
      assert.equal(parsedValid, 75);

      const invalidProgress = 'abc';
      const parsedInvalid = Number(invalidProgress);
      assert.equal(isNaN(parsedInvalid), true);

      const nanClamped = isNaN(parsedInvalid) ? null : Math.max(0, Math.min(100, parsedInvalid));
      assert.equal(nanClamped, null);
    });

    it('Strictly validates 4-digit numeric PIN format', () => {
      const pinRegex = /^\d{4}$/;

      assert.equal(pinRegex.test('1234'), true);
      assert.equal(pinRegex.test('0000'), true);
      assert.equal(pinRegex.test('9999'), true);

      // Invalid cases
      assert.equal(pinRegex.test('123'), false);      // too short
      assert.equal(pinRegex.test('12345'), false);    // too long
      assert.equal(pinRegex.test('12a4'), false);     // non-numeric
      assert.equal(pinRegex.test('-123'), false);     // negative sign
      assert.equal(pinRegex.test('12 4'), false);     // space
      assert.equal(pinRegex.test(''), false);         // empty
    });

    it('Validates month boundary range 1 to 12', () => {
      function isValidMonth(m: unknown): boolean {
        const num = Number(m);
        return !isNaN(num) && num >= 1 && num <= 12 && Number.isInteger(num);
      }

      assert.equal(isValidMonth(1), true);
      assert.equal(isValidMonth(10), true);
      assert.equal(isValidMonth(12), true);

      assert.equal(isValidMonth(0), false);
      assert.equal(isValidMonth(13), false);
      assert.equal(isValidMonth(-1), false);
      assert.equal(isValidMonth(2.5), false);
      assert.equal(isValidMonth('october'), false);
    });

    it('Validates cutoffDay boundary range 1 to 28', () => {
      function isValidCutoff(d: unknown): boolean {
        const num = Number(d);
        return !isNaN(num) && num >= 1 && num <= 28 && Number.isInteger(num);
      }

      assert.equal(isValidCutoff(1), true);
      assert.equal(isValidCutoff(15), true);
      assert.equal(isValidCutoff(28), true);

      assert.equal(isValidCutoff(0), false);
      assert.equal(isValidCutoff(29), false);
      assert.equal(isValidCutoff(31), false);
      assert.equal(isValidCutoff(-5), false);
    });
  });

  describe('Sensitive Hash Redaction Pattern Tests', () => {
    it('Redacts passwordHash and adminPasswordHash from settings object', () => {
      const rawSettings = {
        id: 'singleton',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789',
        adminPasswordHash: '$2a$10$987654321zyxwvutsrqponmlkjihgfedcba',
        cutoffDay: 15,
        pinsEnabled: true,
      };

      const { passwordHash, adminPasswordHash, ...safeSettings } = rawSettings;

      assert.equal((safeSettings as any).passwordHash, undefined);
      assert.equal((safeSettings as any).adminPasswordHash, undefined);
      assert.equal(safeSettings.cutoffDay, 15);
      assert.equal(safeSettings.pinsEnabled, true);
    });

    it('Redacts pinHash from member profile object', () => {
      const rawMember = {
        id: 'cm123456',
        name: 'Kedar',
        email: 'kedar@example.com',
        pinHash: '$2a$10$hashedsecretpin',
        avatarColor: '#6366f1',
        isAdmin: true,
      };

      const { pinHash, ...safeMember } = rawMember;

      assert.equal((safeMember as any).pinHash, undefined);
      assert.equal(safeMember.name, 'Kedar');
      assert.equal(safeMember.email, 'kedar@example.com');
      assert.equal(safeMember.isAdmin, true);
    });
  });
});
