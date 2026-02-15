/**
 * GET  /api/customers  — List customers (paginated, searchable, filterable by branch)
 * POST /api/customers  — Create a single customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth, unauthorizedResponse, canAccessBranch } from '@/lib/auth/middleware';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const { searchParams } = request.nextUrl;
  const branchId = searchParams.get('branchId') ?? auth.branchId ?? undefined;
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0'));
  const rowsPerPage = Math.min(100, parseInt(searchParams.get('rowsPerPage') ?? '10'));
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status'); // 'active' | 'opted-out'
  const tag = searchParams.get('tag');

  // Build where clause
  const where: Record<string, unknown> = {};

  if (branchId) {
    if (!canAccessBranch(auth, branchId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    where.branchId = branchId;
  } else if (auth.role !== 'SUPER_ADMIN') {
    where.branchId = auth.branchId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status === 'opted-out') {
    where.optedOut = true;
  } else if (status === 'active') {
    where.optedOut = false;
  }

  if (tag) {
    where.tags = { has: tag };
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: page * rowsPerPage,
      take: rowsPerPage,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: { select: { name: true } },
        _count: { select: { smsLogs: true, reminders: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ customers, total, page, rowsPerPage });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { name, phone, email, branchId: reqBranchId, tags, source } = body;

    const branchId = reqBranchId ?? auth.branchId;

    if (!name || !phone || !branchId) {
      return NextResponse.json({ error: 'name, phone, and branchId are required' }, { status: 400 });
    }

    if (!canAccessBranch(auth, branchId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customer = await prisma.customer.create({
      data: {
        branchId,
        name,
        phone: phone.replace(/\s/g, ''),
        email: email ?? null,
        tags: tags ?? [],
        source: source ?? 'MANUAL',
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: unknown) {
    // Unique constraint violation
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'A customer with this phone already exists in this branch' }, { status: 409 });
    }
    console.error('[Customers] Create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
