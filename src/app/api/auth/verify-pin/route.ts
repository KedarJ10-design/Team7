import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Team authentication required' }, { status: 401 });
    }

    const { memberId, pin } = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const ip = getClientIp(request);
    const rateLimitKey = `pin:${memberId}:${ip}`;

    // Rate limiting check: max 5 failed attempts per 15 min per member
    const limitStatus = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!limitStatus.allowed) {
      const waitMinutes = Math.ceil((limitStatus.resetTime - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many failed PIN attempts for this profile. Try again in ${waitMinutes} minute(s).` },
        { status: 429 }
      );
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const settings = await prisma.teamSettings.findUnique({
      where: { id: 'singleton' },
    });

    // Check PIN if enabled and member has a PIN hash
    if (settings?.pinsEnabled && member.pinHash) {
      if (!pin || typeof pin !== 'string') {
        return NextResponse.json({ error: '4-digit PIN is required' }, { status: 400 });
      }

      // Enforce strict 4-digit PIN format
      if (!/^\d{4}$/.test(pin.trim())) {
        return NextResponse.json({ error: 'PIN must consist of exactly 4 digits (0-9)' }, { status: 400 });
      }

      // Asynchronous bcrypt comparison
      const isMatch = await bcrypt.compare(pin.trim(), member.pinHash);
      if (!isMatch) {
        const failure = recordFailedAttempt(rateLimitKey, 5, 15 * 60 * 1000);
        return NextResponse.json(
          { error: `Incorrect 4-digit PIN. ${failure.remaining} attempt(s) remaining.` },
          { status: 401 }
        );
      }
    }

    // Clear failed attempts on success
    resetRateLimit(rateLimitKey);

    // Save member selection into session
    session.memberId = member.id;
    session.memberName = member.name;
    session.isAdmin = member.isAdmin;
    await session.save();

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        name: member.name,
        avatarColor: member.avatarColor,
        isAdmin: member.isAdmin,
      },
    });
  } catch (error) {
    console.error('PIN verification error:', error);
    return NextResponse.json({ error: 'Failed to verify member' }, { status: 500 });
  }
}
