import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { writeAuditLog } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { id } = await params;
    const { note } = await request.json().catch(() => ({ note: '' }));

    const penaltyEvent = await prisma.penaltyEvent.findUnique({
      where: { id },
      include: { member: true },
    });

    if (!penaltyEvent) {
      return NextResponse.json({ error: 'Penalty event not found' }, { status: 404 });
    }

    if (penaltyEvent.paidAt) {
      return NextResponse.json({ error: 'Penalty has already been marked as paid' }, { status: 400 });
    }

    const now = new Date();

    // 1. Mark the event as paid
    const updatedEvent = await prisma.penaltyEvent.update({
      where: { id },
      data: {
        paidAt: now,
        note: note ? note.trim() : 'Party completed and verified by admin',
      },
    });

    // 2. Archive or balance the running penalty ledger entries for this member
    // To preserve full history without deletion, we insert an offsetting negative entry!
    const runningPoints = await prisma.penaltyLedgerEntry.findMany({
      where: { memberId: penaltyEvent.memberId },
    });
    const totalPoints = runningPoints.reduce((acc, p) => acc + p.points, 0);

    if (totalPoints > 0) {
      const activeYear = await prisma.year.findFirst({ where: { isActive: true } });
      await prisma.penaltyLedgerEntry.create({
        data: {
          memberId: penaltyEvent.memberId,
          points: -totalPoints,
          reason: `Penalty reset to 0 following paid party event #${id.slice(-6)}`,
          month: new Date().getMonth() + 1,
          yearId: activeYear?.id || 'unknown',
        },
      });
    }

    // 3. Write audit log
    if (session.memberId) {
      await writeAuditLog({
        actorId: session.memberId,
        targetMemberId: penaltyEvent.memberId,
        entity: 'penalty_event',
        entityId: id,
        action: 'update',
        oldValue: { paidAt: null },
        newValue: { paidAt: now, resetPoints: totalPoints },
      });
    }

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: `Penalty event marked as paid. Member running penalty counter reset to 0.`,
    });
  } catch (error) {
    console.error('Pay penalty error:', error);
    return NextResponse.json({ error: 'Failed to mark penalty as paid' }, { status: 500 });
  }
}
