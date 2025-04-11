import { FC, useEffect, useState } from 'react';

import { Header, ImageGrid, LoadingOverlay, Toolbar } from './components';
import { PageContainer } from './styles';

export const Page: FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [filteredImages, setFilteredImages] = useState<string[]>([]);
  const [isGridView, setIsGridView] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [sortOption, setSortOption] = useState('default');
  const [isLoading, setIsLoading] = useState(true);

  // Listen for messages from popup
  useEffect(() => {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (Array.isArray(request) && request.length > 0) {
        setImages(request.filter((url) => typeof url === 'string'));
        setIsLoading(false);
        sendResponse('OK');
        return true;
      }
      return false;
    });
  }, []);

  // Initialize filtered images whenever the images array changes
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
        title="Image Downloader"
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
