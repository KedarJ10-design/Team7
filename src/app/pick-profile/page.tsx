'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/Avatar';
import { WatermelonIcon } from '@/components/ui/Icons';
import { Member } from '@/types';

export default function PickProfilePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/members');
        const data = await res.json();
        if (data.members) {
          setMembers(data.members);
        }
      } catch (err) {
        console.error('Failed to load members:', err);
      } finally {
        setPageLoading(false);
      }
    }
    load();
  }, []);

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setPin('');
    setError('');
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMember.id,
          pin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Incorrect PIN');
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading profiles...</p>
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'var(--bg-accent-subtle)',
            marginBottom: '0.75rem',
          }}
        >
          <WatermelonIcon size={30} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
          Who is checking in?
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Select your profile to view and update your goals for this month
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.85rem',
          width: '100%',
          maxWidth: '850px',
        }}
      >
        {members.map((m) => (
          <div
            key={m.id}
            onClick={() => handleSelectMember(m)}
            className="card card-interactive"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1.75rem 1rem',
              textAlign: 'center',
              border: selectedMember?.id === m.id ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            <Avatar name={m.name} color={m.avatarColor} size="lg" />
            <h3 style={{ marginTop: '1rem', fontSize: '1.05rem', fontWeight: 700 }}>
              {m.name}
            </h3>
            {m.isAdmin ? (
              <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, marginTop: '0.25rem' }}>
                ADMIN
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Team Member
              </span>
            )}
          </div>
        ))}
      </div>

      {/* PIN Verification Modal */}
      {selectedMember && (
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
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '2rem',
              textAlign: 'center',
              border: '1px solid var(--border-focus)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <Avatar name={selectedMember.name} color={selectedMember.avatarColor} size="lg" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {selectedMember.name}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Enter your 4-digit PIN for identity verification
            </p>

            <form onSubmit={handleVerifyPin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                className="input"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                style={{
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  letterSpacing: '0.4em',
                }}
                autoFocus
              />

              {error && (
                <div
                  style={{
                    color: 'var(--status-critical)',
                    fontSize: '0.85rem',
                    background: 'var(--status-critical-bg)',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {loading ? 'Verifying...' : 'Unlock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
