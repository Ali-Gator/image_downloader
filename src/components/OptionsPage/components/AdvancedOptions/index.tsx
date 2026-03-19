import { ChangeEvent, FC, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import { InfoTooltip } from '../InfoIcon';
import { FieldContainer } from '../styles';

const clampPositive = (raw: string): number => Math.max(1, parseInt(raw, 10) || 1);

export const AdvancedOptions: FC = () => {
  const { t } = useTranslation();
  const { maxOgFetches, setMaxOgFetches, maxBgImages, setMaxBgImages } = useSettingsStore();

  const [ogInput, setOgInput] = useState(String(maxOgFetches));
  const [bgInput, setBgInput] = useState(String(maxBgImages));

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
    <Accordion
      disableGutters
      elevation={0}
      sx={{ '&:before': { display: 'none' }, backgroundColor: 'transparent' }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
        <Typography variant="body1">{t('advanced_options')}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0 }}>
        <FieldContainer>
          <Typography variant="body1">{t('max_og_fetches')}:</Typography>
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
          <Typography variant="body1">{t('max_bg_images')}:</Typography>
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
      </AccordionDetails>
    </Accordion>
  );
};
