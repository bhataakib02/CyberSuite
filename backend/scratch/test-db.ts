import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
