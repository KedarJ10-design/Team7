// ═══════════════════════════════════════════
// Sliding-Window Memory Rate Limiter
// ═══════════════════════════════════════════

interface RateLimitRecord {
  attempts: number[];
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection for memory hygiene
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    const activeAttempts = record.attempts.filter((ts) => now - ts < windowMs);
    const isBlocked = record.blockedUntil && record.blockedUntil > now;
    if (activeAttempts.length === 0 && !isBlocked) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if an action is allowed under the rate limit.
 * @param key Unique identifier (e.g. `pin:member123:ip` or `login:ip`)
 * @param maxAttempts Maximum allowed failed attempts before lockout (default: 5)
 * @param windowMs Window duration in milliseconds (default: 15 minutes)
 * @param blockDurationMs Lockout duration when max attempts exceeded (default: 15 minutes)
 */
export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
  blockDurationMs = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupStaleEntries(windowMs);
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    return {
      allowed: true,
      remaining: maxAttempts,
      resetTime: now + windowMs,
    };
  }

  // Check if actively blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.blockedUntil,
    };
  }

  // Filter attempts within the sliding window
  const recentAttempts = record.attempts.filter((ts) => now - ts < windowMs);
  record.attempts = recentAttempts;

  if (recentAttempts.length >= maxAttempts) {
    record.blockedUntil = now + blockDurationMs;
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.blockedUntil,
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - recentAttempts.length,
    resetTime: recentAttempts.length > 0 ? recentAttempts[0] + windowMs : now + windowMs,
  };
}

/**
 * Record a failed attempt for a given key.
 */
export function recordFailedAttempt(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
  blockDurationMs = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { attempts: [] };
    rateLimitStore.set(key, record);
  }

  record.attempts.push(now);
  const recentAttempts = record.attempts.filter((ts) => now - ts < windowMs);
  record.attempts = recentAttempts;

  if (recentAttempts.length >= maxAttempts) {
    record.blockedUntil = now + blockDurationMs;
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.blockedUntil,
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - recentAttempts.length,
    resetTime: recentAttempts[0] + windowMs,
  };
}

/**
 * Reset failed attempts on a successful authentication.
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Helper to extract client IP address from Next.js request headers.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
