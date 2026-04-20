const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!user) throw new Error('No admin user found');
  
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: 'test-token',
      refreshToken: 'test-refresh',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      ipAddress: '127.0.0.1',
      userAgent: 'Test'
    }
  });

  const token = jwt.sign(
    { userId: user.id, role: user.role, sessionId: session.id },
    process.env.JWT_ACCESS_SECRET || 'your-access-secret',
    { expiresIn: '1h' }
  );
  
  console.log('TOKEN:', token);
}

main().catch(console.error).finally(() => prisma.$disconnect());
