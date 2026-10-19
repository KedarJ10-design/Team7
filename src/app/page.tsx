'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WatermelonIcon } from '@/components/ui/Icons';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter the team password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/pick-profile');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--bg-accent-subtle)',
            marginBottom: '1.25rem',
          }}
        >
          <WatermelonIcon size={34} />
        </div>

        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            marginBottom: '0.35rem',
          }}
        >
          Team 7 Tracker
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Monthly goals & friendly accountability for our 7 friends
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <input
              type="password"
              placeholder="Enter Team Password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.15em' }}
              autoFocus
            />
          </div>

          {error && (
            <div
              style={{
                color: 'var(--status-critical)',
                fontSize: '0.85rem',
                background: 'var(--status-critical-bg)',
                padding: '0.6rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
          >
            {loading ? 'Opening...' : 'Enter Team 7 →'}
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Shared team access • Individual 4-digit PIN verification
        </div>
      </div>
    </main>
  );
}

