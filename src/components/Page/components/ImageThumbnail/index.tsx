import { memo, useCallback, useEffect, useState } from 'react';

import { ImageThumbnailProps } from '@types';
import { CORS_SITE_CONFIG, MessageAction } from '@utils/constants';

import { StyledErrorContainer, StyledImageContainer, StyledLoadingOverlay } from './styles';

export const ImageThumbnail = memo(({ image, mode = 'grid' }: ImageThumbnailProps) => {
  const { src, alt, filename } = image;
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Function to determine if URL needs proxy based on known CORS issues
  const needsProxy = useCallback((url: string | undefined): boolean => {
    if (!url) return false;

    // Skip special URL schemes that don't need proxying
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('chrome-extension:')) {
      return false;
    }

    // Check against our registry of known problematic sites
    for (const config of Object.values(CORS_SITE_CONFIG)) {
      for (const pattern of config.patterns) {
        if (url.includes(pattern)) {
          return true;
        }
      }
    }

    return false;
  }, []);

  // Use the background script to load images that might have CORS restrictions
  useEffect(() => {
    // Reset states when src changes
    if (src !== imgSrc && !src?.startsWith('data:') && !isLoading) {
      setImgSrc(src);
      setHasError(false);
      setRetryCount(0);
    }

    // Determine if the URL needs proxying
    const shouldProxy = needsProxy(src);

    // Don't proxy data: URLs or blob: URLs (already checked in needsProxy)
    // Also limit retry attempts
    if (shouldProxy && retryCount < 2) {
      let isMounted = true;
      setIsLoading(true);

      // Request the image via background script
      chrome.runtime.sendMessage(
        {
          msg: MessageAction.FETCH_IMAGE,
          url: src,
          // Pass the current page URL as referrer if possible
          referrer: window.location.href,
        },
        (response: { dataUrl?: string; error?: boolean }) => {
          // Only update state if component is still mounted
          if (!isMounted) return;

          setIsLoading(false);
          if (response?.dataUrl) {
            setImgSrc(response.dataUrl);
            setHasError(false);
          } else {
            // If this was already a retry, show the error
            if (retryCount > 0) {
              setHasError(true);
            } else {
              // Otherwise increment retry count, which will trigger another attempt
              setRetryCount((prev) => prev + 1);
            }
          }
        },
      );

      // Cleanup function
      return () => {
        isMounted = false;
      };
    } else if (shouldProxy && retryCount >= 2) {
      setHasError(true);
    }
  }, [src, retryCount, needsProxy, imgSrc, isLoading]);

  // Handle image load errors
  const handleImageError = () => {
    // Only handle errors for non-proxied images
    // For proxied images, errors are handled in the useEffect
    if (!needsProxy(imgSrc) && !imgSrc?.startsWith('data:')) {
      setHasError(true);
    }
  };

  // Retry loading the image
  const handleRetry = () => {
    setHasError(false);
    setRetryCount(0);
    setImgSrc(src); // Reset to original source to trigger the useEffect
  };

  return (
    <StyledImageContainer className="image-container" mode={mode}>
      {hasError ? (
        <StyledErrorContainer onClick={handleRetry}>
          <span>⚠️</span>
          <span>Failed to load</span>
          <button>Retry</button>
        </StyledErrorContainer>
      ) : (
        <>
          <img
            src={imgSrc}
            alt={alt || filename}
            loading="lazy"
            className={isLoading ? 'loading' : ''}
            onError={handleImageError}
          />
          {isLoading && <StyledLoadingOverlay>Loading...</StyledLoadingOverlay>}
        </>
      )}
    </StyledImageContainer>
  );
});

ImageThumbnail.displayName = 'ImageThumbnail';
