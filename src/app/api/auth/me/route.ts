
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
