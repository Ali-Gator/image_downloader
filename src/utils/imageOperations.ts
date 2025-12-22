import { useCallback } from 'react';

import { useSnackbar } from 'notistack';

import { useImageStore } from '@store';

import { downloadImageWithConversion, maybeOpenPaywallOn11thClick, recordSuccessfulDownloadPageUrl, useTranslation } from '../utils';
import { NOTIFICATION_DURATION, NotificationType } from './constants';

/**
 * Hook for common image operations - copying URLs and downloading images
 */
export const useImageOperations = (src: string, fileName: string, imageId?: string) => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const pageUrl = useImageStore((s) => s.pageUrl);

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
      const gate = await maybeOpenPaywallOn11thClick({ pageUrl });
      if (gate.blocked) return;

      // Show notification about download start
      showNotification(NotificationType.INFO);

      // Use unified download with conversion function
      await downloadImageWithConversion({ src, filename: fileName, id: imageId });

      // Count only after a successful download
      if (gate.eligibility.showMonetizationUI) {
        await recordSuccessfulDownloadPageUrl(pageUrl);
      }

      showNotification(NotificationType.SUCCESS);
    } catch (error) {
      showNotification(NotificationType.ERROR);
    }
  }, [src, fileName, imageId, showNotification, pageUrl]);

  return { handleCopyUrl, handleDownload };
};
