import { FC } from 'react';

import { MenuItem, Select, Typography } from '@mui/material';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import { InfoTooltip } from '../InfoIcon';
import { FieldContainer } from '../styles';
import { ConnectorLabel, SelectsContainer, StyledFormControl } from './styles';

export const ConvertOptions: FC = () => {
  const { t } = useTranslation();
  const { convertFrom, convertTo, setConvertFrom, setConvertTo } = useSettingsStore();

  return (
    <FieldContainer data-onboarding="convert">
      <Typography variant="body1">{t('convert')}</Typography>

      <SelectsContainer>
        <StyledFormControl size="small" variant="outlined">
          <Select
            value={convertFrom}
            onChange={(e) => setConvertFrom(String(e.target.value))}
            size="small"
          >
            <MenuItem value="none">{t('no_conversion')}</MenuItem>
            <MenuItem value="all">{t('all_images')}</MenuItem>
            <MenuItem value="webp">WebP</MenuItem>
            <MenuItem value="png">PNG</MenuItem>
            <MenuItem value="jpeg">JPEG</MenuItem>
            <MenuItem value="gif">GIF</MenuItem>
            <MenuItem value="bmp">BMP</MenuItem>
            <MenuItem value="tiff">TIFF</MenuItem>
            <MenuItem value="svg">SVG</MenuItem>
          </Select>
        </StyledFormControl>

        <ConnectorLabel>{t('to')}</ConnectorLabel>

        <StyledFormControl size="small" variant="outlined">
          <Select
            value={convertTo}
            onChange={(e) => setConvertTo(String(e.target.value))}
            size="small"
            disabled={convertFrom === 'none'}
          >
            <MenuItem value="jpeg">JPEG</MenuItem>
            <MenuItem value="png">PNG</MenuItem>
            <MenuItem value="webp">WebP</MenuItem>
          </Select>
        </StyledFormControl>

        <InfoTooltip title={t('convert_info')} />
      </SelectsContainer>
    </FieldContainer>
  );
};
