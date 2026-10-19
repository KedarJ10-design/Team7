'use client';

import React, { useState } from 'react';
import { fireConfetti } from '@/lib/confetti';
import { playHapticSound } from '@/lib/sound';

interface CheerButtonProps {
  targetMemberId: string;
  targetMemberName: string;
  monthlyPercent: number;
}

export function CheerButton({
  targetMemberId,
  targetMemberName,
  monthlyPercent,
}: CheerButtonProps) {
  const [cheered, setCheered] = useState(false);
  const [loading, setLoading] = useState(false);

  const needed = Math.max(1, 75 - monthlyPercent);

  const handleCheer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (loading || cheered) return;

    setLoading(true);
    try {
      const res = await fetch('/api/activity/cheer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetMemberId,
          message: `Cheered ${targetMemberName}: "You're only ${needed}% away from the Safe Zone! You got this! 💪"`,
        }),
      });

      if (res.ok) {
        setCheered(true);
        playHapticSound('cheer');
        fireConfetti({ theme: 'safe', particleCount: 35 });
        setTimeout(() => setCheered(false), 5000);
      }
    } catch (err) {
      console.error('Failed to cheer:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheer}
      disabled={loading}
      className="btn-quick"
      title={`Send ${targetMemberName} a cheer to reach the 75% Safe Zone`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.35rem',
        fontSize: '0.8rem',
        fontWeight: 700,
        height: '38px',
        padding: '0 0.75rem',
        borderRadius: 'var(--radius-sm)',
        background: cheered ? 'var(--status-safe-bg)' : 'rgba(245, 158, 11, 0.08)',
        color: cheered ? 'var(--status-safe)' : 'var(--status-warning)',
        border: `1px solid ${cheered ? 'var(--status-safe-border)' : 'rgba(245, 158, 11, 0.25)'}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <span>{cheered ? '🙌 Cheered!' : '⚡ Cheer'}</span>
    </button>
  );
}
