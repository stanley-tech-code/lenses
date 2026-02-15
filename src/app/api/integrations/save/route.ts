import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth/middleware';

const prisma = new PrismaClient();

// GET: Fetch config for a branch
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const branchId = request.nextUrl.searchParams.get('branchId') || auth.branchId;
  if (!branchId) return NextResponse.json({ error: 'Branch ID required' }, { status: 400 });

  const config = await prisma.posConfig.findUnique({
    where: { branchId },
  });

  return NextResponse.json(config || {});
}

// POST: Save config
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const body = await request.json();
  const { branchId, ...data } = body;

  if (!branchId) return NextResponse.json({ error: 'Branch ID required' }, { status: 400 });

  // Ensure user has access to this branch
  if (auth.role !== 'SUPER_ADMIN' && auth.branchId !== branchId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const config = await prisma.posConfig.upsert({
    where: { branchId },
    update: data,
    create: {
      branchId,
      ...data,
    },
  });

  return NextResponse.json(config);
}
