import { memo, useCallback } from 'react';

import { Box, Checkbox, Typography, useTheme } from '@mui/material';

import { ImageCardProps, ViewMode } from '@components/Page/types';
import { getSmartFileName } from '@utils';

import {
  gridImageInfoStyles,
  gridImageItemStyles,
  listImageInfoStyles,
  listImageItemStyles,
} from './styles';

/**
 * Компонент для отображения информации об изображении (имя файла, размеры)
 */
const ImageInfo = ({ fileName, width, height, isListMode }: {
  fileName: string;
  width: number;
  height: number;
  isListMode: boolean;
}) => {
  const theme = useTheme();
  
  return (
    <Box sx={isListMode ? listImageInfoStyles(theme) : gridImageInfoStyles(theme)}>
      <Typography variant="body2" className="file-name">
        {fileName}
      </Typography>
      <Typography variant="caption" className="dimensions">
        {width} × {height} px
      </Typography>
    </Box>
  );
};

/**
 * Компонент для отображения карточки изображения
 * Поддерживает два режима отображения: сетка (grid) и список (list)
 */
export const ImageCard = memo(
  ({ image, isSelected, onSelect, viewMode = ViewMode.Grid }: ImageCardProps) => {
    const { src, alt, width, height } = image;
    const fileName = getSmartFileName(image);
    const theme = useTheme();
    const isListMode = viewMode === ViewMode.List;

    const handleSelect = useCallback(() => {
      onSelect(src);
    }, [src, onSelect]);

    const cardStyles = isListMode ? listImageItemStyles(theme) : gridImageItemStyles(theme);

    return (
      <Box
        sx={cardStyles}
        className={isSelected ? 'selected' : ''}
        onClick={handleSelect}
      >
        <Checkbox checked={isSelected} className="image-checkbox" readOnly />
        <Box className="image-container">
          <img src={src} alt={alt || fileName} loading="lazy" />
        </Box>
        <ImageInfo 
          fileName={fileName}
          width={width}
          height={height}
          isListMode={isListMode}
        />
      </Box>
    );
  },
);

ImageCard.displayName = 'ImageCard';
