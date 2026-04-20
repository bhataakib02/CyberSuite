const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Trying groupBy...');
  const roles = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true },
  });
  console.log('Grouped roles:', roles);
}

main().catch(console.error).finally(() => prisma.$disconnect());
