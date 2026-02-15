
import * as React from 'react';
import type { Metadata } from 'next';
import Grid from '@mui/material/Grid';
import dayjs from 'dayjs';
import { ChatsCircle as ChatsCircleIcon } from '@phosphor-icons/react/dist/ssr/ChatsCircle';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { WarningCircle as WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { ShieldCheck as ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck';

import { config } from '@/config';
import { StatCard } from '@/components/dashboard/overview/stat-card';
import { LatestSMS } from '@/components/dashboard/overview/latest-sms';
import { Sales } from '@/components/dashboard/overview/sales';
import { Traffic } from '@/components/dashboard/overview/traffic';
import { prisma } from '@/lib/prisma';

export const metadata = { title: `Overview | Dashboard | ${config.site.name}` } satisfies Metadata;

export default async function Page(): Promise<React.JSX.Element> {
  const branchId = process.env.NEXT_PUBLIC_BRANCH_ID || 'default-branch';

  // Fetch real stats
  const totalSmsSent = await prisma.smsLog.count({
    where: { branchId, status: 'SENT' },
  });

  const pendingReminders = await prisma.reminder.count({
    where: { branchId, status: 'PENDING' },
  });

  const failedSms = await prisma.smsLog.count({
    where: { branchId, status: 'FAILED' },
  });

  // Fetch recent SMS
  const recentSmsLogs = await prisma.smsLog.findMany({
    where: { branchId },
    take: 5,
    orderBy: { sentAt: 'desc' },
    include: {
      customer: true,
      template: true,
    },
  });

  const latestEvents = recentSmsLogs.map((log) => ({
    id: log.id,
    customer: { name: log.customer?.name ?? 'Unknown', phone: log.phone },
    template: log.template?.name ?? 'Direct Message',
    status: log.status.toLowerCase() as 'pending' | 'delivered' | 'failed',
    createdAt: dayjs(log.sentAt).toISOString(),
  }));

  return (
    <Grid container spacing={3}>
      <Grid
        item
        lg={3}
        sm={6}
        xs={12}
      >
        <StatCard
          title="Total SMS Sent"
          value={totalSmsSent.toLocaleString()}
          diff={12}
          trend="up"
          icon={ChatsCircleIcon}
          iconColor="var(--mui-palette-primary-main)"
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid
        item
        lg={3}
        sm={6}
        xs={12}
      >
        <StatCard
          title="Pending Reminders"
          value={pendingReminders.toLocaleString()}
          diff={16}
          trend="up"
          icon={ClockIcon}
          iconColor="var(--mui-palette-warning-main)"
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid
        item
        lg={3}
        sm={6}
        xs={12}
      >
        <StatCard
          title="Failed SMS"
          value={failedSms.toLocaleString()}
          diff={5}
          trend="down"
          icon={WarningCircleIcon}
          iconColor="var(--mui-palette-error-main)"
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid
        item
        lg={3}
        sm={6}
        xs={12}
      >
        <StatCard
          value="98.5%"
          title="OTP Success Rate"
          diff={2}
          trend="up"
          icon={ShieldCheckIcon}
          iconColor="var(--mui-palette-success-main)"
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid
        item
        lg={8}
        xs={12}
      >
        <Sales
          chartSeries={[
            { name: 'This year', data: [18, 16, 5, 8, 3, 14, 14, 16, 17, 19, 18, 20] },
            { name: 'Last year', data: [12, 11, 4, 6, 2, 9, 9, 10, 11, 12, 13, 13] },
          ]}
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid
        item
        lg={4}
        md={6}
        xs={12}
      >
        <Traffic chartSeries={[63, 15, 22]} labels={['Automatic', 'Campaigns', 'Reminders']} sx={{ height: '100%' }} />
      </Grid>
      <Grid
        item
        lg={12}
        md={12}
        xs={12}
      >
        <LatestSMS
          sms={latestEvents}
          sx={{ height: '100%' }}
        />
      </Grid>
    </Grid>
  );
}
