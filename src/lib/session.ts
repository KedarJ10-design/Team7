import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData } from '@/types';

function getSessionPassword(): string {
  const pwd = process.env.SESSION_PASSWORD;
  if (!pwd || pwd.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: SESSION_PASSWORD must be configured and at least 32 characters in production.');
    }
    // Development fallback with warning
    console.warn('⚠️ WARNING: SESSION_PASSWORD is missing or shorter than 32 characters.');
    return 'dev-team-goal-tracker-session-secret-32-chars-min!';
  }
  return pwd;
}

export const sessionOptions = {
  password: getSessionPassword(),
  cookieName: 'team_goal_tracker_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days (reduced from 30 for security)
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
