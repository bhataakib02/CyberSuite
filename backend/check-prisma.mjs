import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  console.log('Prisma models:');
  const models = Object.keys(prisma).filter(k => !k.startsWith('_'));
  console.log(models);
  
  try {
    const userCount = await prisma.user.count();
    console.log('Users:', userCount);
  } catch (e) {
    console.error('User count failed:', e.message);
  }

  try {
    const incidentCount = await prisma.incident.count();
    console.log('Incidents:', incidentCount);
  } catch (e) {
    console.error('Incident count failed:', e.message);
  }

  try {
    const pendingCount = await prisma.professionalProfile.count();
    console.log('Pending Profiles:', pendingCount);
  } catch (e) {
    console.error('Pending profiles failed:', e.message);
  }

  await prisma.$disconnect();
}

check();
