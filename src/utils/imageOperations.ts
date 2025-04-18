import { useSnackbar } from 'notistack';
import { useCallback } from 'react';

import { useTranslation } from '@utils';

/**
 * Hook for common image operations - copying URLs and downloading images
 */
export const useImageOperations = (src: string, fileName: string) => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  /**
   * Handle copying image URL to clipboard
   */
  const handleCopyUrl = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard
        .writeText(src)
        .then(() => {
          enqueueSnackbar(t('url_copied_text'), {
            variant: 'success',
            autoHideDuration: 2000,
          });
        })
        .catch((error) => {
          console.error('Error copying URL', error);
          enqueueSnackbar(t('url_copy_error_text'), {
            variant: 'error',
            autoHideDuration: 2000,
          });
        });
    },
    [src, enqueueSnackbar, t],
  );

  /**
   * Handle downloading an image
   */
  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      // Use chrome.downloads API for all URL types
      if (chrome.downloads && chrome.downloads.download) {
        chrome.downloads.download(
          {
            url: src,
            filename: fileName,
            saveAs: false,
          },
          (_) => {
            if (chrome.runtime.lastError) {
              console.error('Download error:', chrome.runtime.lastError);
              enqueueSnackbar(t('download_error_text'), {
                variant: 'error',
                autoHideDuration: 2000,
              });
            } else {
              enqueueSnackbar(t('download_started_text'), {
                variant: 'success',
                autoHideDuration: 2000,
              });
            }
          },
        );
      } else {
        // Fallback for when chrome.downloads API is not available
        try {
          const a = document.createElement('a');
          a.href = src;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          enqueueSnackbar(t('download_started_text'), {
            variant: 'success',
            autoHideDuration: 2000,
          });
        } catch (error) {
          console.error('Download error:', error);
          enqueueSnackbar(t('download_error_text'), {
            variant: 'error',
            autoHideDuration: 2000,
          });
        }
      }
    },
    [src, fileName, enqueueSnackbar, t],
  );

  return { handleCopyUrl, handleDownload };
}; 