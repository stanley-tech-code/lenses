
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

function noop(): void {
  // do nothing
}

export interface Campaign {
  id: string;
  name: string;
  audienceSize: number;
  sentDate: Date;
  deliveredPercent: number;
  failedPercent: number;
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
}

interface CampaignsTableProps {
  count?: number;
  page?: number;
  rows?: Campaign[];
  rowsPerPage?: number;
}

export function CampaignsTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 0,
}: CampaignsTableProps): React.JSX.Element {
  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox />
              </TableCell>
              <TableCell>Campaign Name</TableCell>
              <TableCell>Audience</TableCell>
              <TableCell>Sent Date</TableCell>
              <TableCell>Delivered</TableCell>
              <TableCell>Failed</TableCell>
              <TableCell>Status</TableCell>
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
                    <Typography variant="subtitle2">{row.name}</Typography>
                  </TableCell>
                  <TableCell>{row.audienceSize}</TableCell>
                  <TableCell>{row.sentDate ? dayjs(row.sentDate).format('MMM D, YYYY h:mm A') : '-'}</TableCell>
                  <TableCell>
                    <Typography color="success.main" variant="body2">{row.deliveredPercent}%</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="error.main" variant="body2">{row.failedPercent}%</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={row.status === 'completed' ? 'success' : row.status === 'draft' ? 'default' : 'primary'}
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
