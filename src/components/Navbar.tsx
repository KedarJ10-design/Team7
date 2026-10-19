'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { Avatar } from './Avatar';
import { CommandPalette } from './CommandPalette';
import {
  WatermelonIcon,
  TargetIcon,
  TrophyIcon,
  ActivityIcon,
  SettingsIcon,
  EditIcon,
  LogOutIcon,
  UserSwitchIcon,
} from './ui/Icons';

interface NavbarProps {
  currentMember?: {
    id: string;
    name: string;
    avatarColor: string;
    isAdmin: boolean;
  } | null;
  onOpenRecap?: () => void;
}

export function Navbar({ currentMember, onOpenRecap }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: <TargetIcon size={17} /> },
    { label: 'Add Goal', href: '/goals/register', icon: <EditIcon size={17} /> },
    { label: 'Leaderboard', href: '/leaderboard', icon: <TrophyIcon size={17} /> },
    { label: 'Activity', href: '/activity', icon: <ActivityIcon size={17} /> },
    { label: 'Admin', href: '/admin', icon: <SettingsIcon size={17} /> },
  ];

  return (
    <>
      {/* Top Navbar */}
      <header className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: 0 }}>
          <Link
            href="/dashboard"
            className="navbar-brand"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontWeight: 800,
              fontSize: '1.15rem',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'var(--bg-accent-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <WatermelonIcon size={22} />
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.15rem' }}>
                Team 7
              </span>
              <span className="navbar-brand-tag" style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}>
                Tracker
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Hidden on <= 768px) */}
          <nav className="nav-links nav-links-desktop">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Controls */}
        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
          {/* Spotlight Search (Cmd+K) Button */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="btn btn-secondary navbar-btn-compact"
            title="Spotlight Search & Actions (Press ⌘K or Ctrl+K)"
            aria-label="Spotlight Search"
            style={{ gap: '0.4rem' }}
          >
            <span style={{ fontSize: '0.85rem' }}>🔍</span>
            <span className="btn-label-desktop" style={{ fontSize: '0.74rem', opacity: 0.75, fontFamily: 'monospace' }}>
              ⌘K
            </span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary navbar-btn-circle"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Current Member Controls */}
          {currentMember ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Link
                href={`/member/${currentMember.id}`}
                className="navbar-member-pill"
                title={`Logged in as ${currentMember.name} (View Profile)`}
              >
                <Avatar
                  name={currentMember.name}
                  color={currentMember.avatarColor}
                  size="sm"
                  status={currentMember.isAdmin ? 'gold' : undefined}
                  showStatusRing={currentMember.isAdmin}
                />
                <div className="navbar-member-details">
                  <span className="navbar-member-name">
                    {currentMember.name}
                  </span>
                  {currentMember.isAdmin && (
                    <span className="navbar-admin-badge">
                      ADMIN
                    </span>
                  )}
                </div>
              </Link>

              <button
                onClick={() => router.push('/pick-profile')}
                className="btn btn-secondary navbar-btn-compact"
                title="Switch to another member profile"
                aria-label="Switch Profile"
              >
                <UserSwitchIcon size={14} />
                <span className="btn-label-desktop">Switch</span>
              </button>

              <button
                onClick={handleLogout}
                className="btn btn-secondary navbar-btn-compact"
                title="Log out of Team 7"
                aria-label="Exit"
              >
                <LogOutIcon size={14} />
                <span className="btn-label-desktop">Exit</span>
              </button>
            </div>
          ) : (
            <Link href="/" className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>
              Login
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Visible only on screens <= 768px) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="mobile-nav-icon-wrap">
                {item.icon}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
              {isActive && <span className="mobile-nav-dot" />}
            </Link>
          );
        })}
      </nav>

      {/* Global Spotlight Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onOpenRecap={onOpenRecap}
      />
    </>
  );
}
