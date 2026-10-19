'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { Avatar } from './Avatar';
import {
  TargetIcon,
  TrophyIcon,
  ActivityIcon,
  SettingsIcon,
  EditIcon,
  UserSwitchIcon,
  CrownIcon,
  WatermelonIcon,
} from './ui/Icons';
import { playHapticSound } from '@/lib/sound';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Pages' | 'Members' | 'Actions';
  icon: React.ReactNode;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRecap?: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenRecap }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [members, setMembers] = useState<Array<{ id: string; name: string; avatarColor: string; isAdmin: boolean }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch members for instant fuzzy navigation
  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch('/api/members');
        const data = await res.json();
        if (data.members) {
          setMembers(data.members);
        }
      } catch {
        // Fallback default member list if network is busy
      }
    }
    fetchMembers();
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keyboard shortcuts (Cmd+K, Ctrl+K, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build items list
  const defaultItems: CommandItem[] = [
    {
      id: 'page_dashboard',
      title: 'Dashboard Overview',
      subtitle: 'View active monthly cycle & team performance',
      category: 'Pages',
      icon: <TargetIcon size={18} color="var(--accent)" />,
      onSelect: () => {
        router.push('/dashboard');
        onClose();
      },
    },
    {
      id: 'page_add_goal',
      title: 'Add New Goal',
      subtitle: 'Set monthly or yearly target criteria',
      category: 'Pages',
      icon: <EditIcon size={18} color="var(--accent-light)" />,
      onSelect: () => {
        router.push('/goals/register');
        onClose();
      },
    },
    {
      id: 'page_leaderboard',
      title: 'Team Leaderboard',
      subtitle: 'View rank standings, completion % and penalties',
      category: 'Pages',
      icon: <TrophyIcon size={18} color="#f59e0b" />,
      onSelect: () => {
        router.push('/leaderboard');
        onClose();
      },
    },
    {
      id: 'page_activity',
      title: 'Activity & Audit Log',
      subtitle: 'Track recent progress updates, cheers, and events',
      category: 'Pages',
      icon: <ActivityIcon size={18} color="#818cf8" />,
      onSelect: () => {
        router.push('/activity');
        onClose();
      },
    },
    {
      id: 'page_admin',
      title: 'Administration Panel',
      subtitle: 'Manage cycle cutoff dates and evaluate month close',
      category: 'Pages',
      icon: <SettingsIcon size={18} color="var(--text-muted)" />,
      onSelect: () => {
        router.push('/admin');
        onClose();
      },
    },
    {
      id: 'action_theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      subtitle: 'Toggle global visual theme styling',
      category: 'Actions',
      icon: <span>{theme === 'dark' ? '☀️' : '🌙'}</span>,
      onSelect: () => {
        toggleTheme();
        onClose();
      },
    },
    {
      id: 'action_switch_member',
      title: 'Switch Member Profile',
      subtitle: 'Check in as a different member with 4-digit PIN',
      category: 'Actions',
      icon: <UserSwitchIcon size={18} color="var(--text-primary)" />,
      onSelect: () => {
        router.push('/pick-profile');
        onClose();
      },
    },
  ];

  if (onOpenRecap) {
    defaultItems.push({
      id: 'action_recap',
      title: 'Export WhatsApp Social Recap Card',
      subtitle: 'Generate shareable graphic for the friends group chat',
      category: 'Actions',
      icon: <CrownIcon size={18} color="#f59e0b" />,
      onSelect: () => {
        onClose();
        onOpenRecap();
      },
    });
  }

  // Member items
  const memberItems: CommandItem[] = members.map((m) => ({
    id: `member_${m.id}`,
    title: m.name,
    subtitle: m.isAdmin ? 'Admin • View personal goals & stats' : 'Team Member • View personal goals',
    category: 'Members',
    icon: (
      <Avatar
        name={m.name}
        color={m.avatarColor}
        size="sm"
        status={m.isAdmin ? 'gold' : undefined}
      />
    ),
    onSelect: () => {
      router.push(`/member/${m.id}`);
      onClose();
    },
  }));

  const allItems = [...defaultItems, ...memberItems];

  const filteredItems = allItems.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      playHapticSound('step');
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      playHapticSound('step');
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filteredItems[selectedIndex];
      if (item) {
        playHapticSound('click');
        item.onSelect();
      }
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
        backgroundColor: 'rgba(5, 5, 12, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 'clamp(1.5rem, 6vh, 10vh)',
        zIndex: 200,
        paddingLeft: '0.75rem',
        paddingRight: '0.75rem',
      }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: 0,
          border: '1px solid var(--border-focus)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45), var(--shadow-glow)',
          overflow: 'hidden',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'var(--bg-accent-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <WatermelonIcon size={18} />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search members..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '1.05rem',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          />
          <kbd
            style={{
              fontSize: '0.72rem',
              padding: '0.2rem 0.45rem',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          style={{
            maxHeight: '360px',
            overflowY: 'auto',
            padding: '0.5rem',
          }}
        >
          {filteredItems.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No matches found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    playHapticSound('click');
                    item.onSelect();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--bg-accent-subtle)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                        }}
                      >
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div
                          style={{
                            fontSize: '0.76rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginLeft: '0.5rem',
                      flexShrink: 0,
                    }}
                  >
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.6rem 1rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', gap: '0.85rem' }}>
            <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> select</span>
          </div>
          <span>Team 7 Spotlight</span>
        </div>
      </div>
    </div>
  );
}
