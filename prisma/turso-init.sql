-- ========================================================
-- Team 7 Goal Tracker - Cloud Database Initialization Script (Turso / SQLite)
-- ========================================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dob" TEXT,
    "avatarColor" TEXT NOT NULL DEFAULT '#6366f1',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "pinHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "TeamSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "passwordHash" TEXT NOT NULL,
    "adminPasswordHash" TEXT NOT NULL,
    "cutoffDay" INTEGER NOT NULL DEFAULT 15,
    "thresholds" TEXT NOT NULL DEFAULT '{"safe":75,"warning":50,"danger":0}',
    "penaltyPoints" TEXT NOT NULL DEFAULT '{"safe":0,"warning":5,"danger":10,"notStarted":25}',
    "penaltyThreshold" INTEGER NOT NULL DEFAULT 100,
    "rewardTiersEnabled" BOOLEAN NOT NULL DEFAULT false,
    "selfEditOnly" BOOLEAN NOT NULL DEFAULT true,
    "pinsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata'
);

CREATE TABLE IF NOT EXISTS "Year" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MONTHLY',
    "month" INTEGER,
    "title" TEXT NOT NULL,
    "target" TEXT,
    "currentProgress" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "deadline" TEXT,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" DATETIME,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Goal_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Goal_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "Year" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Goal_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ProgressUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL,
    "oldValue" INTEGER NOT NULL,
    "newValue" INTEGER NOT NULL,
    "note" TEXT,
    "actorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressUpdate_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProgressUpdate_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "MonthlySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "percent" REAL NOT NULL,
    "penalty" INTEGER NOT NULL,
    "score" REAL NOT NULL,
    "closedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MonthlySnapshot_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MonthlySnapshot_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "Year" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PenaltyLedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "yearId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PenaltyLedgerEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PenaltyEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "triggeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'party',
    "paidAt" DATETIME,
    "note" TEXT,
    CONSTRAINT "PenaltyEvent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Quest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "goalId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "archivedAt" DATETIME,
    CONSTRAINT "Quest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quest_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "TeamReward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "yearId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    CONSTRAINT "TeamReward_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "Year" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "targetMemberId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_targetMemberId_fkey" FOREIGN KEY ("targetMemberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 2. Create Unique Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Year_label_key" ON "Year"("label");
CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "MonthlySnapshot_memberId_yearId_month_key" ON "MonthlySnapshot"("memberId", "yearId", "month");
CREATE UNIQUE INDEX IF NOT EXISTS "TeamReward_yearId_month_key" ON "TeamReward"("yearId", "month");

-- 3. Initial Seed: Active Year
INSERT OR IGNORE INTO "Year" ("id", "label", "isActive") 
VALUES ('cmvc6mk3u0000owsx4o52m1av', '2026', 1);

-- 4. Initial Seed: Team Settings
INSERT OR REPLACE INTO "TeamSettings" (
    "id", "passwordHash", "adminPasswordHash", "cutoffDay", "thresholds", 
    "penaltyPoints", "penaltyThreshold", "rewardTiersEnabled", "selfEditOnly", "pinsEnabled", "timezone"
) VALUES (
    'singleton',
    '$2b$10$5hrGjCmWuay4AOwB8T92deBqte9Ct9MHVCJ/oh7bc3lJdzYpJfvFS',
    '$2b$10$3tWkNbLcUxDq2rjkrifcCOGsiSZplp/c3GgEAqCGJEoOmHj5XL6iG',
    15,
    '{"safe":75,"warning":50,"danger":0}',
    '{"safe":0,"warning":5,"danger":10,"notStarted":25}',
    100,
    0,
    1,
    1,
    'Asia/Kolkata'
);

-- 5. Initial Seed: The 7 Clean Members
INSERT OR IGNORE INTO "Member" ("id", "name", "email", "avatarColor", "isAdmin", "pinHash", "createdAt", "updatedAt") VALUES
('cmvc6mk470001owsx7y3ayj1a', 'Kedar', 'kedar@example.com', '#6366f1', 1, '$2b$10$vQQCRFsfjwuD1cyoLD.2SeM6mRGHLEXIWhece52uMc3ZohzY6nlae', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cmvc6mk6m000dowsxpdk0a8jt', 'Arya', 'arya@example.com', '#8b5cf6', 0, '$2b$10$vQQCRFsfjwuD1cyoLD.2SeM6mRGHLEXIWhece52uMc3ZohzY6nlae', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cmvc6mk8p000powsx47izxyrn', 'Arnav', 'arnav@example.com', '#ec4899', 0, '$2b$10$vQQCRFsfjwuD1cyoLD.2SeM6mRGHLEXIWhece52uMc3ZohzY6nlae', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cmvc6mkam0011owsx5uaj000m', 'Ameya', 'ameya@example.com', '#f43f5e', 0, '$2b$10$vQQCRFsfjwuD1cyoLD.2SeM6mRGHLEXIWhece52uMc3ZohzY6nlae', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cmvc6mkch001dowsxmci5owhz', 'Shriram', 'shriram@example.com', '#14b8a6', 0, '$2b$10$vQQCRFsfjwuD1cyoLD.2SeM6mRGHLEXIWhece52uMc3ZohzY6nlae', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cmvc6mkec001powsxq3o10rlc', 'Gaurav', 'gaurav@example.com', '#f59e0b', 0, '$2b$10$vQQCRFsfjwuD1cyoLD.2SeM6mRGHLEXIWhece52uMc3ZohzY6nlae', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cmvc6mkg70021owsxjyjqrjnb', 'Prathmesh', 'prathmesh@example.com', '#3b82f6', 0, '$2b$10$vQQCRFsfjwuD1cyoLD.2SeM6mRGHLEXIWhece52uMc3ZohzY6nlae', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
