import { FC } from 'react';

import { InputAdornment, TextField, Typography } from '@mui/material';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import { InfoTooltip } from '../InfoIcon';
import { FieldContainer } from '../styles';
import { useDebouncedInput } from '../useDebouncedInput';

export const RenamePatternField: FC = () => {
  const { t } = useTranslation();
  const { renamePattern, setRenamePattern } = useSettingsStore();
  const input = useDebouncedInput(renamePattern, setRenamePattern);

  return (
    <FieldContainer data-onboarding="rename-pattern">
      <Typography variant="body1">{t('rename_files')}</Typography>
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        value={input.value}
        onChange={input.onChange}
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
