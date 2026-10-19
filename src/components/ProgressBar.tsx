'use client';

import React from 'react';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  showLabel?: boolean;
  height?: number;
  labelPrefix?: string;
  variant?: 'segmented' | 'meter';
  showMilestones?: boolean;
  showStatusChip?: boolean;
}

export function ProgressBar({
  progress,
  showLabel = true,
  height = 8,
  labelPrefix = 'Progress',
  variant = 'segmented',
  showMilestones = false,
  showStatusChip = true,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  const getGradient = (p: number) => {
    if (p >= 75) return 'var(--gradient-safe)';
    if (p >= 50) return 'var(--gradient-warning)';
    if (p > 0) return 'var(--gradient-danger)';
    return 'var(--gradient-critical)';
  };

  const getTextColor = (p: number) => {
    if (p >= 75) return 'var(--status-safe)';
    if (p >= 50) return 'var(--status-warning)';
    if (p > 0) return 'var(--status-danger)';
    return 'var(--status-critical)';
  };

  const getStatusLabel = (p: number) => {
    if (p >= 100) return 'Complete';
    if (p >= 75) return 'Safe';
    if (p >= 50) return 'Warning';
    if (p > 0) return 'At Risk';
    return 'Not Started';
  };

  const gradient = getGradient(clamped);
  const textColor = getTextColor(clamped);
  const statusLabel = getStatusLabel(clamped);

  return (
    <div style={{ width: '100%', userSelect: 'none', pointerEvents: 'none' }}>
      {showLabel && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.45rem',
            fontSize: '0.82rem',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.02em' }}>
            {labelPrefix}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              className="num-tabular"
              style={{
                color: textColor,
                fontWeight: 800,
                fontSize: '0.92rem',
                letterSpacing: '-0.02em',
              }}
            >
              {clamped}%
            </span>
            {showStatusChip && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  padding: '0.12rem 0.45rem',
                  borderRadius: '4px',
                  background:
                    clamped >= 75
                      ? 'var(--status-safe-bg)'
                      : clamped >= 50
                      ? 'var(--status-warning-bg)'
                      : 'var(--status-critical-bg)',
                  color: textColor,
                  border: `1px solid ${
                    clamped >= 75
                      ? 'var(--status-safe-border)'
                      : clamped >= 50
                      ? 'var(--status-warning-border)'
                      : 'var(--status-critical-border)'
                  }`,
                }}
              >
                {statusLabel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* VARIANT 1: Segmented Meter (10 discrete blocks, distinct from an editable slider) */}
      {variant === 'segmented' ? (
        <div>
          <div
            style={{
              display: 'flex',
              gap: '3px',
              width: '100%',
              height: `${height}px`,
              alignItems: 'center',
            }}
          >
            {Array.from({ length: 10 }).map((_, i) => {
              const segStart = i * 10;
              const segEnd = (i + 1) * 10;
              let fillRatio = 0;
              if (clamped >= segEnd) {
                fillRatio = 1;
              } else if (clamped > segStart) {
                fillRatio = (clamped - segStart) / 10;
              }

              // Highlight boundary segment 7-8 where 75% safe target is
              const isTargetSegment = i === 7;

              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '100%',
                    background: 'var(--bg-secondary)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    border: isTargetSegment
                      ? '1px solid rgba(34, 197, 94, 0.45)'
                      : '1px solid var(--border-subtle)',
                    position: 'relative',
                  }}
                  title={`${segStart}% - ${segEnd}%`}
                >
                  <div
                    style={{
                      width: `${fillRatio * 100}%`,
                      height: '100%',
                      background: gradient,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {showMilestones && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                marginTop: '0.3rem',
                padding: '0 2px',
              }}
            >
              <span>0%</span>
              <span style={{ color: 'var(--status-warning)' }}>50%</span>
              <span style={{ color: 'var(--status-safe)', fontWeight: 700 }}>75% Target</span>
              <span>100%</span>
            </div>
          )}
        </div>
      ) : (
        /* VARIANT 2: Sleek Continuous Benchmark Gauge (with milestone ticks, no knob) */
        <div>
          <div
            style={{
              width: '100%',
              height: `${height}px`,
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
              position: 'relative',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* 50% warning boundary marker */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: '1px',
                background: 'rgba(255, 255, 255, 0.18)',
                zIndex: 2,
              }}
            />
            {/* 75% safe target marker */}
            <div
              style={{
                position: 'absolute',
                left: '75%',
                top: 0,
                bottom: 0,
                width: '2px',
                background: 'rgba(34, 197, 94, 0.55)',
                zIndex: 2,
              }}
            />

            {/* Fill ribbon (no knob, no circle) */}
            <div
              style={{
                width: `${clamped}%`,
                height: '100%',
                background: gradient,
                borderRadius: '3px',
                transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>

          {showMilestones && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                marginTop: '0.3rem',
              }}
            >
              <span>0%</span>
              <span style={{ color: 'var(--status-warning)' }}>50%</span>
              <span style={{ color: 'var(--status-safe)', fontWeight: 700 }}>75% Safe</span>
              <span>100%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
