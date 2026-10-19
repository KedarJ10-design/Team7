import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { checkRateLimit, recordFailedAttempt } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.isLoggedIn || !session.memberId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rate limit: max 10 cheers per minute per member
    const cheerLimit = checkRateLimit(`cheer:${session.memberId}`, 10, 60 * 1000);
    if (!cheerLimit.allowed) {
      return NextResponse.json({ error: 'Too many cheers sent. Please wait a moment.' }, { status: 429 });
    }
    recordFailedAttempt(`cheer:${session.memberId}`, 10, 60 * 1000);

    const body = await request.json();
    const { targetMemberId, message } = body;

    if (!targetMemberId || typeof targetMemberId !== 'string') {
      return NextResponse.json({ error: 'Target member ID is required' }, { status: 400 });
    }

    if (targetMemberId === session.memberId) {
      return NextResponse.json({ error: 'Cannot cheer yourself' }, { status: 400 });
    }

    const target = await prisma.member.findUnique({
      where: { id: targetMemberId },
      select: { id: true, name: true },
    });

    if (!target) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const rawMessage = message && typeof message === 'string' ? message.slice(0, 100).trim() : null;
    const cheerMessage = rawMessage || `Sent a cheer to push towards the 75% Safe Zone! 💪`;

    await writeAuditLog({
      actorId: session.memberId,
      targetMemberId: target.id,
      entity: 'cheer',
      entityId: target.id,
      action: 'create',
      newValue: { message: cheerMessage },
    });

    return NextResponse.json({
      success: true,
      message: `Cheered ${target.name}!`,
    });
  } catch (error) {
    console.error('Cheer API error:', error);
    return NextResponse.json({ error: 'Failed to send cheer' }, { status: 500 });
  }
}
