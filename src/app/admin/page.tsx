'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { PenaltyEvent, TeamSettings } from '@/types';
import { SettingsIcon, LockIcon, CalendarIcon, ScaleIcon, CheckCircleIcon, AlertTriangleIcon, FlameIcon } from '@/components/ui/Icons';
import { getCycleInfo, MONTH_NAMES } from '@/lib/constants';

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

export default function AdminPage() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<TeamSettings | null>(null);
  const [cutoffDay, setCutoffDay] = useState(15);
  const cycleInfo = getCycleInfo(cutoffDay);
  const [pinsEnabled, setPinsEnabled] = useState(true);
  const [selfEditOnly, setSelfEditOnly] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Month close trigger state
  const [closeMonthLoading, setCloseMonthLoading] = useState(false);
  const [monthCloseResult, setMonthCloseResult] = useState<string | null>(null);
  const [selectedCloseMonth, setSelectedCloseMonth] = useState(cycleInfo.cycleMonth);

  // Penalties
  const [penaltyEvents, setPenaltyEvents] = useState<PenaltyEvent[]>([]);

  const loadData = async () => {
    try {
      const [sessionRes, settingsRes] = await Promise.all([
        fetch('/api/auth/session'),
        fetch('/api/admin/settings'),
      ]);

      const sessionData = await sessionRes.json();
      const settingsData = await settingsRes.json();

      setSession(sessionData);
      if (sessionData.isAdmin) {
        setIsUnlocked(true);
      }

      if (settingsData.settings) {
        setSettings(settingsData.settings);
        setCutoffDay(settingsData.settings.cutoffDay || 15);
        setPinsEnabled(Boolean(settingsData.settings.pinsEnabled));
        setSelfEditOnly(Boolean(settingsData.settings.selfEditOnly));
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Incorrect admin password');
      }

      setIsUnlocked(true);
      loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError('Authentication failed');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cutoffDay,
          pinsEnabled,
          selfEditOnly,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setSaveSuccess('Settings successfully updated and logged to audit trail.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTriggerMonthClose = async () => {
    const monthName = MONTH_NAMES[selectedCloseMonth - 1] || `Month ${selectedCloseMonth}`;
    if (!confirm(`Are you sure you want to execute Month Close for ${monthName} (Month ${selectedCloseMonth})? This will write immutable snapshots and calculate penalty scores.`)) {
      return;
    }

    setCloseMonthLoading(true);
    setMonthCloseResult(null);

    try {
      const res = await fetch('/api/cron/month-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedCloseMonth }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute month close');
      }

      setMonthCloseResult(
        `✅ Month Close Complete for ${monthName}! Snapshots recorded: ${data.snapshotsCreated}. Team Reward: ${
          data.teamRewardUnlocked ? '🏆 UNLOCKED (All 7 at 100%)' : 'Locked'
        }. New party penalties: ${data.newPenaltyEvents}.`
      );
    } catch (err: unknown) {
      setMonthCloseResult(`❌ Error: ${err instanceof Error ? err.message : 'Month close failed'}`);
    } finally {
      setCloseMonthLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentMember={session?.member} />

      <main className="container" style={{ flex: 1, maxWidth: '850px' }}>
        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--bg-accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SettingsIcon size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.2rem' }}>
              Team 7 Administration
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Manage registration cutoffs, access rules, and month-end score calculations
            </p>
          </div>
        </div>

        {!isUnlocked ? (
          <div className="card" style={{ maxWidth: '400px', margin: '3rem auto', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--bg-accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <LockIcon size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Admin Authorization Required
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Enter the admin password to unlock management features (Default: 111)
            </p>

            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="password"
                placeholder="Admin Password"
                className="input"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2em' }}
                autoFocus
              />

              {authError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-critical)', fontSize: '0.85rem', background: 'var(--status-critical-bg)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-critical)' }}>
                  <AlertTriangleIcon size={16} /> {authError}
                </div>
              )}

              <button type="submit" disabled={authLoading} className="btn btn-primary" style={{ padding: '0.75rem' }}>
                {authLoading ? 'Verifying...' : 'Unlock Admin Panel'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Cutoff & Access Settings */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarIcon size={18} />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  Registration Cutoff & Access Rules
                </h2>
              </div>
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Monthly Goal Cutoff Day (1 to 28)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    className="input"
                    value={cutoffDay}
                    onChange={(e) => setCutoffDay(Number(e.target.value))}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    After Day {cutoffDay} at midnight IST, all monthly goal titles and targets lock automatically.
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={pinsEnabled}
                      onChange={(e) => setPinsEnabled(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                      Require 4-digit PIN for Member Profile Selection
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selfEditOnly}
                      onChange={(e) => setSelfEditOnly(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                      Restrict Edits to Own Goals Only (Admins can edit any)
                    </span>
                  </label>
                </div>

                {saveSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-safe)', fontSize: '0.85rem', background: 'var(--status-safe-bg)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-safe)' }}>
                    <CheckCircleIcon size={16} /> {saveSuccess}
                  </div>
                )}

                <button type="submit" disabled={saveLoading} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                  {saveLoading ? 'Saving...' : 'Save Configuration'}
                </button>
              </form>
            </div>

            {/* Month Close Execution */}
            <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FlameIcon size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                      Cycle Evaluation & Snapshots (Day {cycleInfo.settlementDay} Settlement)
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      Evaluates goals, calculates rewards/penalties, and locks the cycle. Concludes on Day {cycleInfo.settlementDay} of each cycle.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Target Cycle:
                    </label>
                    <select
                      value={selectedCloseMonth}
                      onChange={(e) => setSelectedCloseMonth(Number(e.target.value))}
                      className="input"
                      style={{ padding: '0.4rem 0.75rem', width: 'auto', fontSize: '0.85rem' }}
                    >
                      {MONTH_NAMES.map((name, idx) => {
                        const mNum = idx + 1;
                        return (
                          <option key={mNum} value={mNum}>
                            {name} (Month {mNum}){mNum === cycleInfo.cycleMonth ? ' • Current Active' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <button
                    onClick={handleTriggerMonthClose}
                    disabled={closeMonthLoading}
                    className="btn btn-primary"
                    style={{ background: 'var(--gradient-safe)', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                  >
                    <FlameIcon size={16} /> {closeMonthLoading ? 'Calculating...' : 'Evaluate & Close Cycle'}
                  </button>
                </div>
              </div>

              {monthCloseResult && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.9rem',
                  }}
                >
                  {monthCloseResult}
                </div>
              )}
            </div>

            {/* Threshold & Penalty Reference */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ScaleIcon size={18} />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  Locked Penalty Table Reference
                </h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Client rules configured in database settings:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
                <div style={{ background: 'var(--status-safe-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-safe)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--status-safe)' }}>SAFE ZONE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>≥ 75% Avg</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>0 penalty points</div>
                </div>

                <div style={{ background: 'var(--status-warning-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-warning)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--status-warning)' }}>WARNING</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>50% to &lt; 75%</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>5 penalty points</div>
                </div>

                <div style={{ background: 'var(--status-danger-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-danger)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--status-danger)' }}>DANGER</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>&gt; 0% to &lt; 50%</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>10 penalty points</div>
                </div>

                <div style={{ background: 'var(--status-critical-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-critical)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--status-critical)' }}>NOT STARTED</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>0% (No Progress)</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>25 penalty points</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
