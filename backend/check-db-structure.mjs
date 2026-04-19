import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const columns = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ProfessionalProfile'`;
    console.log('ProfessionalProfile columns:', columns);
    
    const statusValues = await prisma.$queryRaw`SELECT DISTINCT status FROM "ProfessionalProfile"`;
    console.log('Status values:', statusValues);
  } catch (e) {
    console.error('Check failed:', e.message);
  }
  await prisma.$disconnect();
}

check();
