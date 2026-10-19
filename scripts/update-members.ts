import { prisma } from '../src/lib/prisma';

async function updateMembers() {
  const newNames = [
    { name: 'Kedar', email: 'kedar@example.com', isAdmin: true },
    { name: 'Arya', email: 'arya@example.com', isAdmin: false },
    { name: 'Arnav', email: 'arnav@example.com', isAdmin: false },
    { name: 'Ameya', email: 'ameya@example.com', isAdmin: false },
    { name: 'Shriram', email: 'shriram@example.com', isAdmin: false },
    { name: 'Gaurav', email: 'gaurav@example.com', isAdmin: false },
    { name: 'Prathmesh', email: 'prathmesh@example.com', isAdmin: false },
  ];

  const members = await prisma.member.findMany({ orderBy: { createdAt: 'asc' } });
  for (let i = 0; i < members.length && i < newNames.length; i++) {
    const updated = await prisma.member.update({
      where: { id: members[i].id },
      data: {
        name: newNames[i].name,
        email: newNames[i].email,
        isAdmin: newNames[i].isAdmin,
      },
    });
    console.log(`✅ Member ${i + 1}: ${updated.name} (Admin: ${updated.isAdmin})`);
  }
}

updateMembers()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
