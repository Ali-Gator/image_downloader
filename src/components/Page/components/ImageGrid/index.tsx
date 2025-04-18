import React from 'react';

import { ImageCard } from '@components/Page/components';
import { useImageStore } from '@store';
import { useTranslation } from '@utils';

import { GridContainer, ImageGridContainer, NoImagesMessage } from './styles';

export const ImageGrid: React.FC = () => {
  const { filteredImages, isGridView } = useImageStore();
  const { t } = useTranslation();

  if (filteredImages.length === 0) {
    return <NoImagesMessage>{t('no_images_found')}</NoImagesMessage>;
  }

  return (
    <GridContainer>
      <ImageGridContainer className={isGridView ? 'grid-view' : 'list-view'}>
        {filteredImages.map((image) => (
          <ImageCard key={image.id} image={image} />
        ))}
      </ImageGridContainer>
    </GridContainer>
  );
};
