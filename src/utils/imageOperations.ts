import { useCallback, useState } from 'react';

import { useSnackbar } from 'notistack';

import { useImageStore, useRatingStore, useSettingsStore } from '@store';
import { ImageData, MessageActionType } from '@types';

import {
  downloadImageWithConversion,
  gateDownloadWithPaywall,
  useTranslation,
} from '../utils';
import { NOTIFICATION_DURATION, NotificationType } from './constants';
import { sendMessageToContentScript } from './contentScriptUtils';

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
      const gate = await gateDownloadWithPaywall({ pageUrl });
      if (gate.blocked) return;

      // Show notification about download start
      showNotification(NotificationType.INFO);

      // Refresh settings before download
      await useSettingsStore.getState().refreshSettings();

      // Use unified download with conversion function
      const result = await downloadImageWithConversion({ src, filename: fileName, id: imageId });

      if (result.success) {
        useRatingStore.getState().setHasSuccessfulDownload(true);
      }

      showNotification(NotificationType.SUCCESS);
    } catch (error) {
      showNotification(NotificationType.ERROR);
    }
  }, [src, fileName, imageId, showNotification, pageUrl]);

  return { handleCopyUrl, handleDownload };
};

/**
 * Hook for enhancing a single image via content script
 */
export const useEnhanceSingleImage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const sourceTabId = useImageStore((s) => s.sourceTabId);
  const updateImages = useImageStore((s) => s.updateImages);
  const [enhancingImageIds, setEnhancingImageIds] = useState<Set<string>>(new Set());

  const handleEnhanceSingle = useCallback(
    async (image: ImageData) => {
      if (!sourceTabId) return;

      setEnhancingImageIds((prev) => new Set(prev).add(image.id));
      try {
        const response = await sendMessageToContentScript<{
          images: ImageData[];
          upgradedCount: number;
        }>(sourceTabId, { action: MessageActionType.ENHANCE_IMAGES, images: [image] }, 60000);

        if (response?.images && response.upgradedCount > 0) {
          updateImages(response.images);
          enqueueSnackbar(t('enhance_found', '1'), { variant: 'success' });
        } else {
          enqueueSnackbar(t('enhance_no_upgrades'), { variant: 'info' });
        }
      } catch {
        enqueueSnackbar(t('enhance_error'), { variant: 'error' });
      } finally {
        setEnhancingImageIds((prev) => {
          const next = new Set(prev);
          next.delete(image.id);
          return next;
        });
      }
    },
    [sourceTabId, updateImages, enqueueSnackbar, t],
  );

  const isEnhancingImage = useCallback(
    (imageId: string) => enhancingImageIds.has(imageId),
    [enhancingImageIds],
  );

  return { handleEnhanceSingle, isEnhancingImage };
};
