import React, { useCallback, useEffect, useRef } from 'react';

import { RatingWidget } from '@components';
import { DownloadButton, Header, HelpText, ReportBugLink } from '@components/Popup/components';
import { useImageStore, useRatingStore } from '@store';
import {
  GrabImagesMessage,
  GrabImagesResponse,
  MessageActionType,
  PageImagesPayload,
} from '@types';
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

  const openImagesPage = useCallback(
    async (payload: PageImagesPayload) => {
      const tab = await chrome.tabs.create({
        url: 'page.html',
        active: false,
      });

      setTimeout(async () => {
        if (tab.id) {
          const success = await sendImagesToTab(tab.id, payload);
          if (!success) {
            handleError(new Error(t('failed_to_send_images')), true);
          }
        } else {
          handleError(new Error(t('invalid_tab_id')), true);
        }
      }, 500);
    },
    [t],
  );

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
            throw new Error(t('internal_pages_not_supported'));
          } else if (tab.url.startsWith('file://')) {
            throw new Error(t('local_files_not_supported'));
          } else if (tab.url.startsWith('https://chrome.google.com/')) {
            throw new Error(t('webstore_not_supported'));
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
              ' If the problem persists, the website may be blocking extensions.',
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

        const pageUrl = response.pageUrl ?? tab.url;
        if (!pageUrl) {
          throw new Error(t('tab_url_unavailable'));
        }

        openImagesPage({ images: response.images, pageUrl, sourceTabId: tab.id! });
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
