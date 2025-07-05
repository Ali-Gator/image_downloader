import { FC } from 'react';

import { Checkbox, FormControlLabel } from '@mui/material';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import { InfoTooltip } from '../InfoIcon';
import { OptionRow } from './styles';

export const ZipArchiveOption: FC = () => {
  const { t } = useTranslation();
  const { createZipArchive, setCreateZipArchive } = useSettingsStore();

  return (
    <OptionRow>
      <FormControlLabel
        control={
          <Checkbox
            checked={createZipArchive}
            onChange={(e) => setCreateZipArchive(e.target.checked)}
            size="small"
          />
        }
        label={t('create_zip_archive')}
      />
      <InfoTooltip title={t('create_zip_archive_info')} />
    </OptionRow>
  );
}; 