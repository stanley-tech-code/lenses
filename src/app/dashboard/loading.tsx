import * as React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

export default function Loading(): React.JSX.Element {
  return (
    <Box sx={{ display: 'flex', flex: '1 1 auto', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <CircularProgress />
    </Box>
  );
}
