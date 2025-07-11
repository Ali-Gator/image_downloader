import React, { useCallback, useEffect, useRef } from 'react';

import { RatingWidget } from '@components';
import { DownloadButton, Header, HelpText, ReportBugLink } from '@components/Popup/components';
import { useImageStore, useRatingStore } from '@store';
import { GrabImagesMessage, GrabImagesResponse, ImageData, MessageActionType } from '@types';
import {
  ConnectionName,
  handleError,
  isContentScriptSupported,
  sendImagesToTab,
  sendMessageToContentScript,
  useTranslation,
  withErrorHandling,
} from '@utils';

import { ContentContainer, FeedbackRow, PopupContainer } from './styles';

export const Popup: React.FC = () => {
  const { hasRatedApp, loadRatingFromStorage } = useRatingStore();
  const { isLoading, setIsLoading } = useImageStore();
  const { t } = useTranslation();
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    loadRatingFromStorage();
  }, [loadRatingFromStorage]);

  // Establish connection with background script when popup opens
  // This helps background script track when popup is closed
  useEffect(() => {
    // Connect to background script
    portRef.current = chrome.runtime.connect({ name: ConnectionName.POPUP });

    // Clean up connection when popup is closed
    return () => {
      if (portRef.current) {
        portRef.current.disconnect();
      }
    };
  }, []);

  const openImagesPage = useCallback(async (images: ImageData[]) => {
    const tab = await chrome.tabs.create({
      url: 'page.html',
      active: false,
    });

    setTimeout(async () => {
      if (tab.id) {
        const success = await sendImagesToTab(tab.id, images);
        if (!success) {
          handleError(new Error('Failed to send images to tab. Retry one more time'), true);
        }
      } else {
        handleError(new Error('Invalid tab ID. Retry one more time'), true);
      }
    }, 500);
  }, []);

  const handleGrabImages = useCallback(async () => {
    await withErrorHandling(
      async () => {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab) {
          throw new Error(t('no_active_tabs'));
        }

        if (!tab.id) {
          throw new Error(t('cannot_access_tab'));
        }

        // Check if tab URL is supported for content scripts
        if (!tab.url) {
          throw new Error(t('tab_url_unavailable'));
        }

        if (!isContentScriptSupported(tab.url)) {
          if (
            tab.url.includes('chrome.google.com/webstore') ||
            tab.url.includes('microsoftedge.microsoft.com/addons')
          ) {
            throw new Error(t('webstore_not_supported'));
          } else if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            throw new Error('Extension cannot access Chrome internal pages');
          } else if (tab.url.startsWith('file://')) {
            throw new Error(
              'Extension cannot access local files. Upload files to a website first.',
            );
          } else if (tab.url.startsWith('https://chrome.google.com/')) {
            throw new Error('Chrome Web Store pages are not supported');
          } else {
            throw new Error(
              t('unsupported_page_type') +
                ' - Try refreshing the page or visiting a different website.',
            );
          }
        }

        // Try to send message using safe wrapper
        const message: GrabImagesMessage = { action: MessageActionType.GRAB_IMAGES };
        const response = await sendMessageToContentScript<GrabImagesResponse>(
          tab.id!,
          message,
          10000,
        );

        if (!response) {
          throw new Error(
            t('content_script_not_loaded') +
              ' Please refresh the page and try again. If the problem persists, the website may be blocking extensions.',
          );
        }

        if (response.error) {
          throw new Error(response.details || response.error);
        }

        if (!response.images || !response.images.length) {
          throw new Error(
            t('no_images_found') +
              ' This could be because: 1) The page has no images, 2) Images are too small (less than 10px), 3) Images are loaded dynamically. Try scrolling down to load more images, then try again.',
          );
        }

        openImagesPage(response.images);
      },
      setIsLoading,
      '',
    );
  }, [openImagesPage, t, setIsLoading]);

  return (
    <PopupContainer>
      <Header title={t('popup_title')} />
      <ContentContainer>
        <DownloadButton onClick={handleGrabImages} isLoading={isLoading} />
        <HelpText text={t('help_text')} />
        <FeedbackRow hasRatedApp={hasRatedApp}>
          <RatingWidget />
          <ReportBugLink />
        </FeedbackRow>
      </ContentContainer>
    </PopupContainer>
  );
};
