'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Avatar } from '@/components/Avatar';
import { ProgressBar } from '@/components/ProgressBar';
import {
  CrownIcon,
  GiftIcon,
  HourglassIcon,
  RadarIcon,
  TargetIcon,
  TrophyIcon,
  ShieldCheckIcon,
  FlameIcon,
  UsersIcon,
} from '@/components/ui/Icons';
import { MemberDashboardData } from '@/types';
import { MONTH_NAMES, getCycleInfo } from '@/lib/constants';
import { CheerButton } from '@/components/CheerButton';
import { fireConfetti } from '@/lib/confetti';
import { SocialRecapModal } from '@/components/SocialRecapModal';

const TeamRadar = dynamic(
  () => import('@/components/charts/TeamRadar').then((mod) => mod.TeamRadar),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Loading Radar Visualization...
      </div>
    ),
  }
);

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

export default function DashboardPage() {
  const [cutoffDay, setCutoffDay] = useState(15);
  const cycleInfo = getCycleInfo(cutoffDay);
  const [members, setMembers] = useState<MemberDashboardData[]>([]);
  const [topScorer, setTopScorer] = useState<MemberDashboardData | null>(null);
  const [rewardProgress, setRewardProgress] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(10);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [filter, setFilter] = useState<'all' | 'safe' | 'risk'>('all');
  const [activeTab, setActiveTab] = useState<'cards' | 'radar'>('cards');
  const [loading, setLoading] = useState(true);
  const [isRecapOpen, setIsRecapOpen] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [sessionRes, membersRes] = await Promise.all([
          fetch('/api/auth/session'),
          fetch('/api/members'),
        ]);

        const sessionData = await sessionRes.json();
        const membersData = await membersRes.json();

        setSession(sessionData);
        if (membersData.members) {
          setMembers(membersData.members);
          setTopScorer(membersData.topScorer);
          setRewardProgress(membersData.rewardProgress);
          setCurrentMonth(membersData.currentMonth || 10);
        }
        if (membersData.cutoffDay) {
          setCutoffDay(membersData.cutoffDay);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const monthName = MONTH_NAMES[currentMonth - 1] || 'Current Month';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '64px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }} />
        <main className="container" style={{ flex: 1, padding: '1.5rem 1rem' }}>
          <div style={{ height: '80px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', marginBottom: '1.5rem', opacity: 0.6 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} style={{ height: '220px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', opacity: 0.5 }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Calculate team collective average
  const totalPercent = members.reduce((acc, m) => acc + m.monthlyPercent, 0);
  const teamAverage = members.length > 0 ? Math.round(totalPercent / members.length) : 0;

  const filteredMembers = members.filter((m) => {
    if (filter === 'safe') return m.monthlyPercent >= 75;
    if (filter === 'risk') return m.monthlyPercent < 75;
    return true;
  });

  const radarData = members.map((m) => ({
    name: m.name,
    percent: m.monthlyPercent,
  }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentMember={session?.member} onOpenRecap={() => setIsRecapOpen(true)} />

      <main className="container" style={{ flex: 1 }}>
        {/* Friendly Header */}
        <div style={{ margin: '1.5rem 0 1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--status-safe)' }} />
              {monthName} 2026 Goals
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Welcome back, {session?.member?.name || 'Team 7'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.15rem' }}>
              7 friends keeping each other accountable, hitting targets, and unlocking rewards.
            </p>
          </div>

          {/* Team Average Pill */}
          <div
            className="card"
            style={{
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Team Average
              </div>
              <div className="num-tabular" style={{ fontSize: '1.15rem', fontWeight: 800, color: teamAverage >= 75 ? 'var(--status-safe)' : 'var(--text-primary)' }}>
                {teamAverage}% Complete
              </div>
            </div>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: teamAverage >= 75 ? 'var(--status-safe-bg)' : 'var(--bg-accent-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: teamAverage >= 75 ? 'var(--status-safe)' : 'var(--accent)',
              }}
            >
              <ShieldCheckIcon size={18} />
            </div>
          </div>
        </div>

        {/* Bento Grid System: Top Leader Hero & Syndicate Metrics */}
        <div className="bento-grid">
          {/* Bento Hero: Top Leader of the Month */}
          <div className="bento-hero">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.14)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <CrownIcon size={16} color="#f59e0b" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Leader of the Month
                  </span>
                </div>
                <button
                  onClick={() => setIsRecapOpen(true)}
                  className="btn-quick"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                  title="Generate 4:5 WhatsApp and Discord Social Recap Card"
                >
                  <TrophyIcon size={13} color="#f59e0b" />
                  <span>WhatsApp Card</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', marginBottom: '1.25rem' }}>
                {topScorer && (
                  <Avatar name={topScorer.name} color={topScorer.avatarColor} size="lg" />
                )}
                <div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    {topScorer?.name || 'In Progress'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Score: <strong style={{ color: 'var(--text-primary)' }}>{topScorer?.yearlyScore || 0} pts</strong> • Penalties: <strong style={{ color: topScorer?.penaltyPoints ? 'var(--status-danger)' : 'var(--status-safe)' }}>{topScorer?.penaltyPoints || 0}</strong>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Target Completion
                  </span>
                  <span className="num-tabular" style={{ fontSize: '0.9rem', fontWeight: 800, color: topScorer && topScorer.monthlyPercent >= 75 ? 'var(--status-safe)' : 'var(--accent)' }}>
                    {topScorer?.monthlyPercent || 0}%
                  </span>
                </div>
                <ProgressBar progress={topScorer?.monthlyPercent || 0} showLabel={false} height={8} />
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(245, 158, 11, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span>
                Syndicate Safe Zone: <strong style={{ color: 'var(--text-primary)' }}>{members.filter(m => m.monthlyPercent >= 75).length} of 7</strong> active
              </span>
              {topScorer && session?.memberId && topScorer.id !== session.memberId && (
                <CheerButton targetMemberId={topScorer.id} targetMemberName={topScorer.name} monthlyPercent={topScorer.monthlyPercent} />
              )}
            </div>
          </div>

          {/* Bento Stack: 2 Stacked Cards on Right */}
          <div className="bento-stack">
            {/* Team Milestone Prize Card */}
            <div
              className={`card ${rewardProgress === 7 ? 'card-interactive' : ''}`}
              onClick={() => {
                if (rewardProgress === 7) {
                  fireConfetti({ theme: 'team', particleCount: 110 });
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                borderLeft: `3px solid ${rewardProgress === 7 ? 'var(--status-safe)' : 'rgba(244, 63, 94, 0.4)'}`,
                cursor: rewardProgress === 7 ? 'pointer' : 'default',
                flex: 1,
              }}
              title={rewardProgress === 7 ? 'All 7 friends achieved 100%! Click to celebrate! 🎉' : undefined}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: rewardProgress === 7 ? 'var(--status-safe-bg)' : 'var(--bg-accent-subtle)',
                  color: rewardProgress === 7 ? 'var(--status-safe)' : 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <GiftIcon size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Team Milestone Prize
                  </div>
                  {rewardProgress === 7 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--status-safe)', fontWeight: 800 }}>
                      🎉 UNLOCKED!
                    </span>
                  )}
                </div>
                <div className="num-tabular" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  {rewardProgress} of 7 Friends at 100%
                </div>
                <div style={{ marginTop: '0.35rem' }}>
                  <ProgressBar progress={(rewardProgress / 7) * 100} showLabel={false} height={6} />
                </div>
              </div>
            </div>

            {/* 30-Day Cycle Status Card */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `3px solid var(--accent)`, flex: 1 }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'var(--bg-accent-subtle)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <HourglassIcon size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Cycle: {cycleInfo.cycleLabel}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {cycleInfo.daysLeft} Days to Evaluation
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                  {cycleInfo.isRegistrationDay
                    ? `Goal Registration is OPEN today (Day ${cutoffDay})!`
                    : `30-day progress updates active • Close & scoring on Day ${cycleInfo.settlementDay}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher & Action Bar */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Main View Tabs: 7 Friends vs Team Radar */}
          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setActiveTab('cards')}
              className={`btn-quick ${activeTab === 'cards' ? 'btn-primary' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 'var(--radius-xs)' }}
            >
              <UsersIcon size={14} /> 7 Friends
            </button>
            <button
              onClick={() => setActiveTab('radar')}
              className={`btn-quick ${activeTab === 'radar' ? 'btn-primary' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 'var(--radius-xs)' }}
            >
              <RadarIcon size={14} /> Team Radar & Rules
            </button>
          </div>

          {/* Filter Pills (active when looking at cards) */}
          {activeTab === 'cards' && (
            <div
              style={{
                display: 'flex',
                gap: '0.35rem',
                background: 'var(--bg-secondary)',
                padding: '0.3rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                overflowX: 'auto',
                maxWidth: '100%',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <button
                onClick={() => setFilter('all')}
                className={`btn-quick ${filter === 'all' ? 'btn-primary' : ''}`}
                style={{ borderRadius: 'var(--radius-xs)', whiteSpace: 'nowrap' }}
              >
                All 7
              </button>
              <button
                onClick={() => setFilter('safe')}
                className={`btn-quick ${filter === 'safe' ? 'btn-primary' : ''}`}
                style={{ borderRadius: 'var(--radius-xs)', whiteSpace: 'nowrap' }}
              >
                On Track (≥75%)
              </button>
              <button
                onClick={() => setFilter('risk')}
                className={`btn-quick ${filter === 'risk' ? 'btn-primary' : ''}`}
                style={{ borderRadius: 'var(--radius-xs)', whiteSpace: 'nowrap' }}
              >
                Needs Push (&lt;75%)
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: 7 Member Cards Grid (Default) */}
        {activeTab === 'cards' && (
          <div className="grid-members animate-fade-in">
            {filteredMembers.map((m) => {
              const isTopLeader = topScorer?.id === m.id;

              const badgeText =
                m.monthlyPercent >= 75
                  ? 'On Track'
                  : m.monthlyPercent >= 50
                  ? 'Needs Push'
                  : m.monthlyPercent > 0
                  ? 'At Risk'
                  : 'Not Started';

              const badgeClass =
                m.monthlyPercent >= 75
                  ? 'badge-safe'
                  : m.monthlyPercent >= 50
                  ? 'badge-warning'
                  : 'badge-critical';

              return (
                <div
                  key={m.id}
                  className={`card card-interactive ${isTopLeader ? 'card-leader' : ''}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.1rem',
                  }}
                >
                  {/* Card Header: Avatar, Name, and Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0, flex: 1 }}>
                      <Avatar
                        name={m.name}
                        color={m.avatarColor}
                        size="md"
                        status={isTopLeader ? 'gold' : undefined}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.name}
                          </h3>
                          {m.isAdmin && (
                            <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 800, background: 'rgba(245, 158, 11, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                              ADMIN
                            </span>
                          )}
                          {m.monthlyPercent >= 75 && (
                            <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700, background: 'var(--status-safe-bg)', border: '1px solid var(--status-safe-border)', padding: '0.12rem 0.4rem', borderRadius: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                              🔥 Safe Streak
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>
                          {m.goalCount} active {m.goalCount === 1 ? 'goal' : 'goals'}
                        </div>
                      </div>
                    </div>

                    <span className={`badge ${badgeClass}`}>
                      <span className="badge-dot" />
                      {badgeText}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <ProgressBar
                      progress={m.monthlyPercent}
                      height={8}
                      labelPrefix="Monthly Completion"
                      variant="segmented"
                      showMilestones={true}
                      showStatusChip={false}
                    />
                  </div>

                  {/* Member Stats Box (Penalties & Yearly Score) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.75rem',
                      padding: '0.7rem 0.9rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Penalties
                      </div>
                      <div
                        className="num-tabular"
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          marginTop: '0.15rem',
                          color: m.penaltyPoints === 0 ? 'var(--status-safe)' : m.penaltyPoints >= 75 ? 'var(--status-critical)' : 'var(--status-warning)',
                        }}
                      >
                        {m.penaltyPoints} pts
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Yearly Score
                      </div>
                      <div
                        className="num-tabular"
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          marginTop: '0.15rem',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {m.yearlyScore} pts
                      </div>
                    </div>
                  </div>

                  {/* View Goals Action Button & Peer Cheer Button */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%', minWidth: 0 }}>
                    <Link
                      href={`/member/${m.id}`}
                      className="btn btn-secondary"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: '38px',
                        padding: '0 0.85rem',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>View Goals</span>
                      <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>→</span>
                    </Link>

                    {m.monthlyPercent < 75 && session?.memberId !== m.id && (
                      <CheerButton
                        targetMemberId={m.id}
                        targetMemberName={m.name}
                        monthlyPercent={m.monthlyPercent}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Team Radar & Rules (On-Demand View) */}
        {activeTab === 'radar' && (
          <div
            className="animate-fade-in"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Team Radar */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RadarIcon size={20} color="var(--accent)" />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Team Performance Radar</h2>
                </div>
                <span className="badge badge-safe">7 Members</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                The dashed green circle shows the <strong>75% Safe Threshold</strong>. Everyone outside is penalty-free!
              </p>
              <TeamRadar data={radarData} />
            </div>

            {/* Simple Team Rules */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <TargetIcon size={20} color="var(--accent)" />
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>How Scoring Works</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                    <ShieldCheckIcon size={20} color="var(--status-safe)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Safe Zone (≥ 75% Average):</strong> 0 penalty points at month-end.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                    <FlameIcon size={20} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Penalty Zones:</strong> 50–74% = 5 pts • 1–49% = 10 pts • 0% = 25 pts.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                    <CrownIcon size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>🎉 100-Point Party Fund:</strong> If anyone hits 100 penalty points, they throw a party for the whole team!
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <Link href="/goals/register" className="btn btn-primary" style={{ flex: 1 }}>
                  <TargetIcon size={16} /> Register Goal
                </Link>
                <Link href="/leaderboard" className="btn btn-secondary" style={{ flex: 1 }}>
                  <TrophyIcon size={16} /> View Leaderboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 4:5 WhatsApp and Discord Social Recap Graphic Generator Modal */}
        <SocialRecapModal
          isOpen={isRecapOpen}
          onClose={() => setIsRecapOpen(false)}
          members={members}
          topScorer={topScorer}
          cycleLabel={cycleInfo.cycleLabel}
        />
      </main>
    </div>
  );
}
