'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Avatar } from '@/components/Avatar';
import { AuditLogEntry, Member } from '@/types';
import { ActivityIcon } from '@/components/ui/Icons';
import { ActivityReactions } from '@/components/activity/ActivityReactions';

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

export default function ActivityLogPage() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = `/api/activity?page=${page}&limit=20`;
      if (selectedMember) query += `&memberId=${selectedMember}`;
      if (selectedEntity) query += `&entity=${selectedEntity}`;

      const res = await fetch(query);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

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
        if (membersData.members) setMembers(membersData.members);
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [page, selectedMember, selectedEntity]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentMember={session?.member} />

      <main className="container" style={{ flex: 1 }}>
        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--bg-accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIcon size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.2rem' }}>
              Team Activity & Updates
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Complete history of goal updates, progress notes, and profile changes
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
              FILTER BY MEMBER
            </label>
            <select
              className="input"
              value={selectedMember}
              onChange={(e) => {
                setSelectedMember(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All 7 Friends</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
              FILTER BY ENTITY
            </label>
            <select
              className="input"
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Entities</option>
              <option value="cheer">Team Cheers 🙌</option>
              <option value="goal">Goal Changes</option>
              <option value="member">Profile Updates</option>
              <option value="month_close">Month Close</option>
              <option value="settings">Admin Settings</option>
              <option value="penalty_event">Penalty Events</option>
            </select>
          </div>
        </div>

        {/* Activity Table */}
        <div className="card table-responsive">
          {loading ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              Loading audit logs...
            </p>
          ) : logs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              No audit logs found for the selected criteria.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>TIMESTAMP (IST)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ACTOR</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ACTION</th>
                  <th style={{ padding: '0.75rem 1rem' }}>TARGET</th>
                  <th style={{ padding: '0.75rem 1rem' }}>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Avatar name={log.actor?.name || 'Actor'} color={log.actor?.avatarColor || '#6366f1'} size="sm" />
                        <span style={{ fontWeight: 600 }}>{log.actor?.name || 'System'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        className={`badge ${
                          log.action === 'create'
                            ? 'badge-safe'
                            : log.action === 'override'
                            ? 'badge-warning'
                            : 'badge-safe'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {log.targetMember ? log.targetMember.name : log.entity}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                      {(() => {
                        try {
                          const val = typeof log.newValue === 'string' ? JSON.parse(log.newValue) : log.newValue;
                          if (log.entity === 'cheer') {
                            return (
                              <div>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                  {val?.message || 'Sent encouragement'}
                                </span>
                              </div>
                            );
                          }
                          if (val && typeof val === 'object') {
                            return (
                              <div>
                                {val.title && <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>&ldquo;{val.title}&rdquo;</div>}
                                {val.newValue !== undefined && (
                                  <div style={{ fontSize: '0.82rem', marginTop: '0.15rem' }}>
                                    Progress updated to <strong style={{ color: 'var(--text-primary)' }}>{val.newValue}%</strong>
                                  </div>
                                )}
                                {val.note && (
                                  <div style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                    &ldquo;{val.note}&rdquo;
                                  </div>
                                )}
                              </div>
                            );
                          }
                        } catch {}
                        return log.newValue ? (
                          <span style={{ fontSize: '0.82rem' }}>{String(log.newValue)}</span>
                        ) : (
                          '—'
                        );
                      })()}

                      {/* Interactive Emoji Reactions */}
                      <ActivityReactions logId={log.id} initialReactions={log.reactions} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
