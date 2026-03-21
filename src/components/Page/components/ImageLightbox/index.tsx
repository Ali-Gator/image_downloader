import { FC, MouseEvent, useCallback, useEffect, useRef } from 'react';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import { createPortal } from 'react-dom';

import { useImageStore } from '@store';
import { formatFileSize, useTranslation } from '@utils';
import { getFileExtension, getQualityFromDimensions } from '@utils/imageUtils';

import {
  Backdrop,
  CloseButton,
  Counter,
  FileName,
  LightboxImage,
  MetadataBar,
  MetadataLine,
  MetadataRow,
  NavButton,
} from './styles';
import { QualityBadge } from '../ImageInfo/styles';

export const ImageLightbox: FC = () => {
  const { t } = useTranslation();
  const lightboxImageId = useImageStore((s) => s.lightboxImageId);
  const setLightboxImageId = useImageStore((s) => s.setLightboxImageId);
  const filteredImages = useImageStore((s) => s.filteredImages);

  const currentIndex = filteredImages.findIndex((img) => img.id === lightboxImageId);
  const image = currentIndex >= 0 ? filteredImages[currentIndex] : null;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < filteredImages.length - 1;

  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const filteredImagesRef = useRef(filteredImages);
  useEffect(() => {
    filteredImagesRef.current = filteredImages;
  }, [filteredImages]);

  const goToPrev = useCallback(() => {
    const idx = currentIndexRef.current;
    if (idx > 0) setLightboxImageId(filteredImagesRef.current[idx - 1].id);
  }, [setLightboxImageId]);

  const goToNext = useCallback(() => {
    const idx = currentIndexRef.current;
    const imgs = filteredImagesRef.current;
    if (idx < imgs.length - 1) setLightboxImageId(imgs[idx + 1].id);
  }, [setLightboxImageId]);

  useEffect(() => {
    if (!lightboxImageId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImageId(null);
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImageId, setLightboxImageId, goToPrev, goToNext]);

  if (!image) return null;

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) setLightboxImageId(null);
  };

  const hasDimensions = image.width > 0 && image.height > 0;
  const dimensionsDisplay = hasDimensions
    ? `${image.width}×${image.height}`
    : t('dimensions_unknown');
  const formattedFileSize = image.fileSize ? formatFileSize(image.fileSize) : null;
  const fileExtension = getFileExtension(image.filename);
  const qualityLevel = getQualityFromDimensions(image.width, image.height);
  const qualityLabel = hasDimensions ? qualityLevel.toUpperCase() : '?';

  return createPortal(
    <Backdrop onClick={handleBackdropClick} data-testid="lightbox-backdrop">
      <CloseButton
        onClick={() => setLightboxImageId(null)}
        aria-label={t('close_lightbox')}
        data-testid="lightbox-close"
      >
        <CloseIcon />
      </CloseButton>

      {hasPrev && (
        <NavButton
          position="left"
          onClick={goToPrev}
          aria-label={t('prev_image')}
          data-testid="lightbox-prev"
        >
          <ChevronLeftIcon />
        </NavButton>
      )}
      {hasNext && (
        <NavButton
          position="right"
          onClick={goToNext}
          aria-label={t('next_image')}
          data-testid="lightbox-next"
        >
          <ChevronRightIcon />
        </NavButton>
      )}

      <LightboxImage
        src={image.src}
        alt={image.alt || image.filename}
        data-testid="lightbox-image"
      />

      <MetadataBar data-testid="lightbox-metadata">
        <FileName>{image.filename}</FileName>
        <MetadataLine>
          {dimensionsDisplay}
          {formattedFileSize && ` · ${formattedFileSize}`}
          {fileExtension && ` · ${fileExtension}`}
        </MetadataLine>
        <MetadataRow>
          <QualityBadge quality={qualityLevel}>{qualityLabel}</QualityBadge>
          <Counter data-testid="lightbox-counter">
            {currentIndex + 1} / {filteredImages.length}
          </Counter>
        </MetadataRow>
      </MetadataBar>
    </Backdrop>,
    document.body,
  );
};
