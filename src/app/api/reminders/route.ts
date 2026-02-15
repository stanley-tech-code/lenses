import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth/middleware';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const branchId = auth.branchId;
  const reminders = await prisma.reminder.findMany({
    where: { branchId: branchId || undefined },
    orderBy: { scheduledAt: 'asc' },
    include: { customer: true, template: true },
    take: 100,
  });

  return NextResponse.json(reminders);
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { customerId, templateId, scheduledAt, type } = await request.json();
    const branchId = auth.branchId;

    if (!branchId) return NextResponse.json({ error: 'Branch ID required' }, { status: 400 });

    const reminder = await prisma.reminder.create({
      data: {
        branchId,
        customerId,
        templateId,
        type: type || 'Manual',
        scheduledAt: new Date(scheduledAt),
        status: 'PENDING',
      },
    });

    return NextResponse.json(reminder);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }
}
