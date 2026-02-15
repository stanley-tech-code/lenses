import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth/middleware';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const branchId = auth.branchId;
  const campaigns = await prisma.campaign.findMany({
    where: { branchId: branchId || undefined },
    orderBy: { createdAt: 'desc' },
    include: { template: true },
  });

  return NextResponse.json(campaigns);
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { name, templateId, audienceFilter, scheduledAt } = await request.json();
    const branchId = auth.branchId;

    if (!branchId) return NextResponse.json({ error: 'Branch ID required' }, { status: 400 });

    // Calculate audience size (mock or real query)
    // const audienceSize = await prisma.customer.count({ where: ...audienceFilter });
    const audienceSize = 0; // Placeholder

    const campaign = await prisma.campaign.create({
      data: {
        branchId,
        name,
        templateId,
        audienceFilter,
        audienceSize,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
