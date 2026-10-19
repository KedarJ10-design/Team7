# 🎯 Team 7 Goal Tracker

A high-performance, gamified goal tracking and accountability platform purpose-built for **Team 7**.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **SQLite**.

---

## 🚀 Key Features

- **🏆 Gamified Accountability:** Equal-weighted goal scoring with tiered safety zones and real-time visual progress trackers.
- **📅 Strict Monthly Lifecycle:** Automatic 30-day goal cycles starting on the 15th of each month, with automated month-close evaluations on the 14th.
- **🔒 Three-Tier Security Model:**
  - **Shared Team Password** for viewing the team dashboard and leaderboard.
  - **Individual 4-Digit PINs** for personal profile updates and goal check-ins.
  - **Elevated Admin Passphrase** for threshold configuration and penalty settlements.
- **🛡️ Battle-Tested Security:** OWASP Top 10 hardened, brute-force rate-limiting, strict IDOR ownership checks, sensitive credential hash redaction, and HSTS security headers.
- **🎉 Rewards & Penalties:**
  - **100-Point Party Penalty:** Accumulating 100+ penalty points triggers a team party funded by the member.
  - **100% Team Reward:** When all 7 members hit 100% average in a month, a group bike ride / team outing reward is unlocked!
- **⚡ Social Feed:** Real-time cheering, fire/rocket emoji reactions, and immutable audit logs.
- **📱 Fully Responsive:** Optimized for mobile phones (375px+), tablets, and ultra-wide desktop monitors.

---

## 📜 Rule Engine & Scoring Mechanics

| Zone | Monthly Average | Penalty Points | Description |
| :--- | :--- | :---: | :--- |
| **🟢 Safe Zone** | **75% – 100%** | **0 pts** | Target achieved! No penalty. |
| **🟡 Warning Zone** | **50% – 74.9%** | **5 pts** | Acceptable effort, minor penalty. |
| **🟠 Danger Zone** | **0.01% – 49.9%** | **10 pts** | Substandard progress. |
| **🔴 Not Started** | **0.0%** (0 progress logged) | **25 pts** | Critical penalty for zero effort. |

### Calendar & Cycle Rules
1. **Setting Goals:** Monthly goals open on the **15th of each month**.
2. **Progress Window:** Active progress updates are permitted for **30 days** across the cycle.
3. **Month-Close Evaluation:** On the **14th of every month**, the system calculates final scores, records immutable snapshots, and assigns penalty ledger points. After cutoff, regular members can no longer modify previous month goals.

---

## 👥 Team Architecture

The system supports 7 team member profiles with:
- **Individualized Color Accents & Avatars** for instant visual recognition.
- **Role-Based Access Control** separating regular member permissions from administrator elevation.
- **Self-Service Verification** via personal 4-digit PINs to ensure personal accountability and prevent peer tampering.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16.4 (App Router)
- **Library:** React 19 + TypeScript
- **Styling:** Vanilla CSS + Tailwind CSS (Cyberpunk-meets-Linear dark aesthetic)
- **Database:** SQLite with Prisma ORM
- **Session:** Iron-Session (tamper-proof encrypted cookies)
- **Visuals & Charts:** Recharts, Lucide React, Canvas Confetti
- **Testing:** Node.js native test runner via `tsx` (50 passing tests)

---

## 🏁 Quickstart & Installation

### 1. Clone the repository
```bash
git clone https://github.com/KedarJ10-design/Team7.git
cd Team7
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env
```
*(Configure `DATABASE_URL`, `SESSION_PASSWORD`, and `CRON_SECRET` in `.env`)*

### 4. Initialize Database & Clean Seed
```bash
npm run db:setup
```
This applies the Prisma schema and creates clean member profiles and system settings without any dummy test goals.

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Authentication & Access Control

| Level | Credential Type | Description |
| :--- | :--- | :--- |
| **Team Login** | Shared Team Password | Required to view the team dashboard and leaderboard |
| **Member Verification** | 4-Digit Numeric PIN | Required when selecting a profile to log check-ins and edit goals |
| **Admin Elevation** | Admin Passphrase | Click the 🛡️ shield icon in navigation for admin capabilities |

---

## 🧪 Testing & Validation

The codebase includes 50 automated tests covering scoring edge cases, boundary rules, rate-limiting, and past-cycle immutability:

```bash
npm test
```

```text
✔ 50 tests passing across 18 suites (337ms)
```

---

## 📜 Available NPM Scripts

- `npm run dev` - Launch local development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm test` - Execute complete 50-test automated suite
- `npm run seed` - Re-seed database with clean member profiles
- `npm run db:setup` - Push Prisma schema and seed clean database
- `npm run db:reset` - Force wipe database and re-seed from scratch
- `npm run lint` - Run ESLint code quality checks

---

## 📚 Project Documentation

- [System Architecture & Full Spec](docs/team_goal_tracker_plan.md)
- [UI/UX Design Specification](docs/team-goal-tracker-design-plan.md)
- [Security Audit Report (OWASP Top 10)](docs/security_audit_report.md)

---

## 📄 License

Proprietary & Private for **Team 7**. Built with pride.
