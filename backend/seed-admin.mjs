import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'connection_limit=1'
    }
  }
});

async function seed() {
  console.log('Seeding admin-specific data...');
  try {
    // 1. Seed Security Rules
    await prisma.securityRule.createMany({
      data: [
        { name: 'Brute Force Prevention', description: 'Blocks IPs with > 5 failed logins in 10 mins', trigger: 'FAILED_LOGINS', threshold: 5, action: 'BLOCK_IP' },
        { name: 'Unauthorized Access Alert', description: 'Triggers when user accesses restricted nodes', trigger: 'ACCESS_DENIED', threshold: 1, action: 'ALERT_ADMIN' },
        { name: 'Mass Data Export', description: 'Flags accounts exporting > 100 items/hr', trigger: 'DATA_EXPORT', threshold: 100, action: 'SUSPEND_ACCOUNT' }
      ]
    });
    console.log('Security Rules seeded.');

    // 2. Seed some Incidents
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (adminUser) {
      await prisma.incident.createMany({
        data: [
          { title: 'Anomalous Login Pattern', description: 'Detected from unknown IP in Russia', severity: 'HIGH', userId: adminUser.id },
          { title: 'Database Pool Warning', description: 'Max connections threshold approaching', severity: 'MEDIUM', userId: adminUser.id },
          { title: 'New Vulnerability Detected', description: 'CVE-2025-001 affecting system packages', severity: 'CRITICAL', userId: adminUser.id }
        ]
      });
      console.log('Incidents seeded.');
    }
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
