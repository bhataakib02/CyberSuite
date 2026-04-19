import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'connection_limit=1'
    }
  }
});

async function socFix() {
  console.log('Building SOC Database Foundation...');
  try {
    // 1. Alert Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Alert" (
        "id" TEXT NOT NULL,
        "userId" TEXT,
        "type" TEXT NOT NULL,
        "severity" "Priority" NOT NULL DEFAULT 'MEDIUM',
        "message" TEXT NOT NULL,
        "ipAddress" TEXT,
        "location" TEXT,
        "deviceInfo" TEXT,
        "metadata" JSONB,
        "status" TEXT NOT NULL DEFAULT 'NEW',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('Alert table created.');

    // 2. AdminAction Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdminAction" (
        "id" TEXT NOT NULL,
        "adminId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "targetType" TEXT,
        "targetId" TEXT,
        "details" TEXT NOT NULL,
        "ipAddress" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('AdminAction table created.');

    // 3. Policy Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Policy" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "rules" JSONB NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('Policy table created.');

    // 4. FeatureFlag Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FeatureFlag" (
        "id" TEXT NOT NULL,
        "key" TEXT NOT NULL,
        "description" TEXT,
        "isEnabled" BOOLEAN NOT NULL DEFAULT false,
        "rules" JSONB,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('FeatureFlag table created.');

    // 5. SystemMetric Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemMetric" (
        "id" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "value" DOUBLE PRECISION NOT NULL,
        "unit" TEXT NOT NULL,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SystemMetric_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('SystemMetric table created.');

    // 6. Foreign Keys
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      
      DO $$ BEGIN
        ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    console.log('Foreign keys established.');

    console.log('SOC Database Foundation Ready.');
  } catch (err) {
    console.error('SOC DB Fix failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

socFix();
