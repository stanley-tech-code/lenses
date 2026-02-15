
'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';

import { TemplatesTable } from '@/components/dashboard/templates/templates-table';
import type { Template } from '@/components/dashboard/templates/templates-table';

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Automatic', value: 'automatic' },
  { label: 'Reminders', value: 'reminder' },
  { label: 'Campaigns', value: 'campaign' },
];


import { CreateTemplateModal } from '@/components/dashboard/templates/create-template-modal';

export default function Page(): React.JSX.Element {
  const [currentTab, setCurrentTab] = React.useState('all');
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchTemplates = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  const filteredTemplates = templates.filter((template) => {
    if (currentTab === 'all') return true;
    if (currentTab === 'automatic') return template.type === 'AUTOMATIC';
    if (currentTab === 'reminder' || currentTab === 'campaign') return template.type === 'MANUAL'; // For now, mapping non-automatic to manual
    return template.type.toLowerCase() === currentTab.toLowerCase();
  });

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">SMS Templates</Typography>
        </Stack>
        <div>
          <Button
            startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
            variant="contained"
            onClick={() => setIsModalOpen(true)}
          >
            Create Template
          </Button>
        </div>
      </Stack>
      <Card>
        <Tabs value={currentTab} onChange={handleTabChange} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          {tabs.map((tab) => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </Tabs>
        <TemplatesTable
          count={filteredTemplates.length}
          page={0}
          rows={filteredTemplates}
          rowsPerPage={filteredTemplates.length}
        />
        {isLoading && (
          <Stack sx={{ p: 3, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">Loading templates...</Typography>
          </Stack>
        )}
        {!isLoading && filteredTemplates.length === 0 && (
          <Stack sx={{ p: 3, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">No templates found.</Typography>
          </Stack>
        )}
      </Card>

      <CreateTemplateModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTemplates}
      />
    </Stack>
  );
}
