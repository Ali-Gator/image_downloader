import React, { useCallback } from 'react';

import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';

import { ImageCard } from '@components/Page/components';
import { ImageLightbox } from '@components/Page/components/ImageLightbox';
import { useImageStore, useSettingsStore } from '@store';
import { ImageData } from '@types';
import { CARD_SIZE_CONFIG, CardSize, useTranslation } from '@utils';
import { isSidePanelContext } from '@utils/sidePanelUtils';

import { GridContainer, NoImagesMessage, VirtuosoGridList } from './styles';

const defaultGridComponents = { List: VirtuosoGridList };

export const ImageGrid: React.FC = () => {
  const filteredImages = useImageStore((s) => s.filteredImages);
  const isGridView = useImageStore((s) => s.isGridView);
  const cardSize = useSettingsStore((s) => s.cardSize);
  const { t } = useTranslation();

  const inSidePanel = isSidePanelContext();
  const effectiveCardSize = inSidePanel ? CardSize.MEDIUM : cardSize;
  const minColWidth = CARD_SIZE_CONFIG[effectiveCardSize].grid.minColWidth;

  const itemContent = useCallback(
    (_index: number, image: ImageData) => <ImageCard image={image} />,
    [],
  );

  if (filteredImages.length === 0) {
    return <NoImagesMessage>{t('no_images_found')}</NoImagesMessage>;
  }

  return (
    <GridContainer
      style={
        !inSidePanel
          ? ({ '--grid-min-col-width': `${minColWidth}px` } as React.CSSProperties)
          : undefined
      }
    >
      {isGridView ? (
        <VirtuosoGrid
          key={effectiveCardSize}
          data={filteredImages}
          components={defaultGridComponents}
          itemContent={itemContent}
          overscan={400}
        />
      ) : (
        <Virtuoso
          key={effectiveCardSize}
          data={filteredImages}
          itemContent={itemContent}
          overscan={400}
        />
      )}
      <ImageLightbox />
    </GridContainer>
  );
};
