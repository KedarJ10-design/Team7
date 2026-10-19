import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Team authentication required before accessing admin' }, { status: 401 });
    }

    const ip = getClientIp(request);
    const rateLimitKey = `admin:${ip}`;

    // Rate limiting: max 5 failed attempts per 15 min
    const limitStatus = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!limitStatus.allowed) {
      const waitMinutes = Math.ceil((limitStatus.resetTime - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many failed admin attempts. Locked out for ${waitMinutes} minute(s).` },
        { status: 429 }
      );
    }

    const { password } = await request.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Admin password is required' }, { status: 400 });
    }

    const settings = await prisma.teamSettings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings) {
      return NextResponse.json({ error: 'Settings not initialized' }, { status: 500 });
    }

    // Async bcrypt comparison
    const isMatch = await bcrypt.compare(password, settings.adminPasswordHash);
    if (!isMatch) {
      const failure = recordFailedAttempt(rateLimitKey, 5, 15 * 60 * 1000);
      return NextResponse.json(
        { error: `Incorrect admin password. ${failure.remaining} attempt(s) remaining.` },
        { status: 401 }
      );
    }

    // Reset rate limit on success
    resetRateLimit(rateLimitKey);

    session.isAdmin = true;
    await session.save();

    return NextResponse.json({ success: true, message: 'Admin authenticated' });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json({ error: 'Failed to verify admin password' }, { status: 500 });
  }
}
