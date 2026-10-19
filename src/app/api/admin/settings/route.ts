import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const settings = await prisma.teamSettings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings) {
      return NextResponse.json({ error: 'Settings not initialized' }, { status: 404 });
    }

    // REDACT sensitive bcrypt password hashes before sending to client
    const { passwordHash, adminPasswordHash, ...safeSettings } = settings;
    return NextResponse.json({ settings: safeSettings });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Failed to retrieve settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const body = await request.json();
    const existing = await prisma.teamSettings.findUnique({ where: { id: 'singleton' } });

    // Validate cutoffDay bounds
    let validCutoff = existing?.cutoffDay;
    if (body.cutoffDay !== undefined) {
      const c = Number(body.cutoffDay);
      if (isNaN(c) || c < 1 || c > 28) {
        return NextResponse.json({ error: 'Cutoff day must be an integer between 1 and 28' }, { status: 400 });
      }
      validCutoff = Math.round(c);
    }

    // Validate penaltyThreshold
    let validThreshold = existing?.penaltyThreshold;
    if (body.penaltyThreshold !== undefined) {
      const t = Number(body.penaltyThreshold);
      if (isNaN(t) || t <= 0) {
        return NextResponse.json({ error: 'Penalty threshold must be a positive integer' }, { status: 400 });
      }
      validThreshold = Math.round(t);
    }

    const updated = await prisma.teamSettings.update({
      where: { id: 'singleton' },
      data: {
        cutoffDay: validCutoff,
        thresholds: body.thresholds !== undefined ? JSON.stringify(body.thresholds) : existing?.thresholds,
        penaltyPoints: body.penaltyPoints !== undefined ? JSON.stringify(body.penaltyPoints) : existing?.penaltyPoints,
        penaltyThreshold: validThreshold,
        pinsEnabled: body.pinsEnabled !== undefined ? Boolean(body.pinsEnabled) : existing?.pinsEnabled,
        selfEditOnly: body.selfEditOnly !== undefined ? Boolean(body.selfEditOnly) : existing?.selfEditOnly,
      },
    });

    if (session.memberId) {
      await writeAuditLog({
        actorId: session.memberId,
        entity: 'settings',
        entityId: 'singleton',
        action: 'override',
        oldValue: existing ? { cutoffDay: existing.cutoffDay, pinsEnabled: existing.pinsEnabled } : null,
        newValue: { cutoffDay: updated.cutoffDay, pinsEnabled: updated.pinsEnabled },
      });
    }

    // Strip password hashes from response
    const { passwordHash, adminPasswordHash, ...safeUpdated } = updated;
    return NextResponse.json({ success: true, settings: safeUpdated });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
