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
import { downloadImagesWithConversion, useTranslation } from '../../../../utils';
import { NOTIFICATION_DURATION, NotificationType } from '../../../../utils/constants';
import { SettingsButton } from '../SettingsButton';

export const Header: FC = () => {
  const { t } = useTranslation();
  const { filteredImages, selectedImages, selectAll, deselectAll } = useImageStore();
  const { showDownloadNotifications, createZipArchive } = useSettingsStore();
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
      // Show initial notification
      const startMessage = createZipArchive
        ? t('creating_archive')
        : `${t('download_started_text')} (${selectedImages.length})`;

      showNotification(startMessage, NotificationType.INFO);

      // Progress callback for ZIP creation
      const onProgress = createZipArchive
        ? (current: number, total: number) => {
            const progressMessage = t('adding_image', [current.toString(), total.toString()]);
            showNotification(progressMessage, NotificationType.INFO, NOTIFICATION_DURATION.SHORT);
          }
        : undefined;

      // Use unified bulk download with conversion function
      const { successCount, totalCount } = await downloadImagesWithConversion(
        selectedImages,
        onProgress,
      );

      // Show completion notification
      const completionMessage = createZipArchive
        ? t('download_complete_text')
        : `${t('download_complete_text')}: ${successCount}/${totalCount}`;

      const variant =
        successCount === totalCount ? NotificationType.SUCCESS : NotificationType.WARNING;
      showNotification(completionMessage, variant, NOTIFICATION_DURATION.LONG);
    } catch (error) {
      showNotification(t('download_error_text'), NotificationType.ERROR);
    }
  }, [selectedImages, showNotification, t, createZipArchive]);

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
          <label htmlFor="selectAll">
            Select All ({selectedCount} of {totalCount} images)
          </label>
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
