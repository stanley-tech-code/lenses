
'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import Chip from '@mui/material/Chip';

function noop(): void {
  // do nothing
}

export interface OTPRecord {
  id: string;
  customer: string;
  phone: string;
  orderId: string;
  code: string;
  sentTime: string | Date;
  attempts: number;
  status: 'verified' | 'pending' | 'failed';
}

interface OTPTableProps {
  count?: number;
  page?: number;
  rows?: OTPRecord[];
  rowsPerPage?: number;
}

export function OTPTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 0,
}: OTPTableProps): React.JSX.Element {
  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Order ID</TableCell>
              <TableCell>OTP Code</TableCell>
              <TableCell>Sent Time</TableCell>
              <TableCell>Attempts</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              return (
                <TableRow hover key={row.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{row.customer}</Typography>
                    <Typography variant="body2" color="text.secondary">{row.phone}</Typography>
                  </TableCell>
                  <TableCell>{row.orderId}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: 2 }}>
                      {row.code}
                    </Typography>
                  </TableCell>
                  <TableCell>{dayjs(row.sentTime).format('MMM D, YYYY h:mm:ss A')}</TableCell>
                  <TableCell>{row.attempts}</TableCell>
                  <TableCell>
                    <Chip
                      color={row.status === 'verified' ? 'success' : row.status === 'pending' ? 'warning' : 'error'}
                      label={row.status}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <Divider />
      <TablePagination
        component="div"
        count={count}
        onPageChange={noop}
        onRowsPerPageChange={noop}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Card>
  );
}
