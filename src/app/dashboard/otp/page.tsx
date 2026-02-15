
'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { CheckCircle as CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import dayjs from 'dayjs';

import { OTPTable } from '@/components/dashboard/otp/otp-table';

export interface OTPRecord {
  id: string;
  customer: string;
  phone: string;
  orderId: string;
  code: string;
  sentTime: string | Date;
  attempts: number;
  status: 'pending' | 'verified' | 'failed';
}

const otpRecords: OTPRecord[] = [
  {
    id: 'OTP-001',
    customer: 'Alcides Antonio',
    phone: '908-691-3242',
    orderId: 'ORD-1001',
    code: '829104',
    sentTime: dayjs().subtract(5, 'minute').toISOString(),
    attempts: 1,
    status: 'verified',
  },
  {
    id: 'OTP-002',
    customer: 'Marcus Finn',
    phone: '415-907-2647',
    orderId: 'ORD-1002',
    code: '192837',
    sentTime: dayjs().subtract(2, 'minute').toISOString(),
    attempts: 0,
    status: 'pending',
  },
];

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">OTP Verification</Typography>
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          <Grid container spacing={3} alignItems="flex-end">
            <Grid size={{ md: 4, xs: 12 }}>
              <TextField fullWidth label="Order ID" placeholder="Enter Order ID" />
            </Grid>
            <Grid size={{ md: 4, xs: 12 }}>
              <TextField fullWidth label="OTP Code" placeholder="6-digit code" />
            </Grid>
            <Grid size={{ md: 4, xs: 12 }}>
              <Button variant="contained" startIcon={<CheckCircleIcon />} fullWidth size="large">
                Verify Code
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <OTPTable
        count={otpRecords.length}
        page={0}
        rows={otpRecords}
        rowsPerPage={5}
      />
    </Stack>
  );
}
