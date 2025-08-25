import { PrismaClient } from '@prisma/client';
import { config } from './server';

declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma = global.__prisma || new PrismaClient({
  log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (config.NODE_ENV === 'development') {
  global.__prisma = prisma;
}

export default prisma; 