
'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';

export function SMSSettings(): React.JSX.Element {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Card>
        <CardHeader subheader="Manage your SMS automation preferences" title="SMS Automation Settings" />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth>
                <TextField label="Clinic Name" defaultValue="Braus Optical" />
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Time Zone</InputLabel>
                <Select defaultValue="utc-3" label="Time Zone">
                  <MenuItem value="utc-3">UTC-03:00 (Nairobi, Moscow)</MenuItem>
                  <MenuItem value="utc-5">UTC-05:00 (New York)</MenuItem>
                  <MenuItem value="utc+0">UTC+00:00 (London)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Default Delay After Visit</InputLabel>
                <Select defaultValue="10" label="Default Delay After Visit">
                  <MenuItem value="0">Immediately</MenuItem>
                  <MenuItem value="10">10 Minutes</MenuItem>
                  <MenuItem value="60">1 Hour</MenuItem>
                  <MenuItem value="1440">24 Hours</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <Stack spacing={2}>
                <FormControlLabel control={<Switch defaultChecked />} label="Enable All Automation" />
                <Typography variant="caption" color="text.secondary">
                  Turning this off will pause all automatic SMS triggers.
                </Typography>
              </Stack>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <Stack spacing={2}>
                <FormControlLabel control={<Switch />} label="Retry Failed SMS Automatically" />
              </Stack>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <Stack spacing={2}>
                <TextField label="Opt-out Keyword" defaultValue="STOP" helperText="Keyword for customers to unsubscribe" />
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained">Save Changes</Button>
        </CardActions>
      </Card>
    </form>
  );
}
