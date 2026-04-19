import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const rules = await prisma.securityRule.count();
    console.log('Security Rules:', rules);
  } catch (e) {
    console.error('Security Rules failed:', e.message);
  }
  await prisma.$disconnect();
}

check();
