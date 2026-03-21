import { memo, MouseEvent, useCallback, useMemo } from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Box, useTheme } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';

import { ActionButton } from '@components/Page/components/ActionButton';
import { CheckboxButton } from '@components/Page/components/CheckboxButton';
import { SafeImage } from '@components/Page/components/SafeImage';
import { useImageStore } from '@store';
import { ImageCardProps } from '@types';
import { useTranslation } from '@utils';
import { useImageOperations } from '@utils/imageOperations';


import { ImageInfo } from '../ImageInfo';
import {
  ActionButtonsContainer,
  enhancedAccentStyles,
  gridImageItemStyles,
  listImageItemStyles,
  StyledCheckboxArea,
  StyledImageContainer,
  StyledTopActionBar,
  TopBarLeftSection,
  TopBarRightSection,
} from './styles';
import { EnhancedLabel } from '../ImageInfo/styles';

/**
 * Component for displaying an image card
 * Supports two display modes: grid and list
 */
export const ImageCard = memo(({ image }: ImageCardProps) => {
  const { id, alt, filename } = image;
  const theme = useTheme();
  const { t } = useTranslation();

  const isGridView = useImageStore((s) => s.isGridView);
  const toggleSelectImage = useImageStore((s) => s.toggleSelectImage);
  const setLightboxImageId = useImageStore((s) => s.setLightboxImageId);
  const isSelected = useImageStore((s) => s.selectedImages.some((img) => img.id === id));
  const effectiveSrc = useImageStore((s) =>
    s.imageSourceOverrides[id] === 'original' && image.enhanced && image.originalSrc
      ? image.originalSrc
      : image.src,
  );
  const { handleCopyUrl, handleDownload } = useImageOperations(effectiveSrc, filename, id);

  const isListMode = !isGridView;

  // Handler for clicking on the card to select the image
  const handleSelect = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target instanceof Element && event.target.closest('button')) {
        return;
      }

      toggleSelectImage(image);
    },
    [image, toggleSelectImage],
  );

  const handleImageClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      setLightboxImageId(id);
    },
    [id, setLightboxImageId],
  );

  const cardStyles: SxProps<Theme> = useMemo(() => {
    const base = isListMode ? listImageItemStyles(theme) : gridImageItemStyles(theme);
    return image.enhanced ? { ...(base as object), ...enhancedAccentStyles } : base;
  }, [isListMode, theme, image.enhanced]);

  return (
    <Box
      className={isSelected ? 'selected' : ''}
      sx={cardStyles} // Keeping sx here since it's the cleanest way to apply the dynamic styles
      onClick={handleSelect}
      data-image-id={id} // Add unique identifier for finding the image
    >
      {!isListMode && (
        <StyledTopActionBar className="top-action-bar">
          <TopBarLeftSection>
            <CheckboxButton checked={isSelected} readOnly />
            {image.enhanced && <EnhancedLabel>{t('enhanced_label')}</EnhancedLabel>}
          </TopBarLeftSection>
          <TopBarRightSection>
            <ActionButtonsContainer>
              <ActionButton
                tooltip={t('copy_url_tooltip')}
                onClick={handleCopyUrl}
                aria-label={t('copy_url_tooltip')}
              >
                <ContentCopyIcon fontSize="small" />
              </ActionButton>
              <ActionButton
                tooltip={t('download_image_tooltip')}
                onClick={handleDownload}
                aria-label={t('download_image_tooltip')}
              >
                <FileDownloadIcon fontSize="small" />
              </ActionButton>
            </ActionButtonsContainer>
          </TopBarRightSection>
        </StyledTopActionBar>
      )}

      {isListMode && (
        <StyledCheckboxArea className="checkbox-area">
          <CheckboxButton checked={isSelected} readOnly />
        </StyledCheckboxArea>
      )}

      <StyledImageContainer className="image-container" onClick={handleImageClick}>
        <SafeImage src={effectiveSrc} alt={alt || filename} />
      </StyledImageContainer>

      <ImageInfo imageId={id} />
    </Box>
  );
});

ImageCard.displayName = 'ImageCard';
