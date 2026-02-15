
'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { PlugsConnected as PlugsConnectedIcon } from '@phosphor-icons/react/dist/ssr/PlugsConnected';
import { CloudCheck as CloudCheckIcon } from '@phosphor-icons/react/dist/ssr/CloudCheck';

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Integrations</Typography>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ md: 6, xs: 12 }}>
          <Card>
            <CardHeader
              avatar={<PlugsConnectedIcon fontSize="32px" />}
              title="BRAUS POS"
              subheader="Connect your Point of Sale system"
            />
            <Divider />
            <CardContent>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>API Key</InputLabel>
                  <OutlinedInput label="API Key" name="brausApiKey" placeholder="Enter BRAUS API Key" />
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Webhook URL</InputLabel>
                  <OutlinedInput
                    label="Webhook URL"
                    value="https://api.yourdomain.com/webhooks/braus"
                    readOnly
                  />
                </FormControl>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">Last Event: 2 mins ago</Typography>
                  <Button variant="contained">Test Connection</Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ md: 6, xs: 12 }}>
          <Card>
            <CardHeader
              avatar={<CloudCheckIcon fontSize="32px" />}
              title="VeriSend SMS"
              subheader="SMS Gateway Configuration"
            />
            <Divider />
            <CardContent>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>API Key</InputLabel>
                  <OutlinedInput label="API Key" name="verisendApiKey" placeholder="Enter VeriSend API Key" />
                </FormControl>
                <Stack direction="row" spacing={3} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Typography variant="subtitle2">Balance</Typography>
                    <Typography variant="h6">$124.50</Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2">Delivery Rate</Typography>
                    <Typography variant="h6" color="success.main">99.8%</Typography>
                  </div>
                </Stack>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" color="success">Test SMS</Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
