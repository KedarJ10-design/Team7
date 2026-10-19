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
import { MONTH_SHORT } from '@/lib/constants';

interface MonthData {
  month: number; // 1 to 12
  percent: number;
}

interface PersonalRadarProps {
  history: MonthData[];
}

export function PersonalRadar({ history }: PersonalRadarProps) {
  // Build 12 months array
  const radarData = MONTH_SHORT.map((mName, idx) => {
    const monthNum = idx + 1;
    const match = history.find((h) => h.month === monthNum);
    return {
      monthName: mName,
      monthNum,
      percent: match ? Math.round(match.percent) : 0,
      hasData: Boolean(match),
    };
  });

  return (
    <div style={{ width: '100%', height: 320, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
          <PolarGrid stroke="var(--border-card)" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="monthName"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
            stroke="var(--border-subtle)"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid #8b5cf6',
                      padding: '0.6rem 0.9rem',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{item.monthName} Performance</div>
                    <div style={{ color: '#8b5cf6', fontWeight: 600, marginTop: '0.2rem' }}>
                      {item.hasData ? `${item.percent}% Average` : 'No data recorded'}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Radar
            name="Performance"
            dataKey="percent"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.4}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
