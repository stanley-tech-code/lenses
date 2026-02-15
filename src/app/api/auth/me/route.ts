import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth/middleware';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, branch: { select: { id: true, name: true } } },
  });

  if (!user) return unauthorizedResponse();
  return NextResponse.json({ user });
}
