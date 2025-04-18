import { ImageThumbnailProps } from '@types';
import { getSmartFileName } from '@utils';

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
