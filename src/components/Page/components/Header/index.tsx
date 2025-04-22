import { ChangeEvent, FC, useCallback } from 'react';

import DownloadIcon from '@mui/icons-material/Download';
import { Button, Checkbox, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

import { useImageStore, useSettingsStore } from '@store';
import { NotificationType } from '@types';
import { getFolderName, useTranslation } from '@utils';
import { NOTIFICATION_DURATION } from '@utils/constants';
import { downloadImage as downloadImageHelper } from '@utils/downloadHelpers';

import {
  ControlsContainer,
  HeaderContainer,
  LogoImage,
  SelectAllContainer,
  TitleContainer,
} from './styles';

export const Header: FC = () => {
  const { t } = useTranslation();
  const { filteredImages, selectedImages, selectAll, deselectAll } = useImageStore();
  const { downloadFolderName, showDownloadNotifications } = useSettingsStore();
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
      const folderName = getFolderName(downloadFolderName);

      // Show notification about download starting
      showNotification(
        `${t('download_started_text')} (${selectedImages.length})`,
        NotificationType.INFO,
      );

      // Download all selected images sequentially
      let successCount = 0;
      const failedUrls = [];

      // Process downloads in batches to prevent overwhelming the browser
      const batchSize = 5;
      for (let i = 0; i < selectedImages.length; i += batchSize) {
        const batch = selectedImages.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map((image) => downloadImageHelper(image, folderName)),
        );

        // Count successes and failures
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value === true) {
            successCount++;
          } else {
            failedUrls.push(batch[index].src);
          }
        });

        // Show progress notification for each batch
        if (i + batchSize < selectedImages.length) {
          const progress = Math.min(i + batchSize, selectedImages.length);
          showNotification(
            `${t('downloading_progress_text')}: ${progress}/${selectedImages.length}`,
            NotificationType.INFO,
          );
        }
      }

      // Log any failures
      if (failedUrls.length > 0) {
        console.error(`Failed to download ${failedUrls.length} images:`, failedUrls);
      }

      // Show notification about download completion with different text
      const message = `${t('download_complete_text')}: ${successCount}/${selectedImages.length}`;
      const variant =
        successCount === selectedImages.length
          ? NotificationType.SUCCESS
          : successCount > 0
            ? NotificationType.WARNING
            : NotificationType.ERROR;

      showNotification(message, variant, NOTIFICATION_DURATION.LONG);
    } catch (error) {
      console.error('Download process error:', error);
      showNotification(t('download_error_text'), NotificationType.ERROR);
    }
  }, [selectedImages, downloadFolderName, showNotification, t]);

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
      </ControlsContainer>
    </HeaderContainer>
  );
};
