import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'connection_limit=1'
    }
  }
});

async function socFix() {
  console.log('Establishing Foreign Keys...');
  try {
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    console.log('Alert FK added.');

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    console.log('AdminAction FK added.');

    console.log('SOC Foreign Keys Ready.');
  } catch (err) {
    console.error('SOC DB FK Fix failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

socFix();
