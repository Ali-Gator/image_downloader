import { ChangeEvent, memo, SyntheticEvent, useCallback } from 'react';

import { Checkbox, Typography } from '@mui/material';

import { ImageInfo, ImageItem } from './styles';

export interface ImageCardProps {
  url: string;
  isSelected: boolean;
  fileName: string;
  dimensions?: { width: number; height: number };
  onSelect: (url: string) => void;
  onImageLoad: (url: string, width: number, height: number) => void;
}

export const ImageCard = memo(
  ({ url, isSelected, fileName, dimensions, onSelect, onImageLoad }: ImageCardProps) => {
    const handleSelect = useCallback(() => {
      onSelect(url);
    }, [url, onSelect]);

    const handleCheckboxChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        onSelect(url);
      },
      [url, onSelect],
    );

    const handleImageLoad = useCallback(
      (e: SyntheticEvent<HTMLImageElement>) => {
        const img = e.target as HTMLImageElement;
        onImageLoad(url, img.naturalWidth, img.naturalHeight);
      },
      [url, onImageLoad],
    );

    const stopPropagation = useCallback((e: SyntheticEvent<HTMLButtonElement>) => {
      e.stopPropagation();
    }, []);

    return (
      <ImageItem className={isSelected ? 'selected' : ''} onClick={handleSelect}>
        <Checkbox
          checked={isSelected}
          onChange={handleCheckboxChange}
          className="image-checkbox"
          onClick={stopPropagation}
        />
        <img src={url} alt={fileName} loading="lazy" onLoad={handleImageLoad} />
        <ImageInfo>
          <Typography variant="body2" className="file-name">
            {fileName}
          </Typography>
          {dimensions && (
            <Typography variant="caption" className="dimensions">
              {dimensions.width} × {dimensions.height} px
            </Typography>
          )}
        </ImageInfo>
      </ImageItem>
    );
  },
);

ImageCard.displayName = 'ImageCard';
