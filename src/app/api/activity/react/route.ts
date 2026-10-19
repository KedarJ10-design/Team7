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

    // Rate limit: max 30 reactions per minute per member
    const reactLimit = checkRateLimit(`react:${session.memberId}`, 30, 60 * 1000);
    if (!reactLimit.allowed) {
      return NextResponse.json({ error: 'Reaction rate limit exceeded. Please wait a moment.' }, { status: 429 });
    }
    recordFailedAttempt(`react:${session.memberId}`, 30, 60 * 1000);

    const body = await request.json();
    const { logId, emoji } = body;

    const allowedEmojis = ['🔥', '👏', '🚀', '❤️'];
    if (!logId || !emoji || !allowedEmojis.includes(emoji)) {
      return NextResponse.json({ error: 'Valid logId and emoji required' }, { status: 400 });
    }

    // Check if user already reacted with this emoji to this log
    const existing = await prisma.auditLog.findFirst({
      where: {
        actorId: session.memberId,
        entity: 'reaction',
        entityId: logId,
        action: 'react',
        newValue: JSON.stringify({ emoji }),
      },
    });

    if (existing) {
      // Toggle off reaction if clicked again: delete from database
      await prisma.auditLog.delete({ where: { id: existing.id } });
      return NextResponse.json({
        success: true,
        toggled: 'removed',
        emoji,
      });
    }

    await writeAuditLog({
      actorId: session.memberId,
      entity: 'reaction',
      entityId: logId,
      action: 'react',
      newValue: { emoji },
    });

    return NextResponse.json({
      success: true,
      toggled: 'added',
      emoji,
    });
  } catch (error) {
    console.error('Reaction API error:', error);
    return NextResponse.json({ error: 'Failed to record reaction' }, { status: 500 });
  }
}
