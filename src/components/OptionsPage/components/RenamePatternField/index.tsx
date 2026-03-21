import { FC } from 'react';

import { InputAdornment, TextField, Typography } from '@mui/material';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import { InfoTooltip } from '../InfoIcon';
import { FieldContainer } from '../styles';

export const RenamePatternField: FC = () => {
  const { t } = useTranslation();
  const { renamePattern, setRenamePattern } = useSettingsStore();

  return (
    <FieldContainer data-onboarding="rename-pattern">
      <Typography variant="body1">{t('rename_files')}</Typography>
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        value={renamePattern}
        onChange={(e) => setRenamePattern(e.target.value)}
        placeholder="{site}_{name}"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <InfoTooltip
                title={
                  <>
                    {t('rename_pattern_info')}
                    <br />
                    {t('rename_pattern_example')}
                  </>
                }
              />
            </InputAdornment>
          ),
        }}
      />
    </FieldContainer>
  );
};
