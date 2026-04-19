import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAdmin() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log("Starting queries...");

    const r1 = await prisma.user.count();
    console.log("r1 ok");

    const r2 = await prisma.vaultEntry.count();
    console.log("r2 ok");

    const r3 = await prisma.session.count({ where: { isActive: true } });
    console.log("r3 ok");

    const r4 = await prisma.activityLog.count({ where: { action: 'BREACH_CHECK' } });
    console.log("r4 ok");

    const r5 = await prisma.activityLog.findMany({
      where: { action: { in: ['LOGIN_FAILURE', 'UNAUTHORIZED_ACCESS', 'BREACH_FOUND'] } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { name: true, email: true } } }
    });
    console.log("r5 ok", r5.length);

    const r6 = await prisma.user.count({ where: { createdAt: { gte: today } } });
    console.log("r6 ok");

    const r7 = await prisma.activityLog.count({
      where: { action: 'LOGIN_FAILURE', createdAt: { gte: today } }
    });
    console.log("r7 ok");

    console.log("All stats queries passed!");
  } catch (err) {
    console.error("Error in queries:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testAdmin();
