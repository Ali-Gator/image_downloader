import { FC } from 'react';

import { InputAdornment } from '@mui/material';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import { InfoTooltip } from '../InfoIcon';
import { FieldContainer } from '../styles';
import { StyledTextField, StyledTypography } from './styles';

export const RenamePatternField: FC = () => {
  const { t } = useTranslation();
  const { renamePattern, setRenamePattern } = useSettingsStore();

  return (
    <FieldContainer>
      <StyledTypography variant="body1">{t('rename_files')}:</StyledTypography>
      <StyledTextField
        fullWidth
        size="small"
        variant="outlined"
        value={renamePattern}
        onChange={(e) => setRenamePattern(e.target.value)}
        placeholder="example_{name}.{ext}"
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
