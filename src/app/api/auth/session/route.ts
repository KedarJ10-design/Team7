import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({
        isLoggedIn: false,
        member: null,
      });
    }

    let member = null;
    if (session.memberId) {
      member = await prisma.member.findUnique({
        where: { id: session.memberId },
        select: {
          id: true,
          name: true,
          avatarColor: true,
          isAdmin: true,
          email: true,
        },
      });
    }

    return NextResponse.json({
      isLoggedIn: true,
      memberId: session.memberId || null,
      member,
      isAdmin: session.isAdmin || member?.isAdmin || false,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}
