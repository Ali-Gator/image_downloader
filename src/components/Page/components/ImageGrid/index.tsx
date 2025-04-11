import { FC, useEffect, useState } from 'react';

import { Checkbox, Typography } from '@mui/material';

import { ImageGridContainer, ImageInfo, ImageItem, NoImagesMessage } from './styles';
import { getFileNameFromUrl } from '../../../../utils/fileUtils';

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

  useEffect(() => {
    // Reset dimensions when images change
    setImageDimensions({});
  }, [images]);

  const handleImageLoad = (url: string, width: number, height: number) => {
    setImageDimensions((prev) => ({
      ...prev,
      [url]: { width, height },
    }));
  };

  const handleImageSelect = (url: string) => {
    if (selectedImages.includes(url)) {
      setSelectedImages(selectedImages.filter((img) => img !== url));
    } else {
      setSelectedImages([...selectedImages, url]);
    }
  };

  if (images.length === 0) {
    return (
      <NoImagesMessage>
        <Typography variant="h6">No images found</Typography>
      </NoImagesMessage>
    );
  }

  return (
    <ImageGridContainer className={isGridView ? 'grid-view' : 'list-view'}>
      {images.map((url, index) => {
        const dimensions = imageDimensions[url];
        const isSelected = selectedImages.includes(url);
        const fileName = getFileNameFromUrl(url);

        return (
          <ImageItem key={`${url}-${index}`} className={isSelected ? 'selected' : ''}>
            <Checkbox
              checked={isSelected}
              onChange={() => handleImageSelect(url)}
              className="image-checkbox"
            />
            <img
              src={url}
              alt={fileName}
              loading="lazy"
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                handleImageLoad(url, img.naturalWidth, img.naturalHeight);
              }}
            />
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
      })}
    </ImageGridContainer>
  );
};
