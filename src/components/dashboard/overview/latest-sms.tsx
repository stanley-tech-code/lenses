
import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import type { SxProps } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import dayjs from 'dayjs';

const statusMap = {
  pending: { label: 'Pending', color: 'warning' },
  delivered: { label: 'Delivered', color: 'success' },
  failed: { label: 'Failed', color: 'error' },
} as const;

export interface SMS {
  id: string;
  customer: { name: string; phone: string };
  template: string;
  status: 'pending' | 'delivered' | 'failed';
  createdAt: string | Date;
}

export interface LatestSMSProps {
  sms?: SMS[];
  sx?: SxProps;
}

export function LatestSMS({ sms = [], sx }: LatestSMSProps): React.JSX.Element {
  return (
    <Card sx={sx}>
      <CardHeader title="Latest SMS Activity" />
      <Divider />
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Template</TableCell>
              <TableCell sortDirection="desc">Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sms.map((message) => {
              const { label, color } = statusMap[message.status] ?? { label: 'Unknown', color: 'default' };

              return (
                <TableRow hover key={message.id}>
                  <TableCell>
                    {message.customer.name}
                    <br />
                    <span style={{ fontSize: '0.75rem', color: 'gray' }}>{message.customer.phone}</span>
                  </TableCell>
                  <TableCell>{message.template}</TableCell>
                  <TableCell>{dayjs(message.createdAt).format('MMM D, YYYY h:mm A')}</TableCell>
                  <TableCell>
                    <Chip color={color} label={label} size="small" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button
          color="inherit"
          endIcon={<ArrowRightIcon fontSize="var(--icon-fontSize-md)" />}
          size="small"
          variant="text"
        >
          View all
        </Button>
      </CardActions>
    </Card>
  );
}
