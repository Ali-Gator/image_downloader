import { FC, useCallback, useEffect, useState } from 'react';

import { Box, Button, SxProps, Theme, Typography } from '@mui/material';

import { useTranslation } from '@utils';
import { debugLogger } from '@utils/debugLogger';

const containerSx: SxProps<Theme> = { display: 'flex', alignItems: 'center', gap: 1 };

export const DebugLogExport: FC = () => {
  const { t } = useTranslation();
  const [entryCount, setEntryCount] = useState(0);

  useEffect(() => {
    debugLogger.getEntries().then((entries) => setEntryCount(entries.length));
  }, []);

  const handleExport = useCallback(async () => {
    const json = await debugLogger.export();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-downloader-debug-log-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <Box sx={containerSx}>
      <Button variant="outlined" size="small" onClick={handleExport} data-onboarding="debug-export">
        {t('export_debug_log')}
      </Button>
      <Typography variant="caption" color="textSecondary">
        ({entryCount} entries)
      </Typography>
    </Box>
  );
};
