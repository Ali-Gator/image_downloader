import { useCallback } from 'react';

import { useSnackbar } from 'notistack';

import { useSettingsStore } from '@store';
import { downloadImage, getFolderName, useTranslation } from '@utils';

import { NOTIFICATION_DURATION, NotificationType } from './constants';
import { setDownloadOptions } from './messaging';

/**
 * Hook for common image operations - copying URLs and downloading images
 */
export const useImageOperations = (src: string, fileName: string) => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const { downloadFolderName } = useSettingsStore();

  /**
   * Shows notification for different download states
   */
  const showNotification = useCallback(
    (type: NotificationType) => {
      let message;
      switch (type) {
        case NotificationType.INFO:
          message = t('download_started_text');
          break;
        case NotificationType.SUCCESS:
          message = t('download_complete_text');
          break;
        case NotificationType.ERROR:
        default:
          message = t('download_error_text');
          break;
      }
      enqueueSnackbar(message, {
        variant: type,
        autoHideDuration: NOTIFICATION_DURATION.SHORT,
      });
    },
    [enqueueSnackbar, t],
  );

  /**
   * Handle copying image URL to clipboard
   */
  const handleCopyUrl = useCallback(() => {
    navigator.clipboard
      .writeText(src)
      .then(() => {
        enqueueSnackbar(t('url_copied_text'), {
          variant: NotificationType.SUCCESS,
          autoHideDuration: NOTIFICATION_DURATION.SHORT,
        });
      })
      .catch(() => {
        enqueueSnackbar(t('url_copy_error_text'), {
          variant: NotificationType.ERROR,
          autoHideDuration: NOTIFICATION_DURATION.SHORT,
        });
      });
  }, [src, enqueueSnackbar, t]);

  /**
   * Handle downloading an image
   */
  const handleDownload = useCallback(async () => {
    try {
      // Get the folder name for download
      const folderName = await getFolderName(downloadFolderName);

      // Show notification about download start
      showNotification(NotificationType.INFO);

      // Set download options before starting the download
      // TODO: now it's possible to refactor on using global state
      await setDownloadOptions(folderName, fileName);
      await downloadImage({ src, filename: fileName }, folderName);
      showNotification(NotificationType.SUCCESS);
    } catch (error) {
      showNotification(NotificationType.ERROR);
    }
  }, [src, fileName, downloadFolderName, showNotification]);

  return { handleCopyUrl, handleDownload };
};
