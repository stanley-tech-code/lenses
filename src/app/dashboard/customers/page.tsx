import * as React from 'react';
import type { Metadata } from 'next';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';
import dayjs from 'dayjs';

import { config } from '@/config';
import { CustomersFilters } from '@/components/dashboard/customer/customers-filters';
import { CustomersTable } from '@/components/dashboard/customer/customers-table';
import type { Customer } from '@/components/dashboard/customer/customers-table';
import { prisma } from '@/lib/prisma';

export const metadata = { title: `Customers | Dashboard | ${config.site.name}` } satisfies Metadata;

export default async function Page(): Promise<React.JSX.Element> {
  const branchId = process.env.NEXT_PUBLIC_BRANCH_ID || 'default-branch';
  const page = 0;
  const rowsPerPage = 5;

  const rawCustomers = await prisma.customer.findMany({
    where: { branchId },
    orderBy: { createdAt: 'desc' },
    take: rowsPerPage,
    skip: page * rowsPerPage,
  });

  const totalCustomers = await prisma.customer.count({ where: { branchId } });

  const customers: Customer[] = rawCustomers.map((c: any) => ({
    id: c.id,
    name: c.name,
    avatar: '',
    email: c.email ?? '',
    phone: c.phone,
    address: { city: '', state: '', country: '', street: '' },
    createdAt: c.createdAt,
    source: c.source as Customer['source'],
    status: c.optedOut ? 'opted-out' : 'active',
    tags: c.tags,
    nextReminder: c.nextReminderAt ?? undefined,
  }));

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Customers</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button color="inherit" startIcon={<UploadIcon fontSize="var(--icon-fontSize-md)" />}>
              Import
            </Button>
            <Button color="inherit" startIcon={<DownloadIcon fontSize="var(--icon-fontSize-md)" />}>
              Export
            </Button>
          </Stack>
        </Stack>
        <div>
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained">
            Add
          </Button>
        </div>
      </Stack>
      <CustomersFilters />
      <CustomersTable
        count={totalCustomers}
        page={page}
        rows={customers}
        rowsPerPage={rowsPerPage}
      />
    </Stack>
  );
}
