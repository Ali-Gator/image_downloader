import { FC, useCallback, useMemo } from 'react';

import { Typography } from '@mui/material';

import { ImageCard } from '@components/Page/components';
import { ImageGridProps, ViewMode } from '@components/Page/types';
import { useTranslation } from '@utils';

import { ImageGridContainer, NoImagesMessage } from './styles';

export const ImageGrid: FC<ImageGridProps> = ({
  images,
  selectedImages,
  setSelectedImages,
  isGridView,
}) => {
  const { t } = useTranslation();

  const handleImageSelect = useCallback(
    (url: string) => {
      const image = images.find((img) => img.src === url);
      if (!image) return;

      if (selectedImages.some((img) => img.src === url)) {
        setSelectedImages(selectedImages.filter((img) => img.src !== url));
      } else {
        setSelectedImages([...selectedImages, image]);
      }
    },
    [images, selectedImages, setSelectedImages],
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
      {images.map((image, index) => {
        const isSelected = selectedImages.some((img) => img.src === image.src);

        return (
          <ImageCard
            key={`${image.src}-${index}`}
            image={image}
            isSelected={isSelected}
            onSelect={handleImageSelect}
            viewMode={isGridView ? ViewMode.Grid : ViewMode.List}
          />
        );
      })}
    </ImageGridContainer>
  );
};
