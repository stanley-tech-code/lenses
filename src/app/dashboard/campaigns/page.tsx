import * as React from 'react';
import type { Metadata } from 'next';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';

import { CampaignsTable } from '@/components/dashboard/campaigns/campaigns-table';
import type { Campaign } from '@/components/dashboard/campaigns/campaigns-table';
import { prisma } from '@/lib/prisma';
import { config } from '@/config';

export const metadata = { title: `Campaigns | Dashboard | ${config.site.name}` } satisfies Metadata;
export const dynamic = 'force-dynamic';

export default async function Page(): Promise<React.JSX.Element> {
  const branchId = process.env.NEXT_PUBLIC_BRANCH_ID || 'default-branch';
  const page = 0;
  const rowsPerPage = 5;

  const rawCampaigns = await prisma.campaign.findMany({
    where: { branchId },
    orderBy: { createdAt: 'desc' },
    take: rowsPerPage,
    skip: page * rowsPerPage,
  });

  const totalCampaigns = await prisma.campaign.count({ where: { branchId } });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const campaigns: Campaign[] = rawCampaigns.map((c: any) => ({
    id: c.id,
    name: c.name,
    audienceSize: c.audienceSize,
    sentDate: c.sentAt || c.scheduledAt || c.createdAt,
    deliveredPercent: 0, // Placeholder: need aggregationQuery for accurate stats
    failedPercent: 0, // Placeholder
    status: c.status.toLowerCase() as Campaign['status'],
  }));

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
        count={totalCampaigns}
        page={page}
        rows={campaigns}
        rowsPerPage={rowsPerPage}
      />
    </Stack>
  );
}
