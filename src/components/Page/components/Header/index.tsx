import { ChangeEvent, FC, useCallback } from 'react';

import DownloadIcon from '@mui/icons-material/Download';
import { Button, Checkbox, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

import { useImageStore, useSettingsStore } from '@store';

import {
  ControlsContainer,
  HeaderContainer,
  LogoImage,
  SelectAllContainer,
  TitleContainer,
} from './styles';
import { downloadImage, useTranslation } from '../../../../utils';
import { NOTIFICATION_DURATION, NotificationType } from '../../../../utils/constants';
import { SettingsButton } from '../SettingsButton';

export const Header: FC = () => {
  const { t } = useTranslation();
  const { filteredImages, selectedImages, selectAll, deselectAll } = useImageStore();
  const { showDownloadNotifications, folderName, renamePattern } = useSettingsStore();
  const { enqueueSnackbar } = useSnackbar();

  const handleSelectAllChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      selectAll();
    } else {
      deselectAll();
    }
  };

  /**
   * Shows a notification if notifications are enabled
   */
  const showNotification = useCallback(
    (message: string, variant: NotificationType, duration = NOTIFICATION_DURATION.MEDIUM) => {
      if (showDownloadNotifications) {
        enqueueSnackbar(message, {
          variant,
          autoHideDuration: duration,
        });
      }
    },
    [showDownloadNotifications, enqueueSnackbar],
  );

  const handleDownload = useCallback(async () => {
    if (selectedImages.length === 0) return;

    try {
      // Show notification about download start
      showNotification(
        `${t('download_started_text')} (${selectedImages.length})`,
        NotificationType.INFO,
      );

      // Download all selected images sequentially
      let successCount = 0;

      for (const image of selectedImages) {
        try {
          await downloadImage(image, { folderName, renamePattern });
          successCount++;
        } catch (error) {
          // Error is already handled in downloadImage
        }
      }

      // Show notification about download completion
      const message = `${t('download_complete_text')}: ${successCount}/${selectedImages.length}`;
      const variant =
        successCount === selectedImages.length
          ? NotificationType.SUCCESS
          : NotificationType.WARNING;

      showNotification(message, variant, NOTIFICATION_DURATION.LONG);
    } catch (error) {
      showNotification(t('download_error_text'), NotificationType.ERROR);
    }
  }, [selectedImages, folderName, renamePattern, showNotification, t]);

  const selectedCount = selectedImages.length;
  const totalCount = filteredImages.length;
  const isAllSelected = selectedCount > 0 && selectedCount === totalCount;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  return (
    <HeaderContainer>
      <TitleContainer>
        <LogoImage src="/img/logo-64.png" alt="Logo" />
        <Typography variant="h6">{t('popup_title')}</Typography>
      </TitleContainer>

      <ControlsContainer>
        <SelectAllContainer>
          <Checkbox
            id="selectAll"
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={handleSelectAllChange}
          />
          <label htmlFor="selectAll">Select All</label>
        </SelectAllContainer>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={selectedCount === 0}
        >
          {t('download_btn')}
        </Button>

        <SettingsButton />
      </ControlsContainer>
    </HeaderContainer>
  );
};
