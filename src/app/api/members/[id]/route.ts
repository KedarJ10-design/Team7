import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getCurrentIST, getCycleInfo } from '@/lib/constants';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const [settings, activeYear] = await Promise.all([
      prisma.teamSettings.findUnique({
        where: { id: 'singleton' },
      }),
      prisma.year.findFirst({
        where: { isActive: true },
      }),
    ]);
    const cutoffDay = settings?.cutoffDay || 15;
    const { cycleMonth } = getCycleInfo(cutoffDay);

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        goals: {
          where: {
            yearId: activeYear?.id,
            archivedAt: null,
          },
          include: {
            progressUpdates: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        snapshots: {
          where: { yearId: activeYear?.id },
          orderBy: { month: 'asc' },
        },
        penaltyLedger: {
          orderBy: { createdAt: 'desc' },
        },
        penaltyEvents: {
          orderBy: { triggeredAt: 'desc' },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const yearlyGoal = member.goals.find((g) => g.type === 'YEARLY');
    const monthlyGoals = member.goals.filter((g) => g.type === 'MONTHLY' && g.month === cycleMonth);

    const totalPenaltyPoints = member.penaltyLedger.reduce((acc, p) => acc + p.points, 0);

    // REDACT sensitive PIN hash before sending member data to client
    const { pinHash, ...safeMember } = member;

    return NextResponse.json({
      member: safeMember,
      yearlyGoal,
      monthlyGoals,
      snapshots: member.snapshots,
      penaltyLedger: member.penaltyLedger,
      penaltyEvents: member.penaltyEvents,
      totalPenaltyPoints,
    });
  } catch (error) {
    console.error('Fetch member error:', error);
    return NextResponse.json({ error: 'Failed to retrieve member' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { name, email, phone, dob } = await request.json();

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Permission check: member can only edit own profile unless admin
    const actorId = session.memberId || id;
    if (session.memberId !== id && !session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You can only edit your own profile' }, { status: 403 });
    }

    // Input validation
    let validName = existing.name;
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 50) {
        return NextResponse.json({ error: 'Name must be between 1 and 50 characters' }, { status: 400 });
      }
      validName = name.trim();
    }

    let validEmail = existing.email;
    if (email !== undefined && email !== null) {
      if (typeof email !== 'string' || email.length > 100) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
      }
      validEmail = email.trim();
    }

    let validPhone = existing.phone;
    if (phone !== undefined && phone !== null) {
      if (typeof phone !== 'string' || phone.length > 20) {
        return NextResponse.json({ error: 'Phone number cannot exceed 20 characters' }, { status: 400 });
      }
      validPhone = phone.trim();
    }

    let validDob = existing.dob;
    if (dob !== undefined && dob !== null && dob !== '') {
      if (typeof dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        return NextResponse.json({ error: 'Date of birth must be formatted YYYY-MM-DD' }, { status: 400 });
      }
      validDob = dob;
    }

    const updated = await prisma.member.update({
      where: { id },
      data: {
        name: validName,
        email: validEmail,
        phone: validPhone,
        dob: validDob,
      },
    });

    // Write audit log
    await writeAuditLog({
      actorId,
      targetMemberId: id,
      entity: 'member',
      entityId: id,
      action: 'update',
      oldValue: { name: existing.name, email: existing.email, phone: existing.phone, dob: existing.dob },
      newValue: { name: updated.name, email: updated.email, phone: updated.phone, dob: updated.dob },
    });

    const { pinHash, ...safeUpdated } = updated;
    return NextResponse.json({ success: true, member: safeUpdated });
  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}
