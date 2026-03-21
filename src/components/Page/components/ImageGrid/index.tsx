import React, { useCallback } from 'react';

import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';

import { ImageCard } from '@components/Page/components';
import { ImageLightbox } from '@components/Page/components/ImageLightbox';
import { useImageStore } from '@store';
import { ImageData } from '@types';
import { useTranslation } from '@utils';

import { GridContainer, NoImagesMessage, VirtuosoGridList } from './styles';

const gridComponents = { List: VirtuosoGridList };

export const ImageGrid: React.FC = () => {
  const filteredImages = useImageStore((s) => s.filteredImages);
  const isGridView = useImageStore((s) => s.isGridView);
  const { t } = useTranslation();

  const itemContent = useCallback(
    (_index: number, image: ImageData) => <ImageCard image={image} />,
    [],
  );

  if (filteredImages.length === 0) {
    return <NoImagesMessage>{t('no_images_found')}</NoImagesMessage>;
  }

  return (
    <GridContainer>
      {isGridView ? (
        <VirtuosoGrid
          data={filteredImages}
          components={gridComponents}
          itemContent={itemContent}
          overscan={400}
        />
      ) : (
        <Virtuoso data={filteredImages} itemContent={itemContent} overscan={400} />
      )}
      <ImageLightbox />
    </GridContainer>
  );
};
