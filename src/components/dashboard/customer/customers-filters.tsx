import * as React from 'react';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';

export function CustomersFilters(): React.JSX.Element {
  return (
    <Card sx={{ p: 2 }}>
      <OutlinedInput
        defaultValue=""
        fullWidth
        placeholder="Search customer"
        startAdornment={
          <InputAdornment position="start">
            <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
          </InputAdornment>
        }
        sx={{ maxWidth: '500px' }}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 2, overflowX: 'auto', pb: 1 }}>
        <Chip label="All" clickable color="primary" />
        <Chip label="Glasses Buyers" clickable variant="outlined" />
        <Chip label="Eye Exam" clickable variant="outlined" />
        <Chip label="Repair" clickable variant="outlined" />
        <Chip label="Contact Lens" clickable variant="outlined" />
      </Stack>
    </Card>
  );
}
