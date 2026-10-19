'use client';

import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';

interface MemberAxisData {
  name: string;
  percent: number;
}

interface TeamRadarProps {
  data: MemberAxisData[];
}

export function TeamRadar({ data }: TeamRadarProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        No member data available for radar
      </div>
    );
  }

  // Format data with safe threshold benchmark of 75%
  const formattedData = data.map((d) => ({
    member: d.name,
    firstName: d.name.split(' ')[0],
    percent: Math.round(d.percent),
    safeTarget: 75, // 75% benchmark threshold ring
  }));

  return (
    <div style={{ width: '100%', height: 350, position: 'relative' }}>
      {/* Visual Legend Guide */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '0.5rem',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#818cf8' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />
          Current Monthly %
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#10b981' }}>
          <span style={{ width: '12px', height: '2px', background: '#10b981', borderTop: '2px dashed #10b981' }} />
          Safe Threshold (75%)
        </span>
      </div>

      <ResponsiveContainer width="100%" height="90%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={formattedData}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="firstName"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            stroke="rgba(255, 255, 255, 0.1)"
          />

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                const isSafe = item.percent >= 75;
                return (
                  <div
                    style={{
                      background: 'rgba(15, 16, 28, 0.95)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid var(--border-card)',
                      padding: '0.75rem 1.1rem',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{item.member}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                      <span style={{ color: isSafe ? 'var(--status-safe)' : 'var(--status-warning)', fontWeight: 800 }}>
                        {item.percent}%
                      </span>
                      <span className={`badge ${isSafe ? 'badge-safe' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                        {isSafe ? 'SAFE' : 'RISK'}
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />

          {/* Dotted 75% Safe Threshold Ring */}
          <Radar
            name="Safe Benchmark"
            dataKey="safeTarget"
            stroke="#10b981"
            strokeDasharray="4 4"
            fill="transparent"
            strokeWidth={1.5}
          />

          {/* Actual Member Performance Polygon */}
          <Radar
            name="Monthly %"
            dataKey="percent"
            stroke="#6366f1"
            fill="url(#radarGradient)"
            fillOpacity={0.45}
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#818cf8', stroke: '#ffffff', strokeWidth: 1.5 }}
          />

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0.2} />
            </linearGradient>
          </defs>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
