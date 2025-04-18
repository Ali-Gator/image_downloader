import { memo } from 'react';

import { ImageThumbnailProps } from '@types';

import { StyledImageContainer } from './styles';

export const ImageThumbnail = memo(({ image, mode = 'grid' }: ImageThumbnailProps) => {
  const { src, alt, filename } = image;

  return (
    <StyledImageContainer className="image-container" mode={mode}>
      <img src={src} alt={alt || filename} loading="lazy" />
    </StyledImageContainer>
  );
});

ImageThumbnail.displayName = 'ImageThumbnail';
