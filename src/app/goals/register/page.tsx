'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { getDaysUntilCutoff, isBeforeCutoff, MONTH_NAMES, getCycleInfo } from '@/lib/constants';
import { Goal, Member } from '@/types';
import { TargetIcon, HourglassIcon, LockIcon, ScaleIcon, CheckCircleIcon, AlertTriangleIcon, CalendarIcon } from '@/components/ui/Icons';
import { useFormDraft } from '@/hooks/useFormDraft';
import { playHapticSound } from '@/lib/sound';

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

export default function RegisterGoalsPage() {
  const cycleInfo = getCycleInfo();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [cutoffDay, setCutoffDay] = useState(15);
  const [existingGoals, setExistingGoals] = useState<Goal[]>([]);

  // Persistent Form Drafts (localStorage auto-sync)
  const [title, setTitle, clearTitleDraft, hasTitleRestored] = useFormDraft('goal_title', '');
  const [target, setTarget, clearTargetDraft, hasTargetRestored] = useFormDraft('goal_target', '');
  const [goalType, setGoalType] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [deadline, setDeadline] = useState('');

  const isDraftActive = (hasTitleRestored || hasTargetRestored) && (Boolean(title) || Boolean(target));

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [currentMonth, setCurrentMonth] = useState(cycleInfo.cycleMonth);
  const [daysLeft, setDaysLeft] = useState(cycleInfo.daysLeft);
  const [isLocked, setIsLocked] = useState(false);
  const monthName = MONTH_NAMES[cycleInfo.cycleMonth - 1] || 'Current Month';

  const loadData = async () => {
    try {
      setCurrentMonth(cycleInfo.cycleMonth);
      const [sessionRes, membersRes, settingsRes] = await Promise.all([
        fetch('/api/auth/session'),
        fetch('/api/members'),
        fetch('/api/admin/settings'),
      ]);

      const sessionData = await sessionRes.json();
      const membersData = await membersRes.json();
      const settingsData = await settingsRes.json();

      setSession(sessionData);
      if (membersData.members) {
        setMembers(membersData.members);
        const defaultMemberId = sessionData.memberId || membersData.members[0]?.id;
        setSelectedMemberId(defaultMemberId);
        loadMemberGoals(defaultMemberId);
      }
      const cDay = settingsData.settings?.cutoffDay || 15;
      if (settingsData.settings?.cutoffDay) {
        setCutoffDay(cDay);
      }
      setDaysLeft(cycleInfo.daysLeft);
      setIsLocked(!cycleInfo.isRegistrationDay && !sessionData.isAdmin);
    } catch (err) {
      console.error('Failed to load goal registration data:', err);
    }
  };

  const loadMemberGoals = async (memberId: string) => {
    try {
      const res = await fetch(`/api/goals?memberId=${memberId}&month=${currentMonth}`);
      const data = await res.json();
      if (data.goals) {
        setExistingGoals(data.goals);
      }
    } catch (err) {
      console.error('Failed to load goals:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMemberChange = (id: string) => {
    setSelectedMemberId(id);
    loadMemberGoals(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Goal title is required');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberId,
          title: title.trim(),
          target: target.trim(),
          type: goalType,
          month: goalType === 'MONTHLY' ? cycleInfo.cycleMonth : null,
          deadline: deadline || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create goal');
      }

      setSuccessMsg('Goal registered successfully! Weight recalculated.');
      clearTitleDraft();
      clearTargetDraft();
      playHapticSound('success');
      loadMemberGoals(selectedMemberId);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to register goal');
    } finally {
      setLoading(false);
    }
  };

  const currentCount = existingGoals.length;
  const nextCount = currentCount + 1;
  const currentWeight = currentCount > 0 ? Math.round(100 / currentCount) : 0;
  const nextWeight = Math.round(100 / nextCount);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentMember={session?.member} />

      <main className="container" style={{ flex: 1, maxWidth: '800px' }}>
        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg-accent-subtle)', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TargetIcon size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.2rem' }}>
              Add Team Goals
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Set your monthly and yearly targets with equal-weight scoring.
            </p>
          </div>
        </div>

        {/* 1-Day Registration Window Alert */}
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            borderLeft: `4px solid ${
              cycleInfo.isRegistrationDay
                ? 'var(--status-safe)'
                : session?.isAdmin
                ? 'var(--status-warning)'
                : 'var(--status-critical)'
            }`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {cycleInfo.isRegistrationDay
                ? `Registration Window is OPEN Today (15th)!`
                : `Goal Registration Window for ${cycleInfo.cycleLabel}`}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              {cycleInfo.isRegistrationDay
                ? `Team members can register goals today for the new 30-day cycle (${cycleInfo.cycleLabel}).`
                : `Goal registration is open only 1 day: the 15th of every month. ${
                    session?.isAdmin
                      ? 'Admin override active — you can register goals anytime.'
                      : 'Progress updates remain open for 30 days until the 14th cutoff.'
                  }`}
            </div>
          </div>
          <span
            className={`badge ${
              cycleInfo.isRegistrationDay
                ? 'badge-safe'
                : session?.isAdmin
                ? 'badge-warning'
                : 'badge-critical'
            }`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            {cycleInfo.isRegistrationDay ? (
              <>
                <CalendarIcon size={14} /> Open Today (15th)
              </>
            ) : session?.isAdmin ? (
              <>
                <LockIcon size={14} /> Admin Override
              </>
            ) : (
              <>
                <LockIcon size={14} /> Opens on 15th
              </>
            )}
          </span>
        </div>

        {/* Goal Form Card */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          {isDraftActive && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.55rem 0.85rem',
                marginBottom: '1.25rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-accent-subtle)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                fontSize: '0.82rem',
              }}
            >
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                💾 Draft auto-saved & restored from your previous session
              </span>
              <button
                type="button"
                onClick={() => {
                  clearTitleDraft();
                  clearTargetDraft();
                }}
                className="btn-quick"
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
              >
                Clear Draft
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Member Selector (if admin or picking profile) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Team Member
              </label>
              <select
                className="input"
                value={selectedMemberId}
                onChange={(e) => handleMemberChange(e.target.value)}
                disabled={!session?.isAdmin && Boolean(session?.memberId)}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {session?.memberId === m.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Goal Type Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Goal Scope
              </label>
              <div className="scope-selector-grid">
                <div
                  className={`scope-option-card ${goalType === 'MONTHLY' ? 'active' : ''}`}
                  onClick={() => setGoalType('MONTHLY')}
                >
                  <input
                    type="radio"
                    name="goalType"
                    checked={goalType === 'MONTHLY'}
                    onChange={() => setGoalType('MONTHLY')}
                    style={{ accentColor: 'var(--accent)', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Monthly Goal
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {monthName} Cycle • Safe Zone ≥ 75%
                    </div>
                  </div>
                </div>

                <div
                  className={`scope-option-card ${goalType === 'YEARLY' ? 'active' : ''}`}
                  onClick={() => setGoalType('YEARLY')}
                >
                  <input
                    type="radio"
                    name="goalType"
                    checked={goalType === 'YEARLY'}
                    onChange={() => setGoalType('YEARLY')}
                    style={{ accentColor: 'var(--accent)', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Yearly Objective
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      2026 Milestone • No Monthly Penalty
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Goal Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Goal Title *
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Complete cloud certification exam"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLocked && goalType === 'MONTHLY'}
                required
              />
            </div>

            {/* Target Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Target Details & Criteria
              </label>
              <textarea
                className="input"
                rows={2}
                placeholder="Define measurable acceptance criteria..."
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={isLocked && goalType === 'MONTHLY'}
              />
            </div>

            {/* Deadline for Yearly Goals */}
            {goalType === 'YEARLY' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Target Completion Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            )}

            {/* Equal Weight Calculation Preview */}
            {goalType === 'MONTHLY' && (
              <div
                style={{
                  background: 'var(--bg-accent-subtle)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: 'var(--accent-light)', marginBottom: '0.35rem' }}>
                  <ScaleIcon size={16} /> Equal-Weight Syndicate Rule
                </div>
                <div style={{ color: 'var(--text-primary)' }}>
                  Currently registered: <strong>{currentCount} goals</strong> ({currentWeight}% weight each).
                </div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  With this new goal: <strong>{nextCount} goals</strong> ({nextWeight}% weight each).
                </div>
              </div>
            )}

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-critical)', fontSize: '0.85rem', background: 'var(--status-critical-bg)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-critical)' }}>
                <AlertTriangleIcon size={16} /> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-safe)', fontSize: '0.85rem', background: 'var(--status-safe-bg)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-safe)' }}>
                <CheckCircleIcon size={16} /> {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isLocked && goalType === 'MONTHLY')}
              className="btn btn-primary"
              style={{ padding: '0.85rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                'Registering...'
              ) : isLocked && goalType === 'MONTHLY' ? (
                <>
                  <LockIcon size={16} /> Registration Closed (Opens on 15th)
                </>
              ) : session?.isAdmin && !cycleInfo.isRegistrationDay ? (
                '+ Register Goal (Admin Override)'
              ) : (
                '+ Register Goal (Open Today!)'
              )}
            </button>
          </form>
        </div>

        {/* Existing Registered Goals */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-accent-subtle)', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarIcon size={18} />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Registered Goals for {monthName} ({existingGoals.length})
            </h2>
          </div>

          {existingGoals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No monthly goals registered for this member yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {existingGoals.map((g, idx) => (
                <div
                  key={g.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, marginRight: '0.5rem', color: 'var(--accent-light)' }}>
                      #{idx + 1}
                    </span>
                    <strong style={{ fontSize: '0.95rem' }}>{g.title}</strong>
                    {g.target && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {g.target}
                      </p>
                    )}
                  </div>
                  <span className="badge badge-safe">
                    {Math.round(100 / existingGoals.length)}% weight
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

