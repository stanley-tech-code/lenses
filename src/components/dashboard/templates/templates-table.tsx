
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
import { PencilSimple as PencilIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';

function noop(): void {
  // do nothing
}

export interface Template {
  id: string;
  name: string;
  type: 'AUTOMATIC' | 'MANUAL';
  triggerEvent?: string;
  status: 'ACTIVE' | 'PAUSED';
  createdAt: string;
}

interface TemplatesTableProps {
  count?: number;
  page?: number;
  rows?: Template[];
  rowsPerPage?: number;
}

export function TemplatesTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 0,
}: TemplatesTableProps): React.JSX.Element {
  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox />
              </TableCell>
              <TableCell>Template Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Trigger / Mode</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Used</TableCell>
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
                    <Typography variant="subtitle2">{row.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={row.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{row.triggerEvent || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      color={row.status === 'ACTIVE' ? 'success' : 'default'}
                      label={row.status}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{dayjs(row.createdAt).format('MMM D, YYYY')}</TableCell>
                  <TableCell align="right">
                    <IconButton>
                      <PencilIcon />
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
