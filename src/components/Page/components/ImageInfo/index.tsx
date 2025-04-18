import React, { memo, useEffect, useState } from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Tooltip } from '@mui/material';

import { ImageInfoProps } from '@components/Page/types';
import { getFileExtension, getFileSize, getFriendlyUrlDisplay, useTranslation } from '@utils';
import { useImageOperations } from '@utils/imageOperations';

import {
  ActionButton,
  ActionsContainer,
  Dimensions,
  DimensionsContainer,
  FileExtension,
  FileName,
  FileSize,
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
  const { t } = useTranslation();
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isLoadingSize, setIsLoadingSize] = useState(false);
  const { handleCopyUrl, handleDownload } = useImageOperations(src, fileName);

  useEffect(() => {
    setIsLoadingSize(true);

    const fetchFileSize = async () => {
      try {
        const size = await getFileSize(src);
        setFileSize(size);
      } catch (error) {
        console.error('Error getting file size:', error);
        setFileSize(null);
      } finally {
        setIsLoadingSize(false);
      }
    };

    fetchFileSize();
  }, [src]);

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
          {!isLoadingSize && fileSize && <FileSize className="file-size">{fileSize}</FileSize>}
          <FileExtension className="file-extension">{fileExtension}</FileExtension>
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
    </ImageInfoContainer>
  );
});

ImageInfo.displayName = 'ImageInfo';
