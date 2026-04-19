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
    // 1. Create VerificationStatus Enum
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    // 2. Add status column to ProfessionalProfile if missing
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ProfessionalProfile" ADD COLUMN IF NOT EXISTS "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING';
    `);
    
    console.log('VerificationStatus and status column checked.');
  } catch (err) {
    console.error('Fix failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
