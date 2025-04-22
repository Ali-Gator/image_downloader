import { useCallback } from 'react';

import { useSnackbar } from 'notistack';

import { useSettingsStore } from '@store';
import { NotificationType } from '@types';
import { getFolderName, useTranslation } from '@utils';

import { NOTIFICATION_DURATION } from './constants';
import { sendDownloadOptions } from './messaging';

/**
 * Creates a canvas-based fallback for downloading images
 * @param src Image source URL
 * @param fileName Filename to use when saving
 * @param onSuccess Success callback
 * @param onError Error callback
 */
const downloadWithCanvasConversion = (
  src: string,
  fileName: string,
  onSuccess: () => void,
  onError: () => void,
): void => {
  const imgElement = new Image();
  imgElement.crossOrigin = 'Anonymous';

  imgElement.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      canvas.getContext('2d')?.drawImage(imgElement, 0, 0);

      const dataUrl = canvas.toDataURL('image/jpeg');

      chrome.downloads.download(
        {
          url: dataUrl,
          filename: fileName,
          saveAs: false,
          conflictAction: 'uniquify',
        },
        (_) => {
          if (chrome.runtime.lastError) {
            onError();
          } else {
            onSuccess();
          }
        },
      );
    } catch (error) {
      onError();
    }
  };

  imgElement.onerror = onError;
  imgElement.src = src;
};

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
    (type: NotificationType | 'start') => {
      const message =
        type === 'start'
          ? t('download_started_text')
          : type === NotificationType.SUCCESS
            ? t('download_complete_text')
            : t('download_error_text');

      // Use INFO for 'start' type, otherwise use the type directly
      const variant = type === 'start' ? NotificationType.INFO : type;

      enqueueSnackbar(message, {
        variant,
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
      // Get folder name for download
      const folderName = getFolderName(downloadFolderName);
      const fullPath = folderName ? `${folderName}/${fileName}` : fileName;

      console.log('Downloading:', src);
      console.log('Path:', fullPath);

      // Send download options to background script first
      await sendDownloadOptions({
        url: src,
        filename: fullPath,
        saveAs: false,
      });

      // Show notification about download starting
      showNotification('start');

      // Use chrome.downloads API directly
      if (chrome.downloads && chrome.downloads.download) {
        chrome.downloads.download(
          {
            url: src,
            filename: fullPath,
            saveAs: false,
            conflictAction: 'uniquify',
          },
          (downloadId) => {
            console.log('Download started with ID:', downloadId);
            if (chrome.runtime.lastError) {
              console.error('Download error:', chrome.runtime.lastError);
              // If URL download fails, try canvas fallback
              if (src.startsWith('http')) {
                downloadWithCanvasConversion(
                  src,
                  fileName,
                  () => showNotification(NotificationType.SUCCESS),
                  () => showNotification(NotificationType.ERROR),
                );
              } else {
                showNotification(NotificationType.ERROR);
              }
            } else {
              showNotification(NotificationType.SUCCESS);
            }
          },
        );
      } else {
        // Fallback for development outside Chrome
        try {
          const a = document.createElement('a');
          a.href = src;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          showNotification(NotificationType.SUCCESS);
        } catch (error) {
          showNotification(NotificationType.ERROR);
        }
      }
    } catch (error) {
      console.error('Download handler error:', error);
      showNotification(NotificationType.ERROR);
    }
  }, [src, fileName, downloadFolderName, showNotification]);

  return { handleCopyUrl, handleDownload };
};
