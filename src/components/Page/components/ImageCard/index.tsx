import { memo, MouseEvent, useCallback } from 'react';

import { Box, Checkbox, useTheme } from '@mui/material';

import { ImageCardProps, ViewMode } from '@components/Page/types';
import { getSmartFileName } from '@utils';

import { ImageInfo } from '../ImageInfo';
import { gridImageItemStyles, listImageItemStyles } from './styles';

/**
 * Component for displaying an image card
 * Supports two display modes: grid and list
 */
export const ImageCard = memo(
  ({ image, isSelected, onSelect, viewMode = ViewMode.Grid }: ImageCardProps) => {
    const { src, alt, width, height } = image;
    const fileName = getSmartFileName(image);
    const theme = useTheme();
    const isListMode = viewMode === ViewMode.List;

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

        onSelect(src);
      },
      [src, onSelect, isListMode],
    );

    const cardStyles = isListMode ? listImageItemStyles(theme) : gridImageItemStyles(theme);

    return (
      <Box sx={cardStyles} className={isSelected ? 'selected' : ''} onClick={handleSelect}>
        <Box className="checkbox-area">
          <Checkbox checked={isSelected} className="image-checkbox" readOnly />
        </Box>
        <Box className="image-container">
          <img src={src} alt={alt || fileName} loading="lazy" />
        </Box>
        <ImageInfo
          fileName={fileName}
          width={width}
          height={height}
          src={src}
          isListMode={isListMode}
        />
      </Box>
    );
  },
);

ImageCard.displayName = 'ImageCard';
