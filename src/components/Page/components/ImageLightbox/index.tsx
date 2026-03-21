import { FC, MouseEvent, useCallback, useEffect, useRef } from 'react';

import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { CircularProgress } from '@mui/material';
import { createPortal } from 'react-dom';

import { useImageStore } from '@store';
import { formatFileSize, useTranslation } from '@utils';
import { useEnhanceSingleImage, useImageOperations } from '@utils/imageOperations';
import { getFileExtension, getQualityFromDimensions } from '@utils/imageUtils';

import {
  ActionBar,
  ActionIconButton,
  Backdrop,
  CloseButton,
  Counter,
  FileName,
  LightboxImage,
  MetadataBar,
  MetadataLine,
  MetadataRow,
  NavButton,
  ResolutionToggle,
  TogglePill,
} from './styles';
import { QualityBadge } from '../ImageInfo/styles';

export const ImageLightbox: FC = () => {
  const { t } = useTranslation();
  const lightboxImageId = useImageStore((s) => s.lightboxImageId);
  const setLightboxImageId = useImageStore((s) => s.setLightboxImageId);
  const filteredImages = useImageStore((s) => s.filteredImages);
  const sourceTabId = useImageStore((s) => s.sourceTabId);
  const toggleImageSource = useImageStore((s) => s.toggleImageSource);
  const isShowingOriginal = useImageStore(
    (s) => lightboxImageId != null && s.imageSourceOverrides[lightboxImageId] === 'original',
  );
  const getEffectiveImage = useImageStore((s) => s.getEffectiveImage);
  const { handleEnhanceSingle, isEnhancingImage } = useEnhanceSingleImage();

  const currentIndex = filteredImages.findIndex((img) => img.id === lightboxImageId);
  const image = currentIndex >= 0 ? filteredImages[currentIndex] : null;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < filteredImages.length - 1;

  const effectiveImg = image ? getEffectiveImage(image) : null;
  const { handleDownload } = useImageOperations(
    effectiveImg?.src ?? '',
    image?.filename ?? '',
    image?.id,
  );

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

  if (!image || !effectiveImg) return null;

  const hasToggle = image.enhanced && image.originalSrc;
  const canEnhance = !!sourceTabId && !!image.linkedPageUrl && !image.enhanced;
  const isEnhancing = isEnhancingImage(image.id);

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) setLightboxImageId(null);
  };

  const hasDimensions = effectiveImg.width > 0 && effectiveImg.height > 0;
  const dimensionsDisplay = hasDimensions
    ? `${effectiveImg.width}×${effectiveImg.height}`
    : t('dimensions_unknown');
  const formattedFileSize = image.fileSize ? formatFileSize(image.fileSize) : null;
  const fileExtension = getFileExtension(image.filename);
  const qualityLevel = getQualityFromDimensions(effectiveImg.width, effectiveImg.height);
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
        src={effectiveImg.src}
        alt={image.alt || image.filename}
        data-testid="lightbox-image"
      />

      <ActionBar data-testid="lightbox-actions">
        {canEnhance && (
          <ActionIconButton
            onClick={() => handleEnhanceSingle(image)}
            aria-label={t('enhance_image_tooltip')}
            data-testid="lightbox-enhance"
          >
            {isEnhancing ? <CircularProgress size={18} color="inherit" /> : <AutoFixHighIcon />}
          </ActionIconButton>
        )}
        <ActionIconButton
          onClick={handleDownload}
          aria-label={t('download_image_tooltip')}
          data-testid="lightbox-download"
        >
          <FileDownloadIcon />
        </ActionIconButton>
      </ActionBar>

      <MetadataBar data-testid="lightbox-metadata">
        <FileName>{image.filename}</FileName>
        {hasToggle && (
          <ResolutionToggle data-testid="resolution-toggle">
            <TogglePill
              active={isShowingOriginal}
              onClick={() => {
                if (!isShowingOriginal) toggleImageSource(image.id);
              }}
              data-testid="toggle-original"
            >
              {t('original_label')} {image.originalWidth}×{image.originalHeight}
            </TogglePill>
            <TogglePill
              active={!isShowingOriginal}
              onClick={() => {
                if (isShowingOriginal) toggleImageSource(image.id);
              }}
              data-testid="toggle-enhanced"
            >
              {t('enhanced_label')} {image.width}×{image.height}
            </TogglePill>
          </ResolutionToggle>
        )}
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
