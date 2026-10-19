import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getCurrentIST, isBeforeCutoff, getCycleInfo } from '@/lib/constants';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const month = searchParams.get('month');

    const activeYear = await prisma.year.findFirst({
      where: { isActive: true },
    });

    const goals = await prisma.goal.findMany({
      where: {
        yearId: activeYear?.id,
        memberId: memberId || undefined,
        month: month ? parseInt(month, 10) : undefined,
        archivedAt: null,
      },
      include: {
        member: true,
        progressUpdates: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Fetch goals error:', error);
    return NextResponse.json({ error: 'Failed to retrieve goals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { memberId, title, target, type = 'MONTHLY', month, deadline } = body;

    if (!memberId || typeof memberId !== 'string') {
      return NextResponse.json({ error: 'Valid memberId is required' }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 200) {
      return NextResponse.json({ error: 'Title must be between 1 and 200 characters' }, { status: 400 });
    }

    if (type !== 'MONTHLY' && type !== 'YEARLY') {
      return NextResponse.json({ error: 'Goal type must be MONTHLY or YEARLY' }, { status: 400 });
    }

    // Check ownership if selfEditOnly is enabled
    const settings = await prisma.teamSettings.findUnique({ where: { id: 'singleton' } });
    const actorId = session.memberId || memberId;

    if (settings?.selfEditOnly && session.memberId !== memberId && !session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You can only create goals for yourself' }, { status: 403 });
    }

    const { month: currentMonth } = getCurrentIST();
    let targetMonth: number | null = currentMonth;

    if (type === 'MONTHLY') {
      if (month !== undefined && month !== null) {
        const m = Number(month);
        if (isNaN(m) || m < 1 || m > 12) {
          return NextResponse.json({ error: 'Month must be an integer between 1 and 12' }, { status: 400 });
        }
        targetMonth = Math.round(m);
      }
    } else {
      targetMonth = null;
    }

    // Check 1-day registration window: only on the 15th of the month
    if (type === 'MONTHLY') {
      const { day, isRegistrationDay, cycleMonth } = getCycleInfo();
      targetMonth = month ? Number(month) : cycleMonth;

      if (!isRegistrationDay && !session.isAdmin) {
        return NextResponse.json({
          error: `Monthly goal registration is only open on the 15th of each month (Today is Day ${day}). Only an admin can register goals outside this 1-day window.`,
        }, { status: 403 });
      }
    }

    const activeYear = await prisma.year.findFirst({
      where: { isActive: true },
    });

    if (!activeYear) {
      return NextResponse.json({ error: 'No active year found' }, { status: 500 });
    }

    const goal = await prisma.goal.create({
      data: {
        memberId,
        yearId: activeYear.id,
        type: type || 'MONTHLY',
        month: type === 'YEARLY' ? null : targetMonth,
        title: title.trim(),
        target: target ? target.trim() : null,
        deadline: deadline || null,
        currentProgress: 0,
      },
    });

    // Write audit log
    await writeAuditLog({
      actorId,
      targetMemberId: memberId,
      entity: 'goal',
      entityId: goal.id,
      action: 'create',
      newValue: { title: goal.title, type: goal.type, month: goal.month },
    });

    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error('Create goal error:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
