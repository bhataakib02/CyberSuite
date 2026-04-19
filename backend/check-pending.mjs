import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'connection_limit=1'
    }
  }
});

async function check() {
  try {
    const pending = await prisma.professionalProfile.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true, email: true, role: true, createdAt: true } } }
    });
    console.log('Pending Profiles found:', pending.length);
  } catch (err) {
    console.error('Fetch failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
