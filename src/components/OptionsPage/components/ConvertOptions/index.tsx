import { FC } from 'react';

import { MenuItem, Typography } from '@mui/material';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import { InfoTooltip } from '../InfoIcon';
import {
  ConvertRow,
  StyledFormControl,
  StyledSelect,
  StyledTypography,
  SelectsContainer,
} from './styles';

export const ConvertOptions: FC = () => {
  const { t } = useTranslation();
  const { convertFrom, convertTo, setConvertFrom, setConvertTo } = useSettingsStore();

  return (
    <ConvertRow data-onboarding="convert">
      <StyledTypography variant="body1">{t('convert')}</StyledTypography>

      <SelectsContainer>
        <StyledFormControl size="small" variant="outlined">
          <StyledSelect
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
          </StyledSelect>
        </StyledFormControl>

        {convertFrom !== 'none' && (
          <>
            <Typography>{t('to')}</Typography>

            <StyledFormControl size="small" variant="outlined">
              <StyledSelect
                value={convertTo}
                onChange={(e) => setConvertTo(String(e.target.value))}
                size="small"
              >
                <MenuItem value="jpeg">JPEG</MenuItem>
                <MenuItem value="png">PNG</MenuItem>
                <MenuItem value="webp">WebP</MenuItem>
              </StyledSelect>
            </StyledFormControl>
          </>
        )}

        <InfoTooltip title={t('convert_info')} />
      </SelectsContainer>
    </ConvertRow>
  );
};
