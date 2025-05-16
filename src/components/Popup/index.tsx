import React, { useCallback, useEffect, useRef } from 'react';

import { DownloadButton, Header, HelpText, ReportBugLink } from '@components/Popup/components';
import RatingWidget from '@components/RatingWidget';
import { useImageStore } from '@store';
import { ImageData } from '@types';
import {
  ConnectionName,
  handleError,
  MessageAction,
  sendImagesToTab,
  useTranslation,
  withErrorHandling,
} from '@utils';

import { ContentContainer, FeedbackRow, PopupContainer } from './styles';

export const Popup: React.FC = () => {
  const { isLoading, setIsLoading } = useImageStore();
  const { t } = useTranslation();
  const portRef = useRef<chrome.runtime.Port | null>(null);

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
    async (images: ImageData[]) => {
      const tab = await chrome.tabs.create({
        url: 'page.html',
        active: false,
      });

      setTimeout(async () => {
        if (tab.id) {
          const success = await sendImagesToTab(tab.id, images);
          if (!success) {
            handleError(new Error('Failed to send images to tab'), true, t('error_text'));
          }
        } else {
          handleError(new Error('Invalid tab ID'), true, t('error_text'));
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

        // Создаем Promise для коллбек-стиля chrome API
        return new Promise<void>((resolve, reject) => {
          // Отправляем сообщение в content-script
          chrome.tabs.sendMessage(tab.id!, { action: MessageAction.GRAB_IMAGES }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message || t('content_script_failed')));
              return;
            }

            if (!response) {
              reject(new Error(t('no_response_from_script')));
              return;
            }

            if (response.error) {
              reject(new Error(response.details || response.error));
              return;
            }

            if (!response.images || !response.images.length) {
              reject(new Error(t('no_images_found')));
              return;
            }

            openImagesPage(response.images);
            resolve();
          });
        });
      },
      setIsLoading,
      t('error_text'),
    );
  }, [openImagesPage, t, setIsLoading]);

  return (
    <PopupContainer>
      <Header title={t('popup_title')} />
      <ContentContainer>
        <DownloadButton onClick={handleGrabImages} isLoading={isLoading} />
        <HelpText text={t('help_text')} />
        <FeedbackRow>
          <RatingWidget />
          <ReportBugLink />
        </FeedbackRow>
      </ContentContainer>
    </PopupContainer>
  );
};
