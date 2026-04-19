import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'connection_limit=1'
    }
  }
});

async function fix() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SecurityRule" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "trigger" TEXT NOT NULL,
        "threshold" INTEGER NOT NULL,
        "action" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "SecurityRule_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('SecurityRule table checked.');
  } catch (err) {
    console.error('Manual fix for SecurityRule failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
