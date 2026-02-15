
'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
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
import IconButton from '@mui/material/IconButton';
import { CalendarBlank as CalendarIcon } from '@phosphor-icons/react/dist/ssr/CalendarBlank';
import { XCircle as XCircleIcon } from '@phosphor-icons/react/dist/ssr/XCircle';

function noop(): void {
  // do nothing
}

export interface Reminder {
  id: string;
  customer: {
    name: string;
    phone: string;
  };
  type: string;
  relatedEvent: string;
  scheduledDate: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  templateName: string;
}

interface RemindersTableProps {
  count?: number;
  page?: number;
  rows?: Reminder[];
  rowsPerPage?: number;
}

export function RemindersTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 0,
}: RemindersTableProps): React.JSX.Element {
  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox />
              </TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Reminder Type</TableCell>
              <TableCell>Related Event</TableCell>
              <TableCell>Scheduled Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              return (
                <TableRow hover key={row.id}>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{row.customer.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{row.customer.phone}</Typography>
                  </TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.relatedEvent}</TableCell>
                  <TableCell>{dayjs(row.scheduledDate).format('MMM D, YYYY h:mm A')}</TableCell>
                  <TableCell>
                    <Chip
                      color={row.status === 'pending' ? 'warning' : row.status === 'sent' ? 'success' : 'error'}
                      label={row.status}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton title="Reschedule">
                      <CalendarIcon />
                    </IconButton>
                    <IconButton title="Cancel" color="error">
                      <XCircleIcon />
                    </IconButton>
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
