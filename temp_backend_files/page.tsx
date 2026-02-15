'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import FormControlLabel from '@mui/material/FormControlLabel';
import { CloudCheck as CloudCheckIcon } from '@phosphor-icons/react/dist/ssr/CloudCheck';
import { Copy as CopyIcon } from '@phosphor-icons/react/dist/ssr/Copy';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlash as EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';
import { PlugsConnected as PlugsConnectedIcon } from '@phosphor-icons/react/dist/ssr/PlugsConnected';
import { Warning as WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning';
import { CheckCircle as CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { authClient } from '@/lib/auth/client';

dayjs.extend(relativeTime);

interface IntegrationConfig {
  posApiKey: string;
  posApiBaseUrl: string;
  webhookEnabled: boolean;
  webhookSecret: string;
  webhookUrl: string;
  smsProvider: string;
  smsApiKey: string;
  smsUsername: string;
  smsSenderId: string;
  automationEnabled: boolean;
  retryFailedSms: boolean;
  defaultDelayMinutes: number;
  optOutKeyword: string;
  lastWebhookReceivedAt: string | null;
  lastApiPollAt: string | null;
  configured: boolean;
}

const BRANCH_ID = process.env.NEXT_PUBLIC_BRANCH_ID ?? 'default-branch';

export default function Page(): React.JSX.Element {
  const [config, setConfig] = React.useState<Partial<IntegrationConfig>>({
    smsProvider: 'AFRICAS_TALKING',
    webhookEnabled: true,
    automationEnabled: true,
    retryFailedSms: true,
    defaultDelayMinutes: 10,
    optOutKeyword: 'STOP',
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [testingPos, setTestingPos] = React.useState(false);
  const [testingSms, setTestingSms] = React.useState(false);
  const [testPhone, setTestPhone] = React.useState('');
  const [posStatus, setPosStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [smsStatus, setSmsStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [showPosKey, setShowPosKey] = React.useState(false);
  const [showSmsKey, setShowSmsKey] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // ── Fetch existing config ──
  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/integrations/save?branchId=${BRANCH_ID}`, {
          headers: authClient.getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setConfig((prev) => ({ ...prev, ...data }));
        }
      } catch {
        // No config yet, use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (field: keyof IntegrationConfig, value: unknown) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  // ── Save config ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/integrations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authClient.getAuthHeaders() },
        body: JSON.stringify({ ...config, branchId: BRANCH_ID }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig((prev) => ({ ...prev, webhookSecret: data.webhookSecret, webhookUrl: data.webhookUrl }));
        setSnackbar({ open: true, message: 'Integration settings saved successfully', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: data.error ?? 'Failed to save settings', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Network error, please try again', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ── Test POS connection ──
  const handleTestPos = async () => {
    setTestingPos(true);
    setPosStatus('idle');
    try {
      const res = await fetch('/api/integrations/test-pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authClient.getAuthHeaders() },
        body: JSON.stringify({ posApiBaseUrl: config.posApiBaseUrl, posApiKey: config.posApiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setPosStatus('success');
        setSnackbar({ open: true, message: `✅ POS Connected: ${data.branchName ?? 'Baus Optical'}`, severity: 'success' });
      } else {
        setPosStatus('error');
        setSnackbar({ open: true, message: `❌ POS Connection failed: ${data.error}`, severity: 'error' });
      }
    } catch {
      setPosStatus('error');
    } finally {
      setTestingPos(false);
    }
  };

  // ── Test SMS connection ──
  const handleTestSms = async () => {
    if (!testPhone) {
      setSnackbar({ open: true, message: 'Please enter a test phone number', severity: 'error' });
      return;
    }
    setTestingSms(true);
    setSmsStatus('idle');
    try {
      const res = await fetch('/api/integrations/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authClient.getAuthHeaders() },
        body: JSON.stringify({
          testPhone,
          smsProvider: config.smsProvider,
          smsApiKey: config.smsApiKey,
          smsUsername: config.smsUsername,
          smsSenderId: config.smsSenderId,
          branchName: 'Baus Optical',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSmsStatus('success');
        setSnackbar({ open: true, message: `✅ Test SMS sent to ${testPhone}`, severity: 'success' });
      } else {
        setSmsStatus('error');
        setSnackbar({ open: true, message: `❌ SMS test failed: ${data.error}`, severity: 'error' });
      }
    } catch {
      setSmsStatus('error');
    } finally {
      setTestingSms(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: `${label} copied to clipboard`, severity: 'success' });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Integrations</Typography>
          <Typography variant="body2" color="text.secondary">
            Connect Baus Optical POS and configure your SMS provider. Both API key and webhook modes are supported.
          </Typography>
        </Stack>
        <div>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
            Save All Settings
          </Button>
        </div>
      </Stack>

      <Grid container spacing={3}>
        {/* ── POS Integration ── */}
        <Grid size={{ md: 6, xs: 12 }}>
          <Card>
            <CardHeader
              avatar={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlugsConnectedIcon fontSize="32px" />
                  {posStatus === 'success' && <CheckCircleIcon color="success" />}
                  {posStatus === 'error' && <WarningIcon color="error" />}
                </Box>
              }
              title="Baus Optical POS"
              subheader={
                config.lastWebhookReceivedAt
                  ? `Last event: ${dayjs(config.lastWebhookReceivedAt).fromNow()}`
                  : 'Connect your Point of Sale system'
              }
            />
            <Divider />
            <CardContent>
              <Stack spacing={3}>
                {/* Mode info */}
                <Alert severity="info" icon={false}>
                  <Typography variant="caption">
                    <strong>Dual mode:</strong> Use the API key to pull events, OR configure your POS to push events to the Webhook URL below. Both can be active simultaneously.
                  </Typography>
                </Alert>

                {/* API Key mode */}
                <Typography variant="subtitle2" color="text.secondary">API Key Mode (Pull)</Typography>
                <FormControl fullWidth>
                  <InputLabel>POS Base URL</InputLabel>
                  <OutlinedInput
                    label="POS Base URL"
                    value={config.posApiBaseUrl ?? ''}
                    onChange={(e) => handleChange('posApiBaseUrl', e.target.value)}
                    placeholder="https://pos.bausoptical.com/api"
                  />
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>POS API Key</InputLabel>
                  <OutlinedInput
                    label="POS API Key"
                    type={showPosKey ? 'text' : 'password'}
                    value={config.posApiKey ?? ''}
                    onChange={(e) => handleChange('posApiKey', e.target.value)}
                    placeholder="Enter Baus POS API Key"
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPosKey(!showPosKey)} edge="end">
                          {showPosKey ? <EyeSlashIcon /> : <EyeIcon />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                </FormControl>

                <Divider />

                {/* Webhook mode */}
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2" color="text.secondary">Webhook Mode (Push)</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.webhookEnabled ?? true}
                        onChange={(e) => handleChange('webhookEnabled', e.target.checked)}
                      />
                    }
                    label="Enabled"
                  />
                </Stack>

                {/* Webhook URL — read only, copyable */}
                <FormControl fullWidth>
                  <InputLabel>Webhook URL (give this to Baus POS)</InputLabel>
                  <OutlinedInput
                    label="Webhook URL (give this to Baus POS)"
                    value={config.webhookUrl ?? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/pos`}
                    readOnly
                    endAdornment={
                      <InputAdornment position="end">
                        <Tooltip title="Copy webhook URL">
                          <IconButton onClick={() => copyToClipboard(config.webhookUrl ?? '', 'Webhook URL')} edge="end">
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    }
                  />
                </FormControl>

                {/* Webhook Secret */}
                {config.webhookSecret && (
                  <FormControl fullWidth>
                    <InputLabel>Webhook HMAC Secret (give this to Baus POS)</InputLabel>
                    <OutlinedInput
                      label="Webhook HMAC Secret (give this to Baus POS)"
                      value={config.webhookSecret}
                      readOnly
                      type={showPosKey ? 'text' : 'password'}
                      endAdornment={
                        <InputAdornment position="end">
                          <Tooltip title="Copy secret">
                            <IconButton onClick={() => copyToClipboard(config.webhookSecret ?? '', 'Webhook secret')} edge="end">
                              <CopyIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      }
                    />
                  </FormControl>
                )}

                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center">
                    {config.lastWebhookReceivedAt ? (
                      <Chip label="Receiving events" color="success" size="small" />
                    ) : (
                      <Chip label="No events yet" color="default" size="small" />
                    )}
                  </Stack>
                  <Button
                    variant="contained"
                    onClick={handleTestPos}
                    disabled={testingPos || !config.posApiKey}
                  >
                    {testingPos ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                    Test Connection
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ── SMS Provider ── */}
        <Grid size={{ md: 6, xs: 12 }}>
          <Card>
            <CardHeader
              avatar={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudCheckIcon fontSize="32px" />
                  {smsStatus === 'success' && <CheckCircleIcon color="success" />}
                  {smsStatus === 'error' && <WarningIcon color="error" />}
                </Box>
              }
              title="SMS Gateway"
              subheader="Configure your SMS delivery provider"
            />
            <Divider />
            <CardContent>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>SMS Provider</InputLabel>
                  <Select
                    value={config.smsProvider ?? 'AFRICAS_TALKING'}
                    label="SMS Provider"
                    onChange={(e) => handleChange('smsProvider', e.target.value)}
                  >
                    <MenuItem value="AFRICAS_TALKING">Africa's Talking</MenuItem>
                    <MenuItem value="TWILIO">Twilio</MenuItem>
                    <MenuItem value="VERISEND">VeriSend</MenuItem>
                    <MenuItem value="CUSTOM">Custom / Other</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>SMS API Key</InputLabel>
                  <OutlinedInput
                    label="SMS API Key"
                    type={showSmsKey ? 'text' : 'password'}
                    value={config.smsApiKey ?? ''}
                    onChange={(e) => handleChange('smsApiKey', e.target.value)}
                    placeholder="Enter API key"
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowSmsKey(!showSmsKey)} edge="end">
                          {showSmsKey ? <EyeSlashIcon /> : <EyeIcon />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                </FormControl>

                {config.smsProvider === 'AFRICAS_TALKING' && (
                  <TextField
                    fullWidth
                    label="Africa's Talking Username"
                    value={config.smsUsername ?? ''}
                    onChange={(e) => handleChange('smsUsername', e.target.value)}
                    placeholder="e.g. sandbox or your AT username"
                  />
                )}

                <TextField
                  fullWidth
                  label="Sender ID"
                  value={config.smsSenderId ?? ''}
                  onChange={(e) => handleChange('smsSenderId', e.target.value)}
                  placeholder="e.g. BausOptical"
                  helperText="The name that appears as the SMS sender (max 11 chars)"
                  inputProps={{ maxLength: 11 }}
                />

                <Divider />

                {/* Test SMS section */}
                <Typography variant="subtitle2" color="text.secondary">Send a Test SMS</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="Test Phone Number"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+254712345678"
                    size="small"
                  />
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleTestSms}
                    disabled={testingSms || !config.smsApiKey}
                    sx={{ whiteSpace: 'nowrap', minWidth: 110 }}
                  >
                    {testingSms ? <CircularProgress size={16} sx={{ mr: 1 }} color="inherit" /> : null}
                    Test SMS
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Automation Settings ── */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader title="Automation Settings" subheader="Control how Lenses handles POS events across all Baus Optical branches" />
            <Divider />
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ md: 4, xs: 12 }}>
                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.automationEnabled ?? true}
                          onChange={(e) => handleChange('automationEnabled', e.target.checked)}
                        />
                      }
                      label="Enable All Automation"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Turning this off pauses all automatic SMS triggers for this branch
                    </Typography>
                  </Stack>
                </Grid>
                <Grid size={{ md: 4, xs: 12 }}>
                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.retryFailedSms ?? true}
                          onChange={(e) => handleChange('retryFailedSms', e.target.checked)}
                        />
                      }
                      label="Retry Failed SMS Automatically"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Failed messages will be retried up to 3 times
                    </Typography>
                  </Stack>
                </Grid>
                <Grid size={{ md: 4, xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Opt-out Keyword"
                    value={config.optOutKeyword ?? 'STOP'}
                    onChange={(e) => handleChange('optOutKeyword', e.target.value)}
                    helperText="Customers reply with this word to unsubscribe"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
