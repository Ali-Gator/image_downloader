import React, { memo, useCallback } from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Tooltip } from '@mui/material';
import { useSnackbar } from 'notistack';

import { ImageInfoProps } from '@components/Page/types';
import { getFileExtension, getFriendlyUrlDisplay, useTranslation } from '@utils';

import {
  ActionButton,
  ActionsContainer,
  CopyButton,
  Dimensions,
  DimensionsContainer,
  FileExtension,
  FileName,
  ImageInfoContainer,
  ImageUrl,
  NonClickableUrl,
  UrlContainer,
  UrlText,
} from './styles';

/**
 * Component for displaying information about an image (filename, dimensions)
 */
export const ImageInfo = memo(({ fileName, width, height, src, isListMode }: ImageInfoProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

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

  const dimensions = width && height ? `${width} × ${height}` : '';
  const urlDisplay = getFriendlyUrlDisplay(src);
  const canOpenExternally = !src.startsWith('data:') && !src.startsWith('blob:');
  const fileExtension = getFileExtension(fileName);

  return (
    <ImageInfoContainer className={isListMode ? 'list-mode' : ''}>
      <FileName className="file-name" variant="body1" title={fileName}>
        {fileName}
      </FileName>

      {dimensions && (
        <DimensionsContainer className="dimensions-container">
          <Dimensions className="dimensions">{dimensions}</Dimensions>
          {isListMode && <FileExtension className="file-extension">{fileExtension}</FileExtension>}
        </DimensionsContainer>
      )}

      {isListMode && (
        <>
          <ActionsContainer className="actions-container">
            <Tooltip title={t('download_image_tooltip')}>
              <ActionButton size="small" onClick={handleDownload} className="action-button">
                <FileDownloadIcon fontSize="small" />
              </ActionButton>
            </Tooltip>

            <Tooltip title={t('copy_url_tooltip')}>
              <ActionButton size="small" onClick={handleCopyUrl} className="action-button">
                <ContentCopyIcon fontSize="small" />
              </ActionButton>
            </Tooltip>
          </ActionsContainer>

          <UrlContainer className="url-container">
            {canOpenExternally ? (
              <Tooltip title={urlDisplay.tooltip}>
                <ImageUrl
                  href={src}
                  className="image-url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <OpenInNewIcon className="url-icon" fontSize="small" />
                  <UrlText className="url-text">{urlDisplay.text}</UrlText>
                </ImageUrl>
              </Tooltip>
            ) : (
              <Tooltip title={urlDisplay.tooltip}>
                <NonClickableUrl className="image-url">{urlDisplay.text}</NonClickableUrl>
              </Tooltip>
            )}
          </UrlContainer>
        </>
      )}

      {!isListMode && (
        <Tooltip title={t('copy_url_tooltip')}>
          <CopyButton size="small" onClick={handleCopyUrl} className="copy-button">
            <ContentCopyIcon fontSize="small" />
          </CopyButton>
        </Tooltip>
      )}
    </ImageInfoContainer>
  );
});

ImageInfo.displayName = 'ImageInfo';
