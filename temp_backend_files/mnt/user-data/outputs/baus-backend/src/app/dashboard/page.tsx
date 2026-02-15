'use client';

import * as React from 'react';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { ChatsCircle as ChatsCircleIcon } from '@phosphor-icons/react/dist/ssr/ChatsCircle';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { WarningCircle as WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { ShieldCheck as ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck';

import { StatCard } from '@/components/dashboard/overview/stat-card';
import { LatestSMS } from '@/components/dashboard/overview/latest-sms';
import { Sales } from '@/components/dashboard/overview/sales';
import { Traffic } from '@/components/dashboard/overview/traffic';
import { authClient } from '@/lib/auth/client';

interface DashboardStats {
  stats: {
    totalSmsSent: { value: number; diff: number; trend: 'up' | 'down' };
    pendingReminders: { value: number; diff: number; trend: 'up' | 'down' };
    failedSms: { value: number; diff: number; trend: 'up' | 'down' };
    otpSuccessRate: { value: string; diff: number; trend: 'up' | 'down' };
  };
  recentSms: {
    id: string;
    customer: { name: string; phone: string };
    template: string;
    branch: string;
    status: string;
    createdAt: string;
  }[];
  chart: {
    labels: string[];
    data: number[];
  };
}

export default function Page(): React.JSX.Element {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats', {
          headers: authClient.getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh every 30 seconds for near-real-time updates
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Fallback to zeros if API fails
  const s = stats?.stats;

  return (
    <Grid container spacing={3}>
      <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
        <StatCard
          title="Total SMS Sent"
          value={s ? s.totalSmsSent.value.toLocaleString() : '—'}
          diff={s?.totalSmsSent.diff ?? 0}
          trend={s?.totalSmsSent.trend ?? 'up'}
          icon={ChatsCircleIcon}
          iconColor="var(--mui-palette-primary-main)"
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
        <StatCard
          title="Pending Reminders"
          value={s ? s.pendingReminders.value.toLocaleString() : '—'}
          diff={s?.pendingReminders.diff ?? 0}
          trend={s?.pendingReminders.trend ?? 'up'}
          icon={ClockIcon}
          iconColor="var(--mui-palette-warning-main)"
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
        <StatCard
          title="Failed SMS"
          value={s ? s.failedSms.value.toLocaleString() : '—'}
          diff={s?.failedSms.diff ?? 0}
          trend={s?.failedSms.trend ?? 'down'}
          icon={WarningCircleIcon}
          iconColor="var(--mui-palette-error-main)"
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
        <StatCard
          value={s?.otpSuccessRate.value ?? '—'}
          title="OTP Success Rate"
          diff={s?.otpSuccessRate.diff ?? 0}
          trend={s?.otpSuccessRate.trend ?? 'up'}
          icon={ShieldCheckIcon}
          iconColor="var(--mui-palette-success-main)"
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid size={{ lg: 8, xs: 12 }}>
        <Sales
          chartSeries={
            stats?.chart
              ? [{ name: 'SMS Sent', data: stats.chart.data.slice(-12) }]
              : [{ name: 'SMS Sent', data: Array(12).fill(0) }]
          }
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid size={{ lg: 4, md: 6, xs: 12 }}>
        <Traffic
          chartSeries={[63, 15, 22]}
          labels={['Automatic', 'Campaigns', 'Reminders']}
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid size={{ lg: 12, md: 12, xs: 12 }}>
        <LatestSMS
          sms={stats?.recentSms ?? []}
          sx={{ height: '100%' }}
        />
      </Grid>
    </Grid>
  );
}
