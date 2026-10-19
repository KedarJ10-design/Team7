'use client';

import React, { useState } from 'react';
import { TargetIcon } from './ui/Icons';
import { fireConfetti } from '@/lib/confetti';
import { playHapticSound } from '@/lib/sound';

interface ProgressModalProps {
  goalId: string;
  goalTitle: string;
  currentProgress: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProgress: number) => void;
}

export function ProgressModal({
  goalId,
  goalTitle,
  currentProgress,
  isOpen,
  onClose,
  onSuccess,
}: ProgressModalProps) {
  const [value, setValue] = useState(currentProgress);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleQuickAdd = (amount: number) => {
    playHapticSound('step');
    setValue((prev) => Math.min(100, Math.max(0, prev + amount)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError('Please add a brief note explaining this progress update (required for audit logging).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/goals/${goalId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newValue: value,
          note: note.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update progress');
      }

      if (value >= 100) {
        playHapticSound('success');
        fireConfetti({ theme: 'gold', particleCount: 85 });
      } else if (value >= 75 && currentProgress < 75) {
        playHapticSound('success');
        fireConfetti({ theme: 'safe', particleCount: 70 });
      } else {
        playHapticSound('click');
      }

      onSuccess(value);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 5, 12, 0.8)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: 'clamp(1.1rem, 4vw, 1.85rem)',
          border: '1px solid var(--border-focus)',
          boxShadow: 'var(--shadow-glow), var(--shadow-glass)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--bg-accent-subtle)',
                color: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TargetIcon size={18} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Log Goal Progress
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.92rem',
            marginBottom: '1.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-input)',
            borderLeft: '3px solid var(--accent)',
            fontStyle: 'italic',
          }}
        >
          &ldquo;{goalTitle}&rdquo;
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                Adjust Progress
              </span>
              <span
                className="num-tabular"
                style={{
                  fontWeight: 900,
                  fontSize: '1.5rem',
                  color: value >= 75 ? 'var(--status-safe)' : value >= 50 ? 'var(--status-warning)' : 'var(--status-danger)',
                  letterSpacing: '-0.03em',
                }}
              >
                {value}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => {
                  playHapticSound('step');
                  setValue((prev) => Math.max(0, prev - 5));
                }}
                className="btn-quick"
                title="Decrease by 5%"
                style={{ padding: '0.4rem 0.65rem', fontWeight: 700 }}
              >
                −5%
              </button>

              <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (Math.abs(val - value) >= 5) {
                    playHapticSound('click');
                  }
                  setValue(val);
                }}
                style={{
                  flex: 1,
                  accentColor: 'var(--accent)',
                  cursor: 'pointer',
                  height: '10px',
                  borderRadius: '5px',
                }}
              />

              <button
                type="button"
                onClick={() => {
                  playHapticSound('step');
                  setValue((prev) => Math.min(100, prev + 5));
                }}
                className="btn-quick"
                title="Increase by 5%"
                style={{ padding: '0.4rem 0.65rem', fontWeight: 700 }}
              >
                +5%
              </button>
            </div>

            {/* Quick jump buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button type="button" onClick={() => handleQuickAdd(10)} className="btn-quick">
                +10%
              </button>
              <button type="button" onClick={() => handleQuickAdd(25)} className="btn-quick">
                +25%
              </button>
              <button
                type="button"
                onClick={() => {
                  playHapticSound('step');
                  setValue(50);
                }}
                className="btn-quick"
              >
                Set 50%
              </button>
              <button
                type="button"
                onClick={() => {
                  playHapticSound('step');
                  setValue(75);
                }}
                className="btn-quick"
              >
                Set 75% (Safe)
              </button>
              <button
                type="button"
                onClick={() => {
                  playHapticSound('success');
                  setValue(100);
                }}
                className="btn-quick"
                style={{ color: 'var(--status-safe)', borderColor: 'var(--status-safe-border)' }}
              >
                100% Done
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              What did you accomplish? (Note for your team)
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="e.g. Completed chapter 4, finished mockups, tested with team..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
            />
          </div>

          {error && (
            <div
              style={{
                color: 'var(--status-critical)',
                fontSize: '0.85rem',
                background: 'var(--status-critical-bg)',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--status-critical-border)',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Save Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
