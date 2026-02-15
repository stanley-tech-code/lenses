import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth/middleware';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get('page') ?? '0');
  const limit = parseInt(searchParams.get('limit') ?? '50');
  const query = searchParams.get('query') ?? '';

  const branchId = auth.branchId;
  const where: any = {
    branchId: branchId || undefined,
  };

  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: page * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { smsLogs: true, reminders: true },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({
    data: customers,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { name, phone, email, tags } = body;

    const branchId = auth.branchId;
    if (!branchId) return NextResponse.json({ error: 'Branch ID required' }, { status: 400 });

    const customer = await prisma.customer.create({
      data: {
        branchId,
        name,
        phone,
        email,
        source: 'MANUAL',
        tags: tags || [],
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
