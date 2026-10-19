import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getCurrentIST, getCycleInfo } from '@/lib/constants';
import {
  calculateMonthlyPercent,
  calculatePenalty,
  calculateScore,
  DEFAULT_THRESHOLDS,
  DEFAULT_PENALTY_POINTS,
} from '@/lib/scoring';
import { PenaltyThresholds, PenaltyPointValues } from '@/types';
import { writeAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    // Check authorization: Bearer CRON_SECRET or Admin session
    const authHeader = request.headers.get('authorization');
    const configuredCronSecret = process.env.CRON_SECRET;
    const isCronAuthorized =
      Boolean(configuredCronSecret) &&
      authHeader === `Bearer ${configuredCronSecret}`;

    const session = await getSession();
    const isAdminAuthorized = session.isAdmin;

    if (!isCronAuthorized && !isAdminAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Cron authentication required' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const settings = await prisma.teamSettings.findUnique({ where: { id: 'singleton' } });
    const { cycleMonth } = getCycleInfo(settings?.cutoffDay || 15);
    let targetMonth = cycleMonth;

    if (body.month !== undefined && body.month !== null) {
      const m = Number(body.month);
      if (isNaN(m) || m < 1 || m > 12) {
        return NextResponse.json({ error: 'Month must be an integer between 1 and 12' }, { status: 400 });
      }
      targetMonth = Math.round(m);
    }

    const activeYear = await prisma.year.findFirst({
      where: { isActive: true },
    });

    if (!activeYear) {
      return NextResponse.json({ error: 'No active year found for month close' }, { status: 400 });
    }
    let thresholds: PenaltyThresholds = DEFAULT_THRESHOLDS;
    let points: PenaltyPointValues = DEFAULT_PENALTY_POINTS;
    if (settings?.thresholds) {
      try { thresholds = JSON.parse(settings.thresholds); } catch {}
    }
    if (settings?.penaltyPoints) {
      try { points = JSON.parse(settings.penaltyPoints); } catch {}
    }

    const members = await prisma.member.findMany({
      include: {
        goals: {
          where: {
            yearId: activeYear.id,
            type: 'MONTHLY',
            month: targetMonth,
            archivedAt: null,
          },
          include: {
            progressUpdates: true,
          },
        },
        penaltyLedger: true,
      },
    });

    const snapshotsCreated = [];
    const penaltyEventsCreated = [];
    let allAtHundred = members.length > 0;

    for (const member of members) {
      const progresses = member.goals.map((g) => g.currentProgress);
      const monthlyPercent = calculateMonthlyPercent(progresses);
      const hasAnyProgress = member.goals.some((g) => g.progressUpdates.length > 0 || g.currentProgress > 0);
      const penalty = calculatePenalty(monthlyPercent, hasAnyProgress, thresholds, points);
      const score = calculateScore(monthlyPercent, penalty);

      if (monthlyPercent < 100) {
        allAtHundred = false;
      }

      // 1. Write immutable snapshot
      const snapshot = await prisma.monthlySnapshot.upsert({
        where: {
          memberId_yearId_month: {
            memberId: member.id,
            yearId: activeYear.id,
            month: targetMonth,
          },
        },
        update: {
          percent: monthlyPercent,
          penalty,
          score,
          closedAt: new Date(),
        },
        create: {
          memberId: member.id,
          yearId: activeYear.id,
          month: targetMonth,
          percent: monthlyPercent,
          penalty,
          score,
          closedAt: new Date(),
        },
      });
      snapshotsCreated.push(snapshot);

      // 2. Add penalty to ledger if > 0 (idempotent: clean up any existing entry for this month close)
      await prisma.penaltyLedgerEntry.deleteMany({
        where: {
          memberId: member.id,
          yearId: activeYear.id,
          month: targetMonth,
        },
      });

      if (penalty > 0) {
        await prisma.penaltyLedgerEntry.create({
          data: {
            memberId: member.id,
            points: penalty,
            reason: `Month ${targetMonth} close: ${monthlyPercent}% avg → ${penalty} penalty points`,
            month: targetMonth,
            yearId: activeYear.id,
          },
        });
      }

      // 3. Check 100-point penalty trigger
      const updatedLedger = await prisma.penaltyLedgerEntry.findMany({
        where: { memberId: member.id },
      });
      const totalPoints = updatedLedger.reduce((acc, p) => acc + p.points, 0);

      if (totalPoints >= (settings?.penaltyThreshold || 100)) {
        // Check if an unpaid party event already exists
        const existingUnpaid = await prisma.penaltyEvent.findFirst({
          where: {
            memberId: member.id,
            paidAt: null,
          },
        });

        if (!existingUnpaid) {
          const newEvent = await prisma.penaltyEvent.create({
            data: {
              memberId: member.id,
              type: 'party',
              note: `Reached ${totalPoints} penalty points! Party penalty triggered for the team.`,
            },
          });
          penaltyEventsCreated.push(newEvent);
        }
      }
    }

    // 4. Team reward evaluation: if all members are at 100%
    const reward = await prisma.teamReward.upsert({
      where: {
        yearId_month: {
          yearId: activeYear.id,
          month: targetMonth,
        },
      },
      update: {
        unlocked: allAtHundred,
        note: allAtHundred ? 'All 7 members hit 100%! Team reward unlocked (bike ride / outing)!' : null,
      },
      create: {
        yearId: activeYear.id,
        month: targetMonth,
        unlocked: allAtHundred,
        note: allAtHundred ? 'All 7 members hit 100%! Team reward unlocked (bike ride / outing)!' : null,
      },
    });

    if (session.memberId) {
      await writeAuditLog({
        actorId: session.memberId,
        entity: 'month_close',
        entityId: `month_${targetMonth}`,
        action: 'create',
        newValue: {
          month: targetMonth,
          snapshotsCount: snapshotsCreated.length,
          allAtHundred,
          penaltyEventsCount: penaltyEventsCreated.length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      month: targetMonth,
      snapshotsCreated: snapshotsCreated.length,
      allAtHundred,
      teamRewardUnlocked: reward.unlocked,
      newPenaltyEvents: penaltyEventsCreated.length,
    });
  } catch (error) {
    console.error('Month-close error:', error);
    return NextResponse.json({ error: 'Failed to execute month close' }, { status: 500 });
  }
}
