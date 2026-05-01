import { PrismaClient } from '@prisma/client';

/**
 * Optimized Prisma initialization
 * Increased pool timeout and connection limit for better stability during startup
 */
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'connection_limit=10&pool_timeout=30&connect_timeout=30'
    }
  }
});

export default prisma;
