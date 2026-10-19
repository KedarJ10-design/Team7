'use client';

import React, { useRef, useState } from 'react';
import { CrownIcon, WatermelonIcon, TrophyIcon, ShieldCheckIcon, GiftIcon } from './ui/Icons';
import { playHapticSound } from '@/lib/sound';

export interface RecapMember {
  id: string;
  name: string;
  avatarColor: string;
  monthlyPercent: number;
  yearlyScore?: number;
  penaltyPoints?: number;
}

interface SocialRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: RecapMember[];
  topScorer?: RecapMember | null;
  cycleLabel: string;
}

export function SocialRecapModal({
  isOpen,
  onClose,
  members,
  topScorer,
  cycleLabel,
}: SocialRecapModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const totalPenalties = members.reduce((sum, m) => sum + (m.penaltyPoints || 0), 0);
  const totalPercent = members.reduce((sum, m) => sum + m.monthlyPercent, 0);
  const teamAverage = members.length > 0 ? Math.round(totalPercent / members.length) : 0;
  const allSafe = members.every((m) => m.monthlyPercent >= 75);
  const allComplete = members.every((m) => m.monthlyPercent >= 100);

  const handleDownload = async () => {
    setDownloading(true);
    playHapticSound('click');

    try {
      // Dynamic HTML5 Canvas rendering for high-res PNG export
      const canvas = document.createElement('canvas');
      const scale = 2; // High-DPI 2x
      canvas.width = 600 * scale;
      canvas.height = 760 * scale;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.scale(scale, scale);

        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 760);
        bgGrad.addColorStop(0, '#0c101d');
        bgGrad.addColorStop(0.5, '#080b11');
        bgGrad.addColorStop(1, '#05070c');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 600, 760);

        // Ambient border
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 580, 740);

        // Header
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('TEAM 7 SYNDICATE • MONTHLY RECAP', 40, 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`Cycle: ${cycleLabel}`, 40, 85);

        // Top Leader Hero Box
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(40, 110, 520, 110, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('👑 TOP LEADER OF THE CYCLE', 60, 138);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(topScorer?.name || 'In Progress', 60, 172);

        ctx.fillStyle = '#8292ad';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Score: ${topScorer?.yearlyScore || 0} pts  •  Completion: ${topScorer?.monthlyPercent || 0}%`, 60, 198);

        // Key Stats Row
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(40, 235, 250, 75, 10);
        ctx.roundRect(310, 235, 250, 75, 10);
        ctx.fill();

        ctx.fillStyle = '#8292ad';
        ctx.font = '11px sans-serif';
        ctx.fillText('TEAM COLLECTIVE AVERAGE', 55, 260);
        ctx.fillText('TOTAL PARTY PENALTY FUND', 325, 260);

        ctx.fillStyle = teamAverage >= 75 ? '#10b981' : '#f43f5e';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`${teamAverage}% ${allSafe ? '🛡️ Safe Zone' : ''}`, 55, 292);

        ctx.fillStyle = totalPenalties > 0 ? '#f59e0b' : '#10b981';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`${totalPenalties} pts accumulated`, 325, 292);

        // Leaderboard List
        ctx.fillStyle = '#8292ad';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('RANK', 50, 335);
        ctx.fillText('MEMBER', 110, 335);
        ctx.fillText('PROGRESS', 340, 335);
        ctx.fillText('PENALTY', 470, 335);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(40, 345);
        ctx.lineTo(560, 345);
        ctx.stroke();

        members.slice(0, 7).forEach((m, idx) => {
          const y = 375 + idx * 42;

          ctx.fillStyle = idx === 0 ? '#fbbf24' : '#8292ad';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(`#${idx + 1}`, 50, y);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(m.name, 110, y);

          // Progress pill
          ctx.fillStyle = m.monthlyPercent >= 75 ? '#10b981' : '#f59e0b';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(`${m.monthlyPercent}%`, 340, y);

          ctx.fillStyle = (m.penaltyPoints || 0) > 0 ? '#f43f5e' : '#8292ad';
          ctx.font = '13px sans-serif';
          ctx.fillText(`${m.penaltyPoints || 0} pts`, 470, y);
        });

        // Footer note
        ctx.fillStyle = '#8292ad';
        ctx.font = '11px sans-serif';
        ctx.fillText('7 Friends Syndicate • Zero Daily Chores • 100% Transparent Accountability', 80, 715);

        // Trigger file download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Team7_Recap_${cycleLabel.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        link.href = dataUrl;
        link.click();
        playHapticSound('success');
      }
    } catch (err) {
      console.error('Failed to generate image:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    playHapticSound('click');
    const shareText = `🍉 *Team 7 Tracker — ${cycleLabel} Standings*\n\n👑 Top Leader: *${topScorer?.name || 'TBD'}* (${topScorer?.yearlyScore || 0} pts)\n📊 Team Average: *${teamAverage}%*\n💰 Penalty Party Fund: *${totalPenalties} pts*\n\nCheck full standings on the dashboard!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Team 7 Recap: ${cycleLabel}`,
          text: shareText,
          url: window.location.origin + '/leaderboard',
        });
        playHapticSound('success');
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      playHapticSound('success');
      setTimeout(() => setCopied(false), 3000);
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
        backgroundColor: 'rgba(5, 5, 12, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: 'clamp(1rem, 4vw, 1.75rem)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 25px rgba(245, 158, 11, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CrownIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                Social Recap Card
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Share with your 7 friends on WhatsApp or Discord
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Visual Card Preview */}
        <div
          ref={cardRef}
          style={{
            background: 'linear-gradient(180deg, #101522 0%, #080b11 100%)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 'clamp(0.85rem, 3.5vw, 1.5rem)',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <WatermelonIcon size={20} />
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Team 7</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>RECAP</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {cycleLabel}
            </span>
          </div>

          {/* Top Leader Box */}
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>
              👑 Top Leader of the Cycle
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
              {topScorer?.name || 'TBD'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              Score: <strong style={{ color: 'var(--text-primary)' }}>{topScorer?.yearlyScore || 0} pts</strong> • Completion: <strong style={{ color: '#fbbf24' }}>{topScorer?.monthlyPercent || 0}%</strong>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--bg-input)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Team Average
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: teamAverage >= 75 ? 'var(--status-safe)' : 'var(--accent)' }}>
                {teamAverage}%
              </div>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Party Penalty Fund
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: totalPenalties > 0 ? 'var(--status-warning)' : 'var(--status-safe)' }}>
                {totalPenalties} pts
              </div>
            </div>
          </div>

          {/* Standings List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {members.slice(0, 7).map((m, idx) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                  padding: '0.35rem 0.6rem',
                  borderRadius: 'var(--radius-xs)',
                  background: idx === 0 ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 800, color: idx === 0 ? '#fbbf24' : 'var(--text-muted)', width: '20px' }}>
                    #{idx + 1}
                  </span>
                  <span style={{ fontWeight: 700 }}>{m.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: 800, color: m.monthlyPercent >= 75 ? 'var(--status-safe)' : 'var(--status-warning)' }}>
                    {m.monthlyPercent}%
                  </span>
                  <span style={{ fontSize: '0.72rem', color: (m.penaltyPoints || 0) > 0 ? 'var(--status-critical)' : 'var(--text-muted)' }}>
                    {m.penaltyPoints || 0} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn btn-primary"
            style={{ flex: 1, padding: '0.7rem 1rem' }}
          >
            {downloading ? 'Rendering Image...' : '📥 Download Recap PNG'}
          </button>

          <button
            onClick={handleShare}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '0.7rem 1rem' }}
          >
            {copied ? '✅ Text Copied!' : '💬 Share to WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}
