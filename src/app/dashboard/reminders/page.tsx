
'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';

import { RemindersTable } from '@/components/dashboard/reminders/reminders-table';
import type { Reminder } from '@/components/dashboard/reminders/reminders-table';

const reminders: Reminder[] = [
  {
    id: 'REM-001',
    customer: { name: 'Alcides Antonio', phone: '908-691-3242' },
    type: 'Follow-up',
    relatedEvent: 'Purchase (Glasses)',
    scheduledDate: dayjs().add(2, 'day').toDate(),
    status: 'pending',
    templateName: 'Order Ready',
  },
  {
    id: 'REM-002',
    customer: { name: 'Marcus Finn', phone: '415-907-2647' },
    type: '6 Month Checkup',
    relatedEvent: 'Eye Exam',
    scheduledDate: dayjs().add(5, 'day').toDate(),
    status: 'pending',
    templateName: '6 Month Reminder',
  },
  {
    id: 'REM-003',
    customer: { name: 'Jie Yan', phone: '770-635-2682' },
    type: 'Annual Review',
    relatedEvent: 'Last Visit',
    scheduledDate: dayjs().add(1, 'month').toDate(),
    status: 'pending',
    templateName: 'Annual Reminder',
  },
];

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Scheduled Reminders</Typography>
        </Stack>
        <div>
          {/*
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained">
            New Reminder
          </Button>
          */}
        </div>
      </Stack>
      <RemindersTable
        count={reminders.length}
        page={0}
        rows={reminders}
        rowsPerPage={5}
      />
    </Stack>
  );
}
