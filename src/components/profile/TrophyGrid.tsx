'use client';

import React from 'react';

export interface Trophy {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progressText?: string;
}

interface TrophyGridProps {
  trophies: Trophy[];
}

export function TrophyGrid({ trophies }: TrophyGridProps) {
  const unlockedCount = trophies.filter((t) => t.unlocked).length;

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🏆 Achievements & Trophies
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
            Milestones earned through monthly consistency and team camaraderie
          </p>
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          {unlockedCount} of {trophies.length} Unlocked
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '0.85rem',
        }}
      >
        {trophies.map((t) => (
          <div
            key={t.id}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              background: t.unlocked ? 'var(--bg-secondary)' : 'rgba(255, 255, 255, 0.02)',
              border: t.unlocked ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid var(--border-subtle)',
              opacity: t.unlocked ? 1 : 0.55,
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {t.unlocked && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, transparent 50%, rgba(245, 158, 11, 0.2) 50%)',
                }}
              />
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>{t.icon}</span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  background: t.unlocked ? 'var(--status-safe-bg)' : 'rgba(148, 163, 184, 0.1)',
                  color: t.unlocked ? 'var(--status-safe)' : 'var(--text-muted)',
                }}
              >
                {t.unlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: t.unlocked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {t.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: 1.35 }}>
                {t.description}
              </div>
            </div>

            {t.progressText && (
              <div style={{ fontSize: '0.7rem', color: t.unlocked ? 'var(--status-safe)' : 'var(--text-muted)', fontWeight: 600, marginTop: 'auto' }}>
                {t.progressText}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
