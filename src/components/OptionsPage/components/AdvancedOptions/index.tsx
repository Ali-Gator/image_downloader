import { ChangeEvent, FC, useEffect, useState } from 'react';

import { Checkbox, FormControlLabel, InputAdornment, TextField, Typography } from '@mui/material';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import { InfoTooltip } from '../InfoIcon';
import { FieldContainer, OptionRow } from '../styles';

const clampPositive = (raw: string): number => Math.max(1, parseInt(raw, 10) || 1);

export const AdvancedOptions: FC = () => {
  const { t } = useTranslation();
  const {
    maxOgFetches,
    setMaxOgFetches,
    maxBgImages,
    setMaxBgImages,
    enableLegacyObservers,
    setEnableLegacyObservers,
  } = useSettingsStore();

  const [ogInput, setOgInput] = useState(String(maxOgFetches));
  const [bgInput, setBgInput] = useState(String(maxBgImages));

  // Sync local input state when store values change (e.g. after reset)
  useEffect(() => setOgInput(String(maxOgFetches)), [maxOgFetches]);
  useEffect(() => setBgInput(String(maxBgImages)), [maxBgImages]);

  const handleOgBlur = () => {
    const value = clampPositive(ogInput);
    setOgInput(String(value));
    setMaxOgFetches(value);
  };

  const handleBgBlur = () => {
    const value = clampPositive(bgInput);
    setBgInput(String(value));
    setMaxBgImages(value);
  };

  return (
    <>
      <FieldContainer>
        <Typography variant="body1">{t('max_og_fetches')}</Typography>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          type="number"
          value={ogInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setOgInput(e.target.value)}
          onBlur={handleOgBlur}
          inputProps={{ min: 1 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <InfoTooltip title={t('max_og_fetches_info')} />
              </InputAdornment>
            ),
          }}
        />
      </FieldContainer>
      <FieldContainer>
        <Typography variant="body1">{t('max_bg_images')}</Typography>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          type="number"
          value={bgInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setBgInput(e.target.value)}
          onBlur={handleBgBlur}
          inputProps={{ min: 1 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <InfoTooltip title={t('max_bg_images_info')} />
              </InputAdornment>
            ),
          }}
        />
      </FieldContainer>
      <OptionRow>
        <FormControlLabel
          control={
            <Checkbox
              checked={enableLegacyObservers}
              onChange={(e) => setEnableLegacyObservers(e.target.checked)}
              size="small"
            />
          }
          label={t('enable_legacy_observers')}
        />
        <InfoTooltip title={t('enable_legacy_observers_info')} />
      </OptionRow>
    </>
  );
};
