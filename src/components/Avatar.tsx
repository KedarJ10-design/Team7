'use client';

import React from 'react';
import { CrownIcon } from './ui/Icons';

interface AvatarProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'safe' | 'warning' | 'danger' | 'critical' | 'gold';
  showStatusRing?: boolean;
}

export function Avatar({
  name,
  color = '#6366f1',
  size = 'md',
  status,
  showStatusRing = false,
}: AvatarProps) {
  const getInitials = (str: string) => {
    if (!str) return '??';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const sizeMap = {
    sm: { dimension: '32px', fontSize: '0.8rem', ringWidth: '2px' },
    md: { dimension: '46px', fontSize: '1rem', ringWidth: '2.5px' },
    lg: { dimension: '60px', fontSize: '1.3rem', ringWidth: '3px' },
    xl: { dimension: '76px', fontSize: '1.65rem', ringWidth: '3px' },
  };

  const { dimension, fontSize, ringWidth } = sizeMap[size];

  const getRingColor = () => {
    switch (status) {
      case 'gold': return '#fbbf24';
      case 'safe': return 'var(--status-safe)';
      case 'warning': return 'var(--status-warning)';
      case 'danger': return 'var(--status-danger)';
      case 'critical': return 'var(--status-critical)';
      default: return 'transparent';
    }
  };

  const ringColor = getRingColor();

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: dimension,
          height: dimension,
          borderRadius: '50%',
          background: color,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize,
          boxShadow: showStatusRing
            ? `0 0 0 ${ringWidth} ${ringColor}`
            : '0 1px 3px rgba(0, 0, 0, 0.1)',
          userSelect: 'none',
          flexShrink: 0,
          transition: 'var(--transition)',
        }}
      >
        {getInitials(name)}
      </div>

      {/* Leader Crown Badge icon if status === 'gold' */}
      {status === 'gold' && (
        <div
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#fbbf24',
            color: '#78350f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
          title="Team Leader"
        >
          <CrownIcon size={11} color="#78350f" />
        </div>
      )}
    </div>
  );
}
