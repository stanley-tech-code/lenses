import * as React from 'react';
import type { Metadata } from 'next';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { RemindersTable } from '@/components/dashboard/reminders/reminders-table';
import type { Reminder } from '@/components/dashboard/reminders/reminders-table';
import { prisma } from '@/lib/prisma';
import { config } from '@/config';

export const metadata = { title: `Reminders | Dashboard | ${config.site.name}` } satisfies Metadata;
export const dynamic = 'force-dynamic';

export default async function Page(): Promise<React.JSX.Element> {
  const branchId = process.env.NEXT_PUBLIC_BRANCH_ID || 'default-branch';
  const page = 0;
  const rowsPerPage = 5;

  const rawReminders = await prisma.reminder.findMany({
    where: { branchId },
    orderBy: { scheduledAt: 'asc' },
    take: rowsPerPage,
    skip: page * rowsPerPage,
    include: {
      customer: true,
      template: true,
    },
  });

  const totalReminders = await prisma.reminder.count({ where: { branchId } });

  const reminders: Reminder[] = rawReminders.map((r) => ({
    id: r.id,
    customer: { name: r.customer.name, phone: r.customer.phone },
    type: r.type,
    relatedEvent: 'Automatic', // Placeholder, could be derived from logic
    scheduledDate: r.scheduledAt,
    status: r.status.toLowerCase() as Reminder['status'],
    templateName: r.template?.name ?? 'Manual Reminder',
  }));

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Scheduled Reminders</Typography>
        </Stack>
        <div>
          {/* New Reminder Button could go here */}
        </div>
      </Stack>
      <RemindersTable
        count={totalReminders}
        page={page}
        rows={reminders}
        rowsPerPage={rowsPerPage}
      />
    </Stack>
  );
}
