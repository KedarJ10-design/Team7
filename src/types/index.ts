// ═══════════════════════════════════════════
// Type Definitions for Team Goal Tracker
// ═══════════════════════════════════════════

export interface SessionData {
  isLoggedIn: boolean;
  memberId: string | null;
  memberName: string | null;
  isAdmin: boolean;
}

export interface Member {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  avatarColor: string;
  isAdmin: boolean;
  pinHash: string | null;
  createdAt: string;
}

export interface Goal {
  id: string;
  memberId: string;
  yearId: string;
  type: 'YEARLY' | 'MONTHLY';
  month: number | null;
  title: string;
  target: string | null;
  currentProgress: number;
  categoryId: string | null;
  deadline: string | null;
  isDone: boolean;
  lockedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  member?: Member;
  progressUpdates?: ProgressUpdate[];
}

export interface ProgressUpdate {
  id: string;
  goalId: string;
  oldValue: number;
  newValue: number;
  note: string | null;
  actorId: string;
  createdAt: string;
  actor?: Member;
}

export interface MonthlySnapshot {
  id: string;
  memberId: string;
  yearId: string;
  month: number;
  percent: number;
  penalty: number;
  score: number;
  closedAt: string;
  member?: Member;
}

export interface PenaltyLedgerEntry {
  id: string;
  memberId: string;
  points: number;
  reason: string;
  month: number;
  createdAt: string;
}

export interface PenaltyEvent {
  id: string;
  memberId: string;
  triggeredAt: string;
  type: string;
  paidAt: string | null;
  note: string | null;
  member?: Member;
}

export interface TeamReward {
  id: string;
  yearId: string;
  month: number;
  unlocked: boolean;
  note: string | null;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  targetMemberId: string | null;
  entity: string;
  entityId: string;
  action: string;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
  actor?: Member;
  targetMember?: Member;
  reactions?: Record<string, number>;
}

export interface TeamSettings {
  id: string;
  passwordHash: string;
  adminPasswordHash: string;
  cutoffDay: number;
  thresholds: PenaltyThresholds;
  penaltyPoints: PenaltyPointValues;
  penaltyThreshold: number;
  rewardTiersEnabled: boolean;
  selfEditOnly: boolean;
  pinsEnabled: boolean;
  timezone: string;
}

export interface PenaltyThresholds {
  safe: number;    // 75
  warning: number; // 50
  danger: number;  // 0
}

export interface PenaltyPointValues {
  safe: number;       // 0
  warning: number;    // 5
  danger: number;     // 10
  notStarted: number; // 25
}

export interface Year {
  id: string;
  label: string;
  isActive: boolean;
}

// Dashboard data
export interface MemberDashboardData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  avatarColor: string;
  isAdmin: boolean;
  monthlyPercent: number;
  penaltyPoints: number;
  yearlyScore: number;
  currentMonthScore?: number;
  goalCount: number;
  status: 'safe' | 'warning' | 'danger' | 'critical';
  goals?: Goal[];
}

export interface TeamDashboardData {
  members: MemberDashboardData[];
  topScorer: MemberDashboardData | null;
  rewardProgress: number; // How many at 100%
  cutoffDaysLeft: number;
  currentMonth: number;
  currentYear: Year;
}

// API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
