import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { writeAuditLog } from '@/lib/audit';
import { getCycleInfo } from '@/lib/constants';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { newValue, note } = body;

    if (newValue === undefined || newValue === null) {
      return NextResponse.json({ error: 'New progress value is required' }, { status: 400 });
    }

    const numVal = Number(newValue);
    if (isNaN(numVal) || !isFinite(numVal)) {
      return NextResponse.json({ error: 'Progress value must be a valid number between 0 and 100' }, { status: 400 });
    }

    const clampedValue = Math.max(0, Math.min(100, Math.round(numVal)));

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { member: true },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Permission check: only goal owner or admin can update progress
    if (session.memberId !== goal.memberId && !session.isAdmin) {
      return NextResponse.json({
        error: 'Forbidden: You can only update your own goals',
      }, { status: 403 });
    }

    // 30-Day Progress Window & Closed-Cycle Immutability Check
    if (goal.type === 'MONTHLY' && goal.month !== null) {
      const settings = await prisma.teamSettings.findUnique({ where: { id: 'singleton' } });
      const cutoffDay = settings?.cutoffDay || 15;
      const { cycleMonth } = getCycleInfo(cutoffDay);
      const isCurrentActiveCycle = goal.month === cycleMonth;
      const evalDay = cutoffDay === 1 ? 28 : cutoffDay - 1;

      // Previous cycles that have concluded (evaluated on evalDay) are permanently locked
      if (!isCurrentActiveCycle && !session.isAdmin) {
        return NextResponse.json({
          error: `Month ${goal.month} cycle has closed (evaluated on Day ${evalDay}). Progress cannot be retroactively modified.`,
        }, { status: 403 });
      }
    }

    const actorId = session.memberId || goal.memberId;
    const validatedNote = note && typeof note === 'string' ? note.slice(0, 500).trim() : null;

    const oldValue = goal.currentProgress;

    // 1. Update the goal's current progress
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        currentProgress: clampedValue,
        isDone: clampedValue === 100,
      },
    });

    // 2. Append to progress updates history
    const updateRecord = await prisma.progressUpdate.create({
      data: {
        goalId: goal.id,
        actorId,
        oldValue,
        newValue: clampedValue,
        note: validatedNote,
      },
    });

    // 3. Write immutable audit log
    await writeAuditLog({
      actorId,
      targetMemberId: goal.memberId,
      entity: 'goal',
      entityId: goal.id,
      action: 'update',
      oldValue: { progress: oldValue },
      newValue: { progress: clampedValue, note: validatedNote },
    });

    return NextResponse.json({
      success: true,
      goal: updatedGoal,
      updateRecord,
    });
  } catch (error) {
    console.error('Progress update error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
