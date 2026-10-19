# Team Goal Tracker: Build Prompt & Design Plan

A web system for a 7-person team. Everyone sets yearly and monthly goals, tracks progress, sees each other's goals, earns scores, and takes penalties for falling behind. Nothing is ever deleted, and every edit is logged.

---

## 1. Locked rules (from client)

| Area | Rule |
|---|---|
| Team | Exactly 7 members. One shared team password. |
| Goals | 1 yearly goal (deadline + done tick box) and monthly goals per person. |
| Monthly % | Average of the person's monthly goals, equal weight (4 goals = 25% each). |
| Registration | One fixed date per month to register monthly goals. After it, goals are locked. |
| Progress | Progress bar is editable. Every change is logged. |
| Deletion | Nothing can be deleted. Archive only. |
| Logging | Every edit stores: who edited, whose goal, old value, new value, timestamp. |
| Year | Year is editable/switchable. Old years stay viewable. |
| Penalty counter | Resets to 0 after a person reaches 100 and pays the penalty (party for the rest). |
| Reward | If all 7 hit 100% of monthly goals, the team gets the reward (bike ride / outing). Otherwise nothing. |

### Penalty table (applied at month close)

| Monthly % (average) | Penalty points |
|---|---|
| ≥ 75 | 0 (safe) |
| 50 to < 75 | 5 |
| > 0 to < 50 | 10 |
| 0 (not started) | 25 |

Boundary assumptions: exactly 75 is safe, exactly 50 is 5 points. "Not started" means 0% with no progress recorded. Thresholds and points live in a `settings` table, not hardcoded.

**Score:** monthly score = round(monthly %) − penalty points. Yearly score = sum of monthly scores. Top scorer = highest yearly (and monthly) score. Tiebreak: fewer penalty points.

**Penalty trigger:** when a person's running penalty total reaches ≥ 100, create a `penalty_event` (type: party), notify all 7, and reset that person's counter to 0 once an admin marks it as paid/done. Keep the history.

---

## 2. Access and identity

1. Team password screen (single password, stored as bcrypt hash).
2. After login, "Who are you?" picker with the 7 profiles. The choice is stored in the session and used as the `actor` in every log entry.
3. Separate admin password for settings, overrides, and year management.
4. Optional per-member 4-digit PIN (setting, off by default). Without it, attribution is honor-based: anyone can pick another name.
5. Default edit rule: members edit only their own goals; admin can edit any. Make this a setting.

---

## 3. Month lifecycle

- **Day 1 to registration cutoff:** members create or change monthly goals. A countdown is shown.
- **After cutoff:** goals are locked. Title, target and weight can't change. Progress can still be updated.
- **Month end (scheduled job):**
  1. Compute each member's monthly %.
  2. Write an immutable `monthly_snapshot` (percent, penalty, score).
  3. Add penalty points to the ledger and check the 100 threshold.
  4. Check the all-7-at-100% reward.
- Closed months are read-only. Admin override is allowed but needs a reason and is logged.
- Use server time in IST, not the user's device time.

---

## 4. Screens

1. **Login:** team password, then profile picker.
2. **Team dashboard:** 7 member cards (avatar, name, current month %, penalty points, status colour). Header shows top scorer, team reward progress ("5/7 at 100%"), and the days left to cutoff. Click a card to open that person's page.
3. **Personal page:**
   - Profile: name, email, contact number, DOB.
   - Yearly goal: title, deadline, done tick box.
   - Monthly goals: each has an editable progress bar, and a note on each update.
   - Month average %, penalty points, personal radar.
   - Change history timeline for this person.
4. **Goal registration:** form with the cutoff countdown. Shows the equal weight each goal gets ("4 goals = 25% each").
5. **Quest Stack:** a personal task list. Header "Quest Stack" with a stats line (`8 total · 2 ongoing · 0 completed · 0 today`), a "+ Add Task" button top right, and three tabs: **To Do / On Going / Completed**. Tasks can link to a monthly goal. Optional setting: goal progress auto-calculates from completed linked tasks. Tasks are archived, never deleted.
6. **Leaderboard and radar:** team radar overlay, top scorer (month and year), penalty table.
7. **Reports:** per person and team, monthly and yearly. Includes completion %, penalties, scores. Export to PDF/CSV.
8. **Activity log:** a filterable table of who edited whose goal, old and new value, timestamp. Visible to all 7.
9. **Admin:** year switcher/creator, cutoff date, thresholds, overrides, penalty paid/done, optional PIN, reward tiers (off by default).

---

## 5. Data model

- `members`: id, name, email, phone, dob, avatar, is_admin, pin_hash (nullable)
- `team_settings`: password_hash, admin_password_hash, cutoff_day, thresholds (json), reward_tiers_enabled
- `years`: id, label, is_active
- `categories`: id, name (radar axes)
- `goals`: id, member_id, year_id, type (yearly|monthly), month (nullable), title, target, current_progress, category_id, deadline (yearly), is_done, locked_at, archived_at
- `progress_updates`: id, goal_id, old_value, new_value, note, actor_id, created_at (append-only)
- `quests`: id, member_id, goal_id (nullable), title, status (todo|ongoing|completed), created_at, completed_at, archived_at
- `monthly_snapshots`: id, member_id, year_id, month, percent, penalty, score, closed_at (immutable)
- `penalty_ledger`: id, member_id, points, reason, month, created_at
- `penalty_events`: id, member_id, triggered_at, type, paid_at
- `team_rewards`: id, year_id, month, unlocked (bool), note
- `audit_log`: id, actor_id, target_member_id, entity, entity_id, action, old_value, new_value, created_at

**Rules at the database level:** no DELETE on any table (revoke permission or use triggers). `progress_updates`, `audit_log`, and `monthly_snapshots` are append-only. All writes go through a layer that auto-writes `audit_log` with the actor from the session.

---

## 6. Design direction

Match the existing app's look (dark theme, indigo accent).

- **Background:** near-black navy (`#0b0b14`); cards one step lighter (`#13131f`), 1px subtle border, rounded 12 to 16px.
- **Accent:** indigo/violet (`#6366f1`), with a soft glow on primary buttons.
- **Status colours:** green (safe, ≥75%), amber (50 to 75%), orange (0 to 50%), red (not started / penalty).
- **Typography:** Inter, bold section titles with an emoji prefix, muted grey for secondary text.
- **Tabs and pills:** icon plus label, active tab with a purple tint and border.
- **Progress bars:** thick, rounded, colour tied to the status thresholds, with the percentage shown.
- **Radar:** one polygon per member, soft fill, legend toggles.
- **Responsive:** mobile first. The team will update on their phones.

---

## 7. Suggested stack

Next.js, PostgreSQL with Prisma, shared-password session auth, Recharts (radar and bars), a scheduled job (Vercel Cron or node-cron) for month close, Resend for email reminders. Adjust to your own stack if needed.

---

## 8. Build phases and acceptance

1. **Phase 1: Core.** Auth, profile picker, goals, progress with audit log, registration lock, team dashboard, personal page.
2. **Phase 2: Scoring.** Month-close job, penalty engine, snapshots, radar, top scorer, reward check, 100-point penalty event and reset.
3. **Phase 3: Extras.** Quest Stack, reports and exports, activity log screen, reminders.
4. **Phase 4: Pilot.** Run one full month with the 7 on real goals. Fix issues.

**Must-pass tests:**
- Penalty boundaries: 0, 0.01, 49.99, 50, 74.99, 75, 100.
- Equal-weight average for 1, 3, 4, 7 goals.
- Locked goals reject edits after cutoff (and the admin override is logged).
- A delete request fails at the API and database level.
- Every edit creates one audit entry with correct actor, target, old/new value and timestamp.
- The counter resets only after the penalty is marked paid, and history is preserved.
- Reward unlocks only when all 7 are at exactly 100%.

---

## 9. Open assumptions to confirm with the client

1. Yearly goals are excluded from the monthly penalty (the tick box only).
2. Score formula: monthly % minus penalty points.
3. Reward is all-or-nothing (tiers exist as a disabled setting).
4. Members can edit only their own goals by default.
5. A shared password means attribution relies on honesty unless PINs are enabled.

---

## 10. Master prompt (paste into your AI coding tool)

> Build a mobile-first web app, "Team Goal Tracker", for a 7-person team using Next.js, PostgreSQL and Prisma. Follow this document exactly: shared team password then profile picker, admin password for settings, yearly goals (deadline + done tick box), monthly goals with one registration cutoff date after which goals lock, editable progress bars, a Quest Stack task list (To Do / On Going / Completed tabs, "+ Add Task", stats line), a team dashboard with 7 member cards, personal pages, radar chart and top scorer, and monthly/yearly reports. Monthly % is the equal-weight average of a member's monthly goals. Penalty points at month close: ≥75% = 0, 50 to <75% = 5, >0 to <50% = 10, not started = 25. At 100 total penalty points trigger a party-penalty event, notify everyone, and reset that member's counter after it is marked paid. If all 7 members reach 100% in a month, mark the team reward unlocked. Nothing may ever be deleted (archive only), and every edit must auto-write an audit log entry with actor, target member, old value, new value and server timestamp (IST). Use a dark navy UI with indigo accents. Put all thresholds in a settings table. Implement the month-close job and write unit tests for every boundary case in section 8.
