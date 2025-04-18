import React from 'react';

import { getSmartFileName } from '@utils';
import { ImageThumbnailProps } from '@components/Page/types';
import { StyledImageContainer } from './styles';

export const ImageThumbnail = ({ image, mode = 'grid' }: ImageThumbnailProps) => {
  const { src, alt } = image;
  const fileName = getSmartFileName(image);

  return (
    <StyledImageContainer className="image-container" mode={mode}>
      <img src={src} alt={alt || fileName} loading="lazy" />
    </StyledImageContainer>
  );
}; 