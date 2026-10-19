'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Avatar } from '@/components/Avatar';
import { ProgressBar } from '@/components/ProgressBar';
import { TeamRadar } from '@/components/charts/TeamRadar';
import { CrownIcon, TrophyIcon, ShieldCheckIcon, FlameIcon } from '@/components/ui/Icons';
import { MemberDashboardData } from '@/types';
import { getCycleInfo } from '@/lib/constants';
import { SocialRecapModal } from '@/components/SocialRecapModal';
import Link from 'next/link';

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

export default function LeaderboardPage() {
  const cycleInfo = getCycleInfo();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [members, setMembers] = useState<MemberDashboardData[]>([]);
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
          const sorted = [...membersData.members].sort(
            (a: MemberDashboardData, b: MemberDashboardData) => {
              if (b.yearlyScore !== a.yearlyScore) {
                return b.yearlyScore - a.yearlyScore;
              }
              return a.penaltyPoints - b.penaltyPoints;
            }
          );
          setMembers(sorted);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading Syndicate Standings...</p>
      </div>
    );
  }

  const topScorer = members.length > 0 ? members[0] : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentMember={session?.member} onOpenRecap={() => setIsRecapOpen(true)} />

      <main className="container" style={{ flex: 1 }}>
        <div style={{ margin: '1.75rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Season Standings • 2026
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Team Leaderboard
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Rankings sorted by highest score. Tiebreaker: fewest penalty points.
            </p>
          </div>

          <button
            onClick={() => setIsRecapOpen(true)}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              borderColor: 'rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.08)',
              color: '#fbbf24',
            }}
            title="Generate and export WhatsApp group chat recap graphic"
          >
            <CrownIcon size={16} />
            Export WhatsApp Recap Card
          </button>
        </div>

        {/* Crown Top Scorer Hero */}
        {topScorer && (
          <div
            className="card card-leader"
            style={{
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CrownIcon size={30} />
              </div>
              <div>
                <span className="badge badge-gold" style={{ marginBottom: '0.35rem' }}>
                  <span className="badge-dot" />
                  Top Leader
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{topScorer.name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.15rem' }}>
                  Score: <strong style={{ color: 'var(--text-primary)' }}>{topScorer.yearlyScore} pts</strong> • Total Penalties:{' '}
                  <strong style={{ color: 'var(--status-safe)' }}>{topScorer.penaltyPoints} pts</strong>
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Monthly Completion
              </div>
              <div className="num-tabular" style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f59e0b' }}>
                {topScorer.monthlyPercent}%
              </div>
            </div>
          </div>
        )}

        {/* Standings Table Card */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>
            Standings Table (7 Friends)
          </h2>

          {/* Desktop Table View (> 640px) */}
          <div className="desktop-standings-table table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '640px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>RANK</th>
                  <th style={{ padding: '0.85rem 1rem' }}>MEMBER</th>
                  <th style={{ padding: '0.85rem 1rem' }}>MONTHLY PROGRESS</th>
                  <th style={{ padding: '0.85rem 1rem' }}>PENALTIES</th>
                  <th style={{ padding: '0.85rem 1rem' }}>YEARLY SCORE</th>
                  <th style={{ padding: '0.85rem 1rem' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, idx) => (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '0.9rem',
                      background: idx === 0 ? 'var(--bg-accent-subtle)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: idx === 0 ? '#f59e0b' : 'var(--text-secondary)' }}>
                      #{idx + 1}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Avatar
                          name={m.name}
                          color={m.avatarColor}
                          size="sm"
                          status={idx === 0 ? 'gold' : undefined}
                        />
                        <div>
                          <strong>{m.name}</strong>
                          {m.isAdmin && (
                            <span style={{ fontSize: '0.65rem', color: '#f59e0b', marginLeft: '0.4rem', fontWeight: 800 }}>
                              ★ ADMIN
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', width: '220px' }}>
                      <ProgressBar progress={m.monthlyPercent} height={7} />
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span
                        className="num-tabular"
                        style={{
                          fontWeight: 700,
                          color: m.penaltyPoints >= 75 ? 'var(--status-critical)' : 'var(--text-primary)',
                        }}
                      >
                        {m.penaltyPoints} pts
                      </span>
                      {m.penaltyPoints >= 75 && (
                        <span className="badge badge-critical" style={{ marginLeft: '0.4rem', fontSize: '0.65rem' }}>
                          AT RISK
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent)' }}>
                      {m.yearlyScore} pts
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <Link href={`/member/${m.id}`} className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
                        View Goals →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Standings Card View (<= 640px) */}
          <div className="mobile-standings-cards">
            {members.map((m, idx) => (
              <div
                key={m.id}
                style={{
                  background: idx === 0 ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-input)',
                  border: `1px solid ${idx === 0 ? 'rgba(245, 158, 11, 0.35)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span
                      style={{
                        fontWeight: 900,
                        fontSize: '0.9rem',
                        color: idx === 0 ? '#f59e0b' : 'var(--text-muted)',
                        width: '24px',
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <Avatar name={m.name} color={m.avatarColor} size="sm" status={idx === 0 ? 'gold' : undefined} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{m.name}</div>
                      {m.isAdmin && (
                        <span style={{ fontSize: '0.62rem', color: '#f59e0b', fontWeight: 800 }}>★ ADMIN</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`badge ${m.monthlyPercent >= 75 ? 'badge-safe' : 'badge-warning'}`}
                    style={{ fontSize: '0.68rem' }}
                  >
                    {m.monthlyPercent >= 75 ? 'SAFE' : 'NEEDS PUSH'}
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Monthly Goal</span>
                    <strong className="num-tabular" style={{ color: m.monthlyPercent >= 75 ? 'var(--status-safe)' : 'var(--accent)' }}>
                      {m.monthlyPercent}%
                    </strong>
                  </div>
                  <ProgressBar progress={m.monthlyPercent} height={6} showLabel={false} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase' }}>Score • Penalties</span>
                    <strong style={{ color: 'var(--accent)' }}>{m.yearlyScore} pts</strong>
                    <span style={{ color: 'var(--text-secondary)' }}> • </span>
                    <span style={{ color: m.penaltyPoints > 0 ? 'var(--status-critical)' : 'var(--text-muted)' }}>
                      {m.penaltyPoints} pen
                    </span>
                  </div>

                  <Link href={`/member/${m.id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}>
                    View Goals →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 100-Point Party Callout */}
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CrownIcon size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.2rem' }}>
              🎉 The 100-Point Party Rule
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              If any member accumulates 100 total penalty points, they celebrate by treating the entire 7-person team to a party!
            </p>
          </div>
        </div>

        {/* Team Radar View */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <TrophyIcon size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              Team Performance Radar
            </h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Compare progress across all 7 members with the 75% safe benchmark
          </p>
          <TeamRadar
            data={members.map((m) => ({
              name: m.name,
              percent: m.monthlyPercent,
            }))}
          />
        </div>

        {/* WhatsApp & Social Recap Modal */}
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
