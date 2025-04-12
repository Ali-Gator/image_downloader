import { memo, useCallback } from 'react';

import { Checkbox, Typography } from '@mui/material';

import { ImageInfo, ImageItem } from './styles';
import { getFileNameFromUrl } from '../../../../utils/fileUtils';
import { ImageCardProps } from '../../types';

export const ImageCard = memo(({ image, isSelected, onSelect }: ImageCardProps) => {
  const { src, alt, width, height } = image;
  const fileName = getFileNameFromUrl(src);

  const handleSelect = useCallback(() => {
    onSelect(src);
  }, [src, onSelect]);

  return (
    <ImageItem className={isSelected ? 'selected' : ''} onClick={handleSelect}>
      <Checkbox checked={isSelected} className="image-checkbox" readOnly />
      <img src={src} alt={alt || fileName} loading="lazy" />
      <ImageInfo>
        <Typography variant="body2" className="file-name">
          {fileName}
        </Typography>
        <Typography variant="caption" className="dimensions">
          {width} × {height} px
        </Typography>
      </ImageInfo>
    </ImageItem>
  );
});

ImageCard.displayName = 'ImageCard';
