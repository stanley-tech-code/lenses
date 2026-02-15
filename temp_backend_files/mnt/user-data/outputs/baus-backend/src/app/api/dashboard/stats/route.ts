/**
 * GET /api/dashboard/stats
 * Returns real aggregated stats for the Baus Optical dashboard overview
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth/middleware';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const branchId = request.nextUrl.searchParams.get('branchId') ?? auth.branchId ?? undefined;
  const branchFilter = branchId ? { branchId } : auth.role !== 'SUPER_ADMIN' ? { branchId: auth.branchId! } : {};

  const now = new Date();
  const startOfMonth = dayjs().startOf('month').toDate();
  const startOfLastMonth = dayjs().subtract(1, 'month').startOf('month').toDate();
  const endOfLastMonth = dayjs().subtract(1, 'month').endOf('month').toDate();

  const [
    totalSmsSentThisMonth,
    totalSmsSentLastMonth,
    pendingReminders,
    pendingRemindersLastMonth,
    failedSms,
    failedSmsLastMonth,
    totalCustomers,
    optedOutCustomers,
    recentSmsLogs,
    smsByDay,
  ] = await Promise.all([
    // Total SMS this month
    prisma.smsLog.count({
      where: { ...branchFilter, status: { in: ['SENT', 'DELIVERED'] }, sentAt: { gte: startOfMonth } },
    }),
    // Total SMS last month (for diff)
    prisma.smsLog.count({
      where: { ...branchFilter, status: { in: ['SENT', 'DELIVERED'] }, sentAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
    // Pending reminders
    prisma.reminder.count({
      where: { ...branchFilter, status: 'PENDING', scheduledAt: { gte: now } },
    }),
    // Pending reminders last month (for diff)
    prisma.reminder.count({
      where: { ...branchFilter, status: 'PENDING', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
    // Failed SMS this month
    prisma.smsLog.count({
      where: { ...branchFilter, status: 'FAILED', sentAt: { gte: startOfMonth } },
    }),
    // Failed SMS last month
    prisma.smsLog.count({
      where: { ...branchFilter, status: 'FAILED', sentAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
    // Total active customers
    prisma.customer.count({ where: { ...branchFilter, optedOut: false } }),
    // Opted out customers
    prisma.customer.count({ where: { ...branchFilter, optedOut: true } }),
    // Recent SMS log (last 10)
    prisma.smsLog.findMany({
      where: branchFilter,
      take: 10,
      orderBy: { sentAt: 'desc' },
      include: {
        customer: { select: { name: true, phone: true } },
        template: { select: { name: true } },
        branch: { select: { name: true } },
      },
    }),
    // SMS by day for the last 30 days (for chart)
    prisma.smsLog.groupBy({
      by: ['sentAt'],
      where: {
        ...branchFilter,
        sentAt: { gte: dayjs().subtract(30, 'days').toDate() },
        status: { in: ['SENT', 'DELIVERED'] },
      },
      _count: { id: true },
    }),
  ]);

  // Calculate OTP success rate from SmsLog
  const [otpTotal, otpDelivered] = await Promise.all([
    prisma.smsLog.count({ where: { ...branchFilter, template: { category: 'OTP' } } }),
    prisma.smsLog.count({ where: { ...branchFilter, template: { category: 'OTP' }, status: 'DELIVERED' } }),
  ]);

  const otpSuccessRate = otpTotal > 0 ? ((otpDelivered / otpTotal) * 100).toFixed(1) : '0';

  // Calculate % diffs
  function calcDiff(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  // Aggregate SMS by day for chart
  const chartData: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const day = dayjs().subtract(i, 'day').format('MMM D');
    chartData[day] = 0;
  }
  for (const entry of smsByDay) {
    const day = dayjs(entry.sentAt).format('MMM D');
    if (day in chartData) {
      chartData[day] = (chartData[day] ?? 0) + entry._count.id;
    }
  }

  return NextResponse.json({
    stats: {
      totalSmsSent: { value: totalSmsSentThisMonth, diff: calcDiff(totalSmsSentThisMonth, totalSmsSentLastMonth), trend: totalSmsSentThisMonth >= totalSmsSentLastMonth ? 'up' : 'down' },
      pendingReminders: { value: pendingReminders, diff: calcDiff(pendingReminders, pendingRemindersLastMonth), trend: pendingReminders >= pendingRemindersLastMonth ? 'up' : 'down' },
      failedSms: { value: failedSms, diff: calcDiff(failedSms, failedSmsLastMonth), trend: failedSms <= failedSmsLastMonth ? 'down' : 'up' },
      otpSuccessRate: { value: `${otpSuccessRate}%`, diff: 0, trend: 'up' },
      totalCustomers,
      optedOutCustomers,
    },
    recentSms: recentSmsLogs.map((log) => ({
      id: log.id,
      customer: { name: log.customer?.name ?? 'Unknown', phone: log.phone },
      template: log.template?.name ?? 'Direct SMS',
      branch: log.branch?.name ?? '',
      status: log.status.toLowerCase(),
      createdAt: log.sentAt.toISOString(),
    })),
    chart: {
      labels: Object.keys(chartData),
      data: Object.values(chartData),
    },
  });
}
