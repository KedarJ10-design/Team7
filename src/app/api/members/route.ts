import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getCurrentIST, getCycleInfo } from '@/lib/constants';
import {
  calculateMonthlyPercent,
  calculatePenalty,
  calculateScore,
  getStatusFromPercent,
  DEFAULT_THRESHOLDS,
  DEFAULT_PENALTY_POINTS,
} from '@/lib/scoring';
import { PenaltyThresholds, PenaltyPointValues } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const [settings, activeYear] = await Promise.all([
      prisma.teamSettings.findUnique({
        where: { id: 'singleton' },
      }),
      prisma.year.findFirst({
        where: { isActive: true },
      }),
    ]);

    const cutoffDay = settings?.cutoffDay || 15;
    const { cycleMonth, cycleYear } = getCycleInfo(cutoffDay);

    let thresholds: PenaltyThresholds = DEFAULT_THRESHOLDS;
    let points: PenaltyPointValues = DEFAULT_PENALTY_POINTS;
    if (settings?.thresholds) {
      try {
        thresholds = JSON.parse(settings.thresholds);
      } catch {}
    }
    if (settings?.penaltyPoints) {
      try {
        points = JSON.parse(settings.penaltyPoints);
      } catch {}
    }

    const members = await prisma.member.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        goals: {
          where: {
            yearId: activeYear?.id,
            type: 'MONTHLY',
            month: cycleMonth,
            archivedAt: null,
          },
          include: {
            progressUpdates: true,
          },
        },
        snapshots: {
          where: { yearId: activeYear?.id },
        },
        penaltyLedger: true,
      },
    });

    const memberSummaries = members.map((m) => {
      const goalProgresses = m.goals.map((g) => g.currentProgress);
      const monthlyPercent = calculateMonthlyPercent(goalProgresses);
      const hasAnyProgress = m.goals.some((g) => g.progressUpdates.length > 0 || g.currentProgress > 0);
      const penalty = calculatePenalty(monthlyPercent, hasAnyProgress, thresholds, points);
      const currentMonthScore = calculateScore(monthlyPercent, penalty);

      // Total running penalties from ledger
      const penaltyPoints = m.penaltyLedger.reduce((acc, p) => acc + p.points, 0);

      // Yearly score = sum of past snapshots (excluding active cycle) + current active month score
      const snapshotScoreTotal = m.snapshots
        .filter((s) => s.month !== cycleMonth)
        .reduce((acc, s) => acc + s.score, 0);
      const yearlyScore = Math.round(snapshotScoreTotal + currentMonthScore);

      const status = getStatusFromPercent(monthlyPercent, hasAnyProgress, thresholds);

      return {
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        dob: m.dob,
        avatarColor: m.avatarColor,
        isAdmin: m.isAdmin,
        monthlyPercent,
        penaltyPoints,
        yearlyScore,
        currentMonthScore,
        goalCount: m.goals.length,
        status,
        goals: m.goals,
      };
    });

    // Sort to determine top scorer: highest yearly score, tie-break: lowest penalty
    const sorted = [...memberSummaries].sort((a, b) => {
      if (b.yearlyScore !== a.yearlyScore) {
        return b.yearlyScore - a.yearlyScore;
      }
      return a.penaltyPoints - b.penaltyPoints;
    });

    const topScorer = sorted.length > 0 ? sorted[0] : null;
    const rewardProgress = memberSummaries.filter((m) => m.monthlyPercent === 100).length;

    return NextResponse.json({
      members: memberSummaries,
      topScorer,
      rewardProgress,
      totalMembers: memberSummaries.length,
      currentMonth: cycleMonth,
      currentYear: cycleYear,
      cutoffDay,
    });
  } catch (error) {
    console.error('Fetch members error:', error);
    return NextResponse.json({ error: 'Failed to retrieve members' }, { status: 500 });
  }
}
