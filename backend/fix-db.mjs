import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'connection_limit=1'
    }
  }
});

async function fix() {
  console.log('Attempting to fix database schema manually...');
  
  try {
    // 1. Create Priority Enum if it doesn't exist
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('Priority enum checked.');

    // 2. Create Incident table if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Incident" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "severity" "Priority" NOT NULL DEFAULT 'MEDIUM',
        "status" TEXT NOT NULL DEFAULT 'OPEN',
        "userId" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('Incident table checked.');

    // 3. Add Foreign Key if missing
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Incident" ADD CONSTRAINT "Incident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('Foreign key checked.');

    console.log('Database manual fix complete.');
  } catch (err) {
    console.error('Manual fix failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
