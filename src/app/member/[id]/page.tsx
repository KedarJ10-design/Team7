'use client';

import React, { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';
import { Avatar } from '@/components/Avatar';
import { ProgressBar } from '@/components/ProgressBar';
import { ProgressModal } from '@/components/ProgressModal';

const PersonalRadar = dynamic(
  () => import('@/components/charts/PersonalRadar').then((mod) => mod.PersonalRadar),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Loading Radar Visualization...
      </div>
    ),
  }
);
import { Member, Goal, MonthlySnapshot, AuditLogEntry } from '@/types';
import { MONTH_NAMES } from '@/lib/constants';
import { TargetIcon, RadarIcon, ActivityIcon, EditIcon } from '@/components/ui/Icons';
import { TrophyGrid, Trophy } from '@/components/profile/TrophyGrid';

interface SessionInfo {
  isLoggedIn: boolean;
  memberId: string | null;
  member: {
    id: string;
    name: string;
    avatarColor: string;
    isAdmin: boolean;
  } | null;
  isAdmin: boolean;
}

export default function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [member, setMember] = useState<Member | null>(null);
  const [yearlyGoal, setYearlyGoal] = useState<Goal | null>(null);
  const [monthlyGoals, setMonthlyGoals] = useState<Goal[]>([]);
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [totalPenaltyPoints, setTotalPenaltyPoints] = useState(0);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Profile Edit Modal State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Recent audit logs for this member
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);

  const loadData = async () => {
    try {
      const [sessionRes, memberRes, activityRes] = await Promise.all([
        fetch('/api/auth/session'),
        fetch(`/api/members/${id}`),
        fetch(`/api/activity?memberId=${id}&limit=10`),
      ]);

      const sessionData = await sessionRes.json();
      const memberData = await memberRes.json();
      const activityData = await activityRes.json();

      setSession(sessionData);

      if (memberData.member) {
        setMember(memberData.member);
        setYearlyGoal(memberData.yearlyGoal || null);
        setMonthlyGoals(memberData.monthlyGoals || []);
        setSnapshots(memberData.snapshots || []);
        setTotalPenaltyPoints(memberData.totalPenaltyPoints || 0);

        setEditName(memberData.member.name || '');
        setEditEmail(memberData.member.email || '');
        setEditPhone(memberData.member.phone || '');
        setEditDob(memberData.member.dob || '');
      }

      if (activityData.logs) {
        setRecentLogs(activityData.logs);
      }
    } catch (err) {
      console.error('Failed to load member profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleProgressSuccess = (newProgress: number) => {
    if (!selectedGoal) return;
    setMonthlyGoals((prev) =>
      prev.map((g) => (g.id === selectedGoal.id ? { ...g, currentProgress: newProgress } : g))
    );
    if (yearlyGoal && yearlyGoal.id === selectedGoal.id) {
      setYearlyGoal({ ...yearlyGoal, currentProgress: newProgress });
    }
    loadData();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
          dob: editDob,
        }),
      });
      if (res.ok) {
        setIsEditingProfile(false);
        loadData();
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '64px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }} />
        <main className="container" style={{ flex: 1, padding: '1.5rem 1rem' }}>
          <div style={{ height: '140px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', marginBottom: '1.5rem', opacity: 0.6 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ height: '260px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', opacity: 0.5 }} />
            <div style={{ height: '260px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', opacity: 0.5 }} />
          </div>
        </main>
      </div>
    );
  }

  if (!member) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar currentMember={session?.member} />
        <main className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <h2>Member Not Found</h2>
        </main>
      </div>
    );
  }

  const weightPerGoal = monthlyGoals.length > 0 ? Math.round(100 / monthlyGoals.length) : 0;
  const canEdit = session?.isAdmin || session?.memberId === member.id;

  const historyForRadar = snapshots.map((s) => ({
    month: s.month,
    percent: s.percent,
  }));

  const currentMonthAvg = monthlyGoals.length > 0
    ? Math.round(monthlyGoals.reduce((sum, g) => sum + g.currentProgress, 0) / monthlyGoals.length)
    : 0;

  const snapshotTotal = snapshots.reduce((sum, s) => sum + s.score, 0);
  const calculatedYearlyScore = Math.round(snapshotTotal + currentMonthAvg);

  const trophies: Trophy[] = [
    {
      id: 'clean_sheet',
      icon: '🛡️',
      title: 'Clean Sheet',
      description: 'Zero penalty points accumulated this season.',
      unlocked: totalPenaltyPoints === 0,
      progressText: totalPenaltyPoints === 0 ? 'Zero penalties! Perfect standing' : `${totalPenaltyPoints} pts penalty accumulated`,
    },
    {
      id: 'hot_streak',
      icon: '🔥',
      title: 'Safe Streak',
      description: 'Maintained ≥ 75% monthly score to stay in the Safe Zone.',
      unlocked: currentMonthAvg >= 75,
      progressText: currentMonthAvg >= 75 ? `${currentMonthAvg}% (Safe Zone maintained!)` : `${currentMonthAvg}% (Target: ≥ 75%)`,
    },
    {
      id: 'century_club',
      icon: '🎯',
      title: 'Century Club',
      description: 'Reached 100% completion on monthly goals.',
      unlocked: currentMonthAvg === 100 || snapshots.some((s) => s.percent >= 100),
      progressText: currentMonthAvg === 100 ? '100% Century achieved!' : `${currentMonthAvg}% / 100%`,
    },
    {
      id: 'leader_crown',
      icon: '👑',
      title: 'Leader Crown',
      description: 'High season achievement standing with > 300 yearly points.',
      unlocked: calculatedYearlyScore >= 300,
      progressText: `${calculatedYearlyScore} yearly pts`,
    },
    {
      id: 'team_player',
      icon: '🤝',
      title: 'Team Supporter',
      description: 'Active goal setter contributing to the 7-person team reward.',
      unlocked: monthlyGoals.length >= 3,
      progressText: `${monthlyGoals.length} goals set`,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentMember={session?.member} />

      <main className="container" style={{ flex: 1 }}>
        {/* Profile Header Card */}
        <div className="glass-panel" style={{ margin: '1.5rem 0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Avatar name={member.name} color={member.avatarColor} size="xl" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>{member.name}</h1>
                {member.isAdmin && <span className="badge badge-safe">Admin</span>}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem', wordBreak: 'break-word' }}>
                {member.email || 'No email provided'} • {member.phone || 'No phone'} • DOB: {member.dob || 'Not set'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Running Penalties
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: totalPenaltyPoints >= 75 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                {totalPenaltyPoints} pts
              </div>
            </div>

            {canEdit && (
              <button onClick={() => setIsEditingProfile(true)} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                <EditIcon size={16} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Yearly Goal Card */}
        <div className="glass-panel" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-accent-subtle)', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TargetIcon size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Yearly Milestone (2026)</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Deadline: {yearlyGoal?.deadline || 'End of year'} • Excluded from monthly penalty
                </span>
              </div>
            </div>

            {canEdit && yearlyGoal && (
              <button
                onClick={() => setSelectedGoal(yearlyGoal)}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                Update Progress
              </button>
            )}
          </div>

          <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            {yearlyGoal?.title || 'No annual goal registered yet.'}
          </p>

          <ProgressBar progress={yearlyGoal?.currentProgress || 0} />
        </div>

        {/* Two-Column Grid: Monthly Goals & Radar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Monthly Goals Section */}
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-accent-subtle)', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TargetIcon size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Active Monthly Goals</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-light)', fontWeight: 600 }}>
                    {monthlyGoals.length} goals = {weightPerGoal}% weight each
                  </span>
                </div>
              </div>
            </div>

            {monthlyGoals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No monthly goals registered yet for this month.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {monthlyGoals.map((g) => (
                  <div
                    key={g.id}
                    style={{
                      background: 'var(--bg-input)',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{g.title}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Weight: {weightPerGoal}% of monthly score
                        </span>
                      </div>

                      {canEdit && (
                        <button
                          onClick={() => setSelectedGoal(g)}
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          Update %
                        </button>
                      )}
                    </div>

                    <ProgressBar progress={g.currentProgress} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personal Performance Radar */}
          <div className="glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-accent-subtle)', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RadarIcon size={18} />
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Personal Radar (Yearly Progression)
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              12 monthly axes showing performance history across closed months
            </p>
            <PersonalRadar history={historyForRadar} />
          </div>
        </div>

        {/* Achievements & Trophies Showcase */}
        <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
          <TrophyGrid trophies={trophies} />
        </div>

        {/* Change History Timeline */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-accent-subtle)', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIcon size={18} />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Recent Activity & Change Audit
            </h2>
          </div>
          {recentLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No audit history recorded yet for this member.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.85rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                      {log.actor?.name || 'Actor'}
                    </span>{' '}
                    performed <strong>{log.action}</strong> on <em>{log.entity}</em>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Progress Update Modal */}
      {selectedGoal && (
        <ProgressModal
          goalId={selectedGoal.id}
          goalTitle={selectedGoal.title}
          currentProgress={selectedGoal.currentProgress}
          isOpen={Boolean(selectedGoal)}
          onClose={() => setSelectedGoal(null)}
          onSuccess={handleProgressSuccess}
        />
      )}

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
          onClick={() => setIsEditingProfile(false)}
        >
          <div
            className="card animate-fade-in"
            style={{ width: '100%', maxWidth: '440px', border: '1px solid var(--border-focus)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Edit Member Profile
            </h3>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="input"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Contact Number
                </label>
                <input
                  type="text"
                  className="input"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="input"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsEditingProfile(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={editLoading} className="btn btn-primary">
                  {editLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
