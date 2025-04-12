import { FC, useEffect, useState } from 'react';

import { Header, ImageGrid, LoadingOverlay, Toolbar } from '@components/Page/components';
import { ImageData } from '@components/Popup/types';
import { setupImageListener, SizeFilter, SortOption, useTranslation } from '@utils';

import { PageContainer } from './styles';

export const Page: FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImages, setSelectedImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [isGridView, setIsGridView] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>(SizeFilter.ALL);
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const removeListener = setupImageListener(setImages, setIsLoading);

    return () => {
      removeListener();
    };
  }, []);

  useEffect(() => {
    setFilteredImages(images);
  }, [images]);

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedImages([...filteredImages]);
    } else {
      setSelectedImages([]);
    }
  };

  const handleDownload = () => {
    if (selectedImages.length === 0) return;

    // Download logic will be implemented here
    // TODO: Implement download functionality for selected images
  };

  return (
    <PageContainer>
      <Header
        title={t('popup_title')}
        selectedCount={selectedImages.length}
        totalCount={filteredImages.length}
        onSelectAll={handleSelectAll}
        onDownload={handleDownload}
      />

      <Toolbar
        filterText={filterText}
        setFilterText={setFilterText}
        sizeFilter={sizeFilter}
        setSizeFilter={setSizeFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
        isGridView={isGridView}
        setIsGridView={setIsGridView}
        selectedCount={selectedImages.length}
        totalCount={filteredImages.length}
      />

      <ImageGrid
        images={filteredImages}
        selectedImages={selectedImages}
        setSelectedImages={setSelectedImages}
        isGridView={isGridView}
      />

      {isLoading && <LoadingOverlay />}
    </PageContainer>
  );
};
