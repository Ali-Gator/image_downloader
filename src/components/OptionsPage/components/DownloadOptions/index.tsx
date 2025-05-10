import { FC } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Alert, Button, FormControl, MenuItem, Select, TextField, Typography } from '@mui/material';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import {
  AlertBox,
  ButtonContainer,
  ConvertRow,
  FieldContainer,
  StyledContainer,
  TitleRow,
} from './styles';

export const DownloadOptions: FC = () => {
  const { t } = useTranslation();
  const {
    subfolderName,
    renamePattern,
    convertFrom,
    convertTo,
    setSubfolderName,
    setRenamePattern,
    setConvertFrom,
    setConvertTo,
    resetDownloadOptions,
  } = useSettingsStore();

  return (
    <StyledContainer elevation={2}>
      <TitleRow>
        <CheckIcon />
        <Typography variant="h6">{t('download_options')}</Typography>
      </TitleRow>

      <FieldContainer>
        <Typography variant="body1">{t('subfolder_name')}:</Typography>
        <TextField
          fullWidth
          size="small"
          value={subfolderName}
          onChange={(e) => setSubfolderName(e.target.value)}
          variant="outlined"
        />
      </FieldContainer>

      <FieldContainer>
        <Typography variant="body1">{t('rename_files')}:</Typography>
        <TextField
          fullWidth
          size="small"
          value={renamePattern}
          onChange={(e) => setRenamePattern(e.target.value)}
          variant="outlined"
        />
      </FieldContainer>

      <ConvertRow>
        <Typography variant="body1">{t('convert')}</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select value={convertFrom} onChange={(e) => setConvertFrom(e.target.value)}>
            <MenuItem value="all">{t('all_images')}</MenuItem>
            <MenuItem value="webp">{'webp_only'}</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="body1" sx={{ mx: 1 }}>
          {t('to')}
        </Typography>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select value={convertTo} onChange={(e) => setConvertTo(e.target.value)}>
            <MenuItem value="jpeg">JPEG</MenuItem>
            <MenuItem value="png">PNG</MenuItem>
          </Select>
        </FormControl>
      </ConvertRow>

      <ButtonContainer>
        <Button
          variant="outlined"
          color="primary"
          onClick={resetDownloadOptions}
          startIcon={<RestartAltIcon />}
        >
          {t('reset_btn')}
        </Button>
      </ButtonContainer>

      <AlertBox>
        <Alert severity="info">{t('browser_save_setting_message')}</Alert>
      </AlertBox>
    </StyledContainer>
  );
};
