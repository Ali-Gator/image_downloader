import { memo } from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Tooltip } from '@mui/material';

import { ActionButton } from '@components/Page/components/ActionButton';
import { useImageStore } from '@store';
import { ImageInfoProps } from '@types';
import { formatFileSize, getFileExtension, getFriendlyUrlDisplay, useTranslation } from '@utils';
import { useImageOperations } from '@utils/imageOperations';
import { getQualityFromDimensions } from '@utils/imageUtils';

import {
  ActionsContainer,
  Dimensions,
  DimensionsContainer,
  FileExtension,
  FileName,
  FileSize,
  ImageInfoContainer,
  ImageUrl,
  NonClickableUrl,
  QualityBadge,
  UrlContainer,
  UrlText,
} from './styles';

/**
 * Component for displaying information about an image (filename, dimensions)
 */
export const ImageInfo = memo(({ imageId }: ImageInfoProps) => {
  const { t } = useTranslation();
  const { filteredImages, isGridView } = useImageStore();
  const image = filteredImages.find((img) => img.id === imageId);

  // Хуки всегда вызываются, даже если image не найден
  const isListMode = !isGridView;
  const emptyStr = '';
  const defaultSrc = '';
  const defaultFileName = '';

  // Безопасно извлекаем значения, используя дефолтные, если image не найден
  const src = image?.src || defaultSrc;
  const width = image?.width;
  const height = image?.height;
  const fileName = image ? image.filename : defaultFileName;
  const formattedFileSize = image?.fileSize ? formatFileSize(image.fileSize) : null;

  // Используем хуки всегда, даже если image не найден
  const { handleCopyUrl, handleDownload } = useImageOperations(src, fileName);

  // Вычисляем свойства, основанные на извлеченных данных
  const dimensions = width && height ? `${width} × ${height}` : emptyStr;
  const urlDisplay = getFriendlyUrlDisplay(src);
  const canOpenExternally = !src.startsWith('data:') && !src.startsWith('blob:');
  const fileExtension = getFileExtension(fileName);

  // Determine image quality based on dimensions
  const qualityLevel = getQualityFromDimensions(width || 0, height || 0);

  const qualityLabel = qualityLevel.toUpperCase();

  // Если изображение не найдено, возвращаем пустой контейнер
  if (!image) {
    return <ImageInfoContainer />;
  }

  return (
    <ImageInfoContainer className={isListMode ? 'list-mode' : ''}>
      <FileName className="file-name" variant="body1" title={fileName}>
        {fileName}
      </FileName>

      {dimensions && (
        <DimensionsContainer className="dimensions-container">
          <Dimensions className="dimensions">{dimensions}</Dimensions>
          {formattedFileSize && <FileSize className="file-size">{formattedFileSize}</FileSize>}
          <FileExtension className="file-extension">{fileExtension}</FileExtension>
          <QualityBadge quality={qualityLevel} title={`${t('image_quality')} ${qualityLabel}`}>
            {qualityLabel}
          </QualityBadge>
        </DimensionsContainer>
      )}

      {isListMode && (
        <>
          <ActionsContainer className="actions-container">
            <ActionButton
              tooltip={t('download_image_tooltip')}
              onClick={handleDownload}
              aria-label={t('download_image_tooltip')}
            >
              <FileDownloadIcon fontSize="small" />
            </ActionButton>
            <ActionButton
              tooltip={t('copy_url_tooltip')}
              onClick={handleCopyUrl}
              aria-label={t('copy_url_tooltip')}
            >
              <ContentCopyIcon fontSize="small" />
            </ActionButton>
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
