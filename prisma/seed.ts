import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🌱 Starting clean seed for Team 7 Goal Tracker...');

  // 1. Team Settings
  const teamPasswordHash = bcrypt.hashSync('333', 10);
  const adminPasswordHash = bcrypt.hashSync('111', 10);
  const defaultPinHash = bcrypt.hashSync('1234', 10);

  await prisma.teamSettings.upsert({
    where: { id: 'singleton' },
    update: {
      passwordHash: teamPasswordHash,
      adminPasswordHash: adminPasswordHash,
      cutoffDay: 15,
      thresholds: JSON.stringify({ safe: 75, warning: 50, danger: 0 }),
      penaltyPoints: JSON.stringify({ safe: 0, warning: 5, danger: 10, notStarted: 25 }),
      penaltyThreshold: 100,
      pinsEnabled: true,
      selfEditOnly: true,
      timezone: 'Asia/Kolkata',
    },
    create: {
      id: 'singleton',
      passwordHash: teamPasswordHash,
      adminPasswordHash: adminPasswordHash,
      cutoffDay: 15,
      thresholds: JSON.stringify({ safe: 75, warning: 50, danger: 0 }),
      penaltyPoints: JSON.stringify({ safe: 0, warning: 5, danger: 10, notStarted: 25 }),
      penaltyThreshold: 100,
      pinsEnabled: true,
      selfEditOnly: true,
      timezone: 'Asia/Kolkata',
    },
  });

  // 2. Active Year
  await prisma.year.upsert({
    where: { label: '2026' },
    update: { isActive: true },
    create: { label: '2026', isActive: true },
  });

  // 3. Remove all test data (goals, progress updates, snapshots, penalties, quests, audit logs)
  await prisma.auditLog.deleteMany({});
  await prisma.progressUpdate.deleteMany({});
  await prisma.quest.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.monthlySnapshot.deleteMany({});
  await prisma.penaltyLedgerEntry.deleteMany({});
  await prisma.penaltyEvent.deleteMany({});
  await prisma.teamReward.deleteMany({});

  // 4. Ensure the 7 official Members are initialized with clean zeroed accounts
  const initialMembers = [
    { name: 'Kedar', email: 'kedar@example.com', color: '#6366f1', isAdmin: true },
    { name: 'Arya', email: 'arya@example.com', color: '#8b5cf6', isAdmin: false },
    { name: 'Arnav', email: 'arnav@example.com', color: '#ec4899', isAdmin: false },
    { name: 'Ameya', email: 'ameya@example.com', color: '#f43f5e', isAdmin: false },
    { name: 'Shriram', email: 'shriram@example.com', color: '#14b8a6', isAdmin: false },
    { name: 'Gaurav', email: 'gaurav@example.com', color: '#f59e0b', isAdmin: false },
    { name: 'Prathmesh', email: 'prathmesh@example.com', color: '#3b82f6', isAdmin: false },
  ];

  for (const m of initialMembers) {
    const existing = await prisma.member.findFirst({ where: { name: m.name } });
    if (!existing) {
      await prisma.member.create({
        data: {
          name: m.name,
          email: m.email,
          avatarColor: m.color,
          isAdmin: m.isAdmin,
          pinHash: defaultPinHash,
        },
      });
    } else {
      await prisma.member.update({
        where: { id: existing.id },
        data: {
          isAdmin: m.isAdmin,
          avatarColor: m.color,
          pinHash: defaultPinHash,
        },
      });
    }
  }

  console.log('✅ Clean seed complete! All test data removed. Ready for live Team 7 goals.');
}

main()
  .catch((e) => {
    console.error('❌ Clean seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
