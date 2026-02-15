
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

export const metadata = { title: `Overview | Dashboard | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <Grid container spacing={3}>
      <Grid
        size={{
          lg: 3,
          sm: 6,
          xs: 12,
        }}
      >
        <StatCard
          title="Total SMS Sent"
          value="24.8k"
          diff={12}
          trend="up"
          icon={ChatsCircleIcon}
          iconColor="var(--mui-palette-primary-main)"
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid
        size={{
          lg: 3,
          sm: 6,
          xs: 12,
        }}
      >
        <StatCard
          title="Pending Reminders"
          value="156"
          diff={16}
          trend="up"
          icon={ClockIcon}
          iconColor="var(--mui-palette-warning-main)"
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid
        size={{
          lg: 3,
          sm: 6,
          xs: 12,
        }}
      >
        <StatCard
          title="Failed SMS"
          value="23"
          diff={5}
          trend="down"
          icon={WarningCircleIcon}
          iconColor="var(--mui-palette-error-main)"
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid
        size={{
          lg: 3,
          sm: 6,
          xs: 12,
        }}
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
        size={{
          lg: 8,
          xs: 12,
        }}
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
        size={{
          lg: 4,
          md: 6,
          xs: 12,
        }}
      >
        <Traffic chartSeries={[63, 15, 22]} labels={['Automatic', 'Campaigns', 'Reminders']} sx={{ height: '100%' }} />
      </Grid>
      <Grid
        size={{
          lg: 12,
          md: 12,
          xs: 12,
        }}
      >
        <LatestSMS
          sms={[
            {
              id: 'SMS-005',
              customer: { name: 'Alcides Antonio', phone: '908-691-3242' },
              template: 'Order Ready',
              status: 'delivered',
              createdAt: dayjs().subtract(5, 'minutes').toISOString(),
            },
            {
              id: 'SMS-004',
              customer: { name: 'Marcus Finn', phone: '415-907-2647' },
              template: 'Welcome Message',
              status: 'delivered',
              createdAt: dayjs().subtract(10, 'minutes').toISOString(),
            },
            {
              id: 'SMS-003',
              customer: { name: 'Jie Yan', phone: '770-635-2682' },
              template: '6 Month Reminder',
              status: 'pending',
              createdAt: dayjs().subtract(15, 'minutes').toISOString(),
            },
            {
              id: 'SMS-002',
              customer: { name: 'Nasimiyu Danai', phone: '801-301-7894' },
              template: 'OTP Code',
              status: 'delivered',
              createdAt: dayjs().subtract(20, 'minutes').toISOString(),
            },
            {
              id: 'SMS-001',
              customer: { name: 'Iulia Albu', phone: '313-812-8947' },
              template: 'Payment Receipt',
              status: 'failed',
              createdAt: dayjs().subtract(25, 'minutes').toISOString(),
            },
          ]}
          sx={{ height: '100%' }}
        />
      </Grid>
    </Grid>
  );
}
