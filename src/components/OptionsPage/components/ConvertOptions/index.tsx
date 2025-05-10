import { FC } from 'react';

import { MenuItem, Typography } from '@mui/material';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import { ConvertRow, StyledFormControl, StyledSelect, StyledTypography } from './styles';

export const ConvertOptions: FC = () => {
  const { t } = useTranslation();
  const { convertFrom, convertTo, setConvertFrom, setConvertTo } = useSettingsStore();

  return (
    <ConvertRow>
      <StyledTypography variant="body1">{t('convert')}</StyledTypography>
      <StyledFormControl size="small">
        <StyledSelect value={convertFrom} onChange={(e) => setConvertFrom(String(e.target.value))}>
          <MenuItem value="all">{t('all_images')}</MenuItem>
          <MenuItem value="webp">{t('webp_only')}</MenuItem>
        </StyledSelect>
      </StyledFormControl>

      <Typography>{t('to')}</Typography>

      <StyledFormControl size="small">
        <StyledSelect value={convertTo} onChange={(e) => setConvertTo(String(e.target.value))}>
          <MenuItem value="jpeg">JPEG</MenuItem>
          <MenuItem value="png">PNG</MenuItem>
        </StyledSelect>
      </StyledFormControl>
    </ConvertRow>
  );
};
