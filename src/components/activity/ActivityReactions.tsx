'use client';

import React, { useState } from 'react';

interface ActivityReactionsProps {
  logId: string;
  initialReactions?: Record<string, number>;
}

const EMOJIS = ['🔥', '👏', '🚀', '❤️'];

export function ActivityReactions({
  logId,
  initialReactions = {},
}: ActivityReactionsProps) {
  const [reactions, setReactions] = useState<Record<string, number>>(initialReactions);
  const [userReacted, setUserReacted] = useState<Record<string, boolean>>({});

  const handleReact = async (emoji: string) => {
    // Optimistic toggle
    const isCurrentlyReacted = !!userReacted[emoji];
    setUserReacted((prev) => ({ ...prev, [emoji]: !isCurrentlyReacted }));
    setReactions((prev) => ({
      ...prev,
      [emoji]: Math.max(0, (prev[emoji] || 0) + (isCurrentlyReacted ? -1 : 1)),
    }));

    try {
      await fetch('/api/activity/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, emoji }),
      });
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
      {EMOJIS.map((emoji) => {
        const count = reactions[emoji] || 0;
        const active = userReacted[emoji];

        return (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className="btn-quick"
            style={{
              padding: '0.15rem 0.45rem',
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              borderRadius: 'var(--radius-xs)',
              background: active ? 'var(--bg-accent-subtle)' : 'var(--bg-secondary)',
              borderColor: active ? 'var(--accent)' : 'var(--border-subtle)',
              cursor: 'pointer',
              lineHeight: 1.2,
            }}
            title={`React with ${emoji}`}
          >
            <span>{emoji}</span>
            {count > 0 && (
              <span className="num-tabular" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
