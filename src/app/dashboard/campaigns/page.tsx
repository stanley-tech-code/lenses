
'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import dayjs from 'dayjs';

import { CampaignsTable } from '@/components/dashboard/campaigns/campaigns-table';
import type { Campaign } from '@/components/dashboard/campaigns/campaigns-table';

const campaigns: Campaign[] = [
  {
    id: 'CAM-001',
    name: 'New Year Promo',
    audienceSize: 1250,
    sentDate: dayjs().subtract(1, 'month').toDate(),
    deliveredPercent: 98,
    failedPercent: 2,
    status: 'completed',
  },
  {
    id: 'CAM-002',
    name: 'Eye Exam Reminder',
    audienceSize: 50,
    sentDate: dayjs().subtract(1, 'day').toDate(),
    deliveredPercent: 95,
    failedPercent: 5,
    status: 'sent',
  },
  {
    id: 'CAM-003',
    name: 'Spring Sale',
    audienceSize: 2000,
    sentDate: null as unknown as Date,
    deliveredPercent: 0,
    failedPercent: 0,
    status: 'draft',
  },
];

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Campaigns</Typography>
        </Stack>
        <div>
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained">
            Create Campaign
          </Button>
        </div>
      </Stack>
      <CampaignsTable
        count={campaigns.length}
        page={0}
        rows={campaigns}
        rowsPerPage={5}
      />
    </Stack>
  );
}
