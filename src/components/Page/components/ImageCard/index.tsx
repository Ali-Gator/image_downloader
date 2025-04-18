import { memo, MouseEvent, useCallback } from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Box, useTheme } from '@mui/material';

import { ActionButton } from '@components/Page/components/ActionButton';
import { CheckboxButton } from '@components/Page/components/CheckboxButton';
import { useImageStore } from '@store';
import { ImageCardProps } from '@types';
import { getSmartFileName, useTranslation } from '@utils';
import { useImageOperations } from '@utils/imageOperations';

import { ImageInfo } from '../ImageInfo';
import {
  ActionButtonsContainer,
  gridImageItemStyles,
  listImageItemStyles,
  StyledCheckboxArea,
  StyledImageContainer,
  StyledTopActionBar,
} from './styles';

/**
 * Component for displaying an image card
 * Supports two display modes: grid and list
 */
export const ImageCard = memo(({ image }: ImageCardProps) => {
  const { id, src, alt } = image;
  const fileName = getSmartFileName(image);
  const theme = useTheme();
  const { t } = useTranslation();
  const { handleCopyUrl, handleDownload } = useImageOperations(src, fileName);
  
  const { 
    isGridView, 
    selectedImages,
    toggleSelectImage 
  } = useImageStore();
  
  const isListMode = !isGridView;
  const isSelected = selectedImages.some(img => img.id === id);

  // Handler for clicking on the card to select the image
  const handleSelect = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      // In list mode, only allow selection when clicking the checkbox area
      if (isListMode) {
        // Only select if clicking on the checkbox container
        const isCheckboxAreaClick =
          event.target instanceof Element &&
          (event.target.classList.contains('checkbox-area') ||
            event.target.closest('.checkbox-area'));

        if (!isCheckboxAreaClick) {
          return;
        }
      } else {
        // Grid mode - check if click is on interactive elements
        if (event.target instanceof Element && event.target.closest('button')) {
          return;
        }
      }

      toggleSelectImage(image);
    },
    [image, toggleSelectImage, isListMode],
  );

  // Use theme-based styles but apply them via className with emotion
  const cardStyles = isListMode ? listImageItemStyles(theme) : gridImageItemStyles(theme);

  return (
    <Box
      className={isSelected ? 'selected' : ''}
      sx={cardStyles} // Keeping sx here since it's the cleanest way to apply the dynamic styles
      onClick={handleSelect}
    >
      {!isListMode && (
        <StyledTopActionBar className="top-action-bar">
          <CheckboxButton checked={isSelected} readOnly />
          <ActionButtonsContainer>
            <ActionButton tooltip={t('copy_url_tooltip')} onClick={handleCopyUrl}>
              <ContentCopyIcon fontSize="small" />
            </ActionButton>
            <ActionButton tooltip={t('download_image_tooltip')} onClick={handleDownload}>
              <FileDownloadIcon fontSize="small" />
            </ActionButton>
          </ActionButtonsContainer>
        </StyledTopActionBar>
      )}

      {isListMode && (
        <StyledCheckboxArea className="checkbox-area">
          <CheckboxButton checked={isSelected} readOnly />
        </StyledCheckboxArea>
      )}

      <StyledImageContainer className="image-container">
        <img src={src} alt={alt || fileName} loading="lazy" />
      </StyledImageContainer>

      <ImageInfo imageId={id} />
    </Box>
  );
});

ImageCard.displayName = 'ImageCard';
