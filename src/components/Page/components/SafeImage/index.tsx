import { memo } from 'react';

import ImageIcon from '@mui/icons-material/Image';
import { CircularProgress } from '@mui/material';

import { SafeImageProps } from '@types';
import { useImagePreview, useTranslation } from '@utils';

import {
  StyledImageContainer,
  StyledPlaceholder,
  StyledErrorText,
  StyledLoadingOverlay,
  StyledImage,
} from './styles';

/**
 * Safe image component that handles CORS errors by falling back to background script
 * Shows loading state while fetching and error state if both methods fail
 */
export const SafeImage = memo(({ src, alt, className }: SafeImageProps) => {
  const { src: imageSrc, isLoading, hasError, onError } = useImagePreview(src);
  const { t } = useTranslation();

  if (hasError) {
    return (
      <StyledPlaceholder className={className}>
        <ImageIcon fontSize="large" />
        <StyledErrorText component="span">{t('image_load_failed')}</StyledErrorText>
      </StyledPlaceholder>
    );
  }

  return (
    <StyledImageContainer className={className}>
      {isLoading && (
        <StyledLoadingOverlay>
          <CircularProgress size={24} />
        </StyledLoadingOverlay>
      )}
      <StyledImage
        src={imageSrc}
        alt={alt || t('image_alt_fallback')}
        loading="lazy"
        onError={onError}
        isLoading={isLoading}
      />
    </StyledImageContainer>
  );
});

SafeImage.displayName = 'SafeImage';
