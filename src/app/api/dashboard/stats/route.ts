import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth/middleware';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const branchId = auth.branchId;
  const whereBranch = branchId ? { branchId } : {};

  // Fetch real stats
  const totalCustomers = await prisma.customer.count({ where: whereBranch });

  const totalSmsSent = await prisma.smsLog.count({
    where: { ...whereBranch, status: 'SENT' },
  });

  const smsPending = await prisma.smsLog.count({
    where: { ...whereBranch, status: 'PENDING' },
  });

  const smsFailed = await prisma.smsLog.count({
    where: { ...whereBranch, status: 'FAILED' },
  });

  // Calculate delivery rate (mock calculation if no delivered status yet)
  const deliveryRate = totalSmsSent > 0
    ? Math.round(((totalSmsSent - smsFailed) / totalSmsSent) * 100)
    : 100;

  return NextResponse.json({
    budget: 4500, // Mock for now or store in Branch model
    totalCustomers,
    totalSmsSent,
    smsPending,
    smsFailed,
    deliveryRate,
  });
}
