
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const branchId = auth.branchId;
  const page = Number.parseInt(request.nextUrl.searchParams.get('page') || '0', 10);
  const limit = Number.parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
  const query = request.nextUrl.searchParams.get('query') || '';

  const where = {
    branchId: branchId || undefined,
    OR: query
      ? [
        { name: { contains: query, mode: 'insensitive' as const } },
        { phone: { contains: query, mode: 'insensitive' as const } },
      ]
      : undefined,
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: page * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ customers, total });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    const branchId = auth.branchId || body.branchId; // Super admin might provide branchId

    if (!branchId) return NextResponse.json({ error: 'Branch ID required' }, { status: 400 });

    const customer = await prisma.customer.create({
      data: {
        branchId,
        name: body.name,
        phone: body.phone,
        email: body.email,
        source: 'MANUAL',
      },
    });

    return NextResponse.json(customer);
  } catch {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
