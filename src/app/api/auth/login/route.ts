import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimitKey = `login:${ip}`;

    // 1. Rate limiting check (max 5 failed attempts per 15 min)
    const limitStatus = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!limitStatus.allowed) {
      const waitMinutes = Math.ceil((limitStatus.resetTime - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many failed login attempts. Please try again in ${waitMinutes} minute(s).` },
        { status: 429 }
      );
    }

    const { password } = await request.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const settings = await prisma.teamSettings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings) {
      return NextResponse.json({ error: 'System settings not initialized' }, { status: 500 });
    }

    // 2. Asynchronous bcrypt comparison (prevents event loop blocking)
    const isValid = await bcrypt.compare(password, settings.passwordHash);

    if (!isValid) {
      const failure = recordFailedAttempt(rateLimitKey, 5, 15 * 60 * 1000);
      return NextResponse.json(
        {
          error: `Invalid team password. ${failure.remaining} attempt(s) remaining.`,
        },
        { status: 401 }
      );
    }

    // 3. Clear failed attempts on success
    resetRateLimit(rateLimitKey);

    const session = await getSession();
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ success: true, message: 'Authenticated successfully' });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
