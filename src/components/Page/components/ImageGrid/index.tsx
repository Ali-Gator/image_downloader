import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { Typography } from '@mui/material';

import { ImageGridContainer, NoImagesMessage } from './styles';
import { getFileNameFromUrl } from '../../../../utils/fileUtils';
import { useTranslation } from '../../../../utils/useTranslation';
import { ImageCard } from '../ImageCard';

interface ImageGridProps {
  images: string[];
  selectedImages: string[];
  setSelectedImages: (images: string[]) => void;
  isGridView: boolean;
}

export const ImageGrid: FC<ImageGridProps> = ({
  images,
  selectedImages,
  setSelectedImages,
  isGridView,
}) => {
  const [imageDimensions, setImageDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const { t } = useTranslation();

  useEffect(() => {
    // Reset dimensions when images change
    setImageDimensions({});
  }, [images]);

  const handleImageLoad = useCallback((url: string, width: number, height: number) => {
    setImageDimensions((prev) => ({
      ...prev,
      [url]: { width, height },
    }));
  }, []);

  const handleImageSelect = useCallback(
    (url: string) => {
      if (selectedImages.includes(url)) {
        setSelectedImages(selectedImages.filter((img) => img !== url));
      } else {
        setSelectedImages([...selectedImages, url]);
      }
    },
    [selectedImages, setSelectedImages],
  );

  const noImagesMessage = useMemo(
    () => (
      <NoImagesMessage>
        <Typography variant="h6">{t('no_images_found')}</Typography>
      </NoImagesMessage>
    ),
    [t],
  );

  if (images.length === 0) {
    return noImagesMessage;
  }

  return (
    <ImageGridContainer className={isGridView ? 'grid-view' : 'list-view'}>
      {images.map((url, index) => {
        const dimensions = imageDimensions[url];
        const isSelected = selectedImages.includes(url);
        const fileName = getFileNameFromUrl(url);

        return (
          <ImageCard
            key={`${url}-${index}`}
            url={url}
            isSelected={isSelected}
            fileName={fileName}
            dimensions={dimensions}
            onSelect={handleImageSelect}
            onImageLoad={handleImageLoad}
          />
        );
      })}
    </ImageGridContainer>
  );
};
