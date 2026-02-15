
'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';

interface CreateTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const triggers = [
  { label: 'After Visit', value: 'AFTER_VISIT' },
  { label: 'After Purchase', value: 'AFTER_PURCHASE' },
  { label: 'Repair Logged', value: 'REPAIR_LOGGED' },
  { label: 'Repair Completed', value: 'REPAIR_COMPLETED' },
  { label: 'Order Collected', value: 'ORDER_COLLECTED' },
  { label: 'Custom Time-Based Reminder', value: 'CUSTOM_TIME_REMINDER' },
];

const variables = ['{{customer_name}}', '{{order_id}}', '{{clinic_name}}', '{{date}}'];

export function CreateTemplateModal({ open, onClose, onSuccess }: CreateTemplateModalProps): React.JSX.Element {
  const [formData, setFormData] = React.useState({
    name: '',
    type: 'AUTOMATIC',
    triggerEvent: '',
    message: '',
    delayValue: '',
    delayUnit: 'DAYS',
  });

  const handleMessageAddVar = (variable: string) => {
    setFormData((prev) => ({ ...prev, message: prev.message + ' ' + variable }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          delayValue: formData.delayValue ? Number.parseInt(formData.delayValue.toString(), 10) : null,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New SMS Template</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Template Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Post-Visit Thank You"
          />

          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              label="Type"
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <MenuItem value="AUTOMATIC">AUTOMATIC (POS Events)</MenuItem>
              <MenuItem value="MANUAL">MANUAL (CSV Import)</MenuItem>
            </Select>
          </FormControl>

          {formData.type === 'AUTOMATIC' && (
            <Stack spacing={2} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="primary">Section A: Trigger Configuration</Typography>
              <FormControl fullWidth>
                <InputLabel>Trigger Event (from POS)</InputLabel>
                <Select
                  value={formData.triggerEvent}
                  label="Trigger Event (from POS)"
                  onChange={(e) => setFormData({ ...formData, triggerEvent: e.target.value })}
                >
                  {triggers.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="Delay Value"
                    type="number"
                    value={formData.delayValue}
                    onChange={(e) => setFormData({ ...formData, delayValue: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={formData.delayUnit}
                      label="Unit"
                      onChange={(e) => setFormData({ ...formData, delayUnit: e.target.value })}
                    >
                      <MenuItem value="MINUTES">Minutes</MenuItem>
                      <MenuItem value="HOURS">Hours</MenuItem>
                      <MenuItem value="DAYS">Days</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Stack>
          )}

          <Stack spacing={1}>
            <Typography variant="subtitle2">Message Content</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Write your SMS message here..."
            />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {variables.map((v) => (
                <Chip
                  key={v}
                  label={v}
                  size="small"
                  onClick={() => handleMessageAddVar(v)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>Create Template</Button>
      </DialogActions>
    </Dialog>
  );
}
