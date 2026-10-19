import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const entity = searchParams.get('entity');
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 50 : rawLimit));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const skip = (page - 1) * limit;

    const where: {
      OR?: Array<{ actorId: string } | { targetMemberId: string }>;
      entity?: any;
    } = {};

    if (memberId) {
      where.OR = [{ actorId: memberId }, { targetMemberId: memberId }];
    }
    if (entity) {
      where.entity = entity;
    } else {
      where.entity = { not: 'reaction' };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          actor: {
            select: { id: true, name: true, avatarColor: true },
          },
          targetMember: {
            select: { id: true, name: true, avatarColor: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const logIds = logs.map((l) => l.id);
    const reactions = await prisma.auditLog.findMany({
      where: {
        entity: 'reaction',
        entityId: { in: logIds },
      },
      select: {
        entityId: true,
        actorId: true,
        newValue: true,
      },
    });

    const reactionMap: Record<string, Record<string, number>> = {};
    reactions.forEach((r) => {
      try {
        const parsed = JSON.parse(r.newValue || '{}');
        const emoji = parsed.emoji;
        if (emoji) {
          if (!reactionMap[r.entityId]) reactionMap[r.entityId] = {};
          reactionMap[r.entityId][emoji] = (reactionMap[r.entityId][emoji] || 0) + 1;
        }
      } catch {}
    });

    const logsWithReactions = logs.map((l) => ({
      ...l,
      reactions: reactionMap[l.id] || {},
    }));

    return NextResponse.json({
      logs: logsWithReactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Fetch activity logs error:', error);
    return NextResponse.json({ error: 'Failed to retrieve activity log' }, { status: 500 });
  }
}
