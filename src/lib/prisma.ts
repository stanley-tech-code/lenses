
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

try {
  prismaInstance = globalForPrisma.prisma || new PrismaClient();
} catch (error) {
  console.warn('Failed to initialize PrismaClient in this environment (likely during build). Usage will throw.', error);
  // Create a proxy that throws on any access to simulate a broken client,
  // preventing silent failures if used, but allowing module execution to complete.
  // We use 'as any' to bypass type checks for this temporary dummy.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaInstance = new Proxy({} as any, {
    get(_target, prop) {
      if (prop === 'then') return; // Promise safety
      throw new Error(`PrismaClient accessed but failed to initialize: ${error}`);
    },
  });
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaInstance;
}
