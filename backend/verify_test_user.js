const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin_test@cybersuite.com';
  console.log('Verifying user:', email);
  const user = await prisma.user.update({
    where: { email },
    data: { isVerified: true, role: 'ADMIN' }
  });
  console.log('User verified and upgraded to ADMIN:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
