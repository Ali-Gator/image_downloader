import React, { useCallback, useState } from 'react';

import { DownloadButton, Header, HelpText } from '@components/Popup/components';
import { ContentContainer, PopupContainer } from '@components/Popup/styles';
import RatingWidget from '@components/RatingWidget';
import { ImageData } from '@types';
import {
  handleError,
  MessageAction,
  sendImagesToTab,
  useTranslation,
  withErrorHandling,
} from '@utils';

export const Popup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const openImagesPage = useCallback(async (images: ImageData[]) => {
    const tab = await chrome.tabs.create({
      url: 'page.html',
      active: false,
    });

    setTimeout(async () => {
      if (tab.id) {
        await sendImagesToTab(tab.id, images);
      } else {
        handleError(new Error('Invalid tab ID'), true, 'Something went wrong');
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
          throw new Error('No active tabs');
        }

        if (!tab.id) {
          throw new Error('Cannot access active tab');
        }

        // Создаем Promise для коллбек-стиля chrome API
        return new Promise<void>((resolve, reject) => {
          // Отправляем сообщение в content-script
          chrome.tabs.sendMessage(tab.id!, { action: MessageAction.GRAB_IMAGES }, (response) => {
            if (chrome.runtime.lastError) {
              reject(
                new Error(
                  chrome.runtime.lastError.message || 'Content script communication failed',
                ),
              );
              return;
            }

            if (!response) {
              reject(new Error('No response from content script'));
              return;
            }

            if (response.error) {
              reject(new Error(response.details || response.error));
              return;
            }

            if (!response.images || !response.images.length) {
              reject(new Error('No images found'));
              return;
            }

            openImagesPage(response.images);
            resolve();
          });
        });
      },
      setIsLoading,
      'Could not retrieve images from the page',
    );
  }, [openImagesPage]);

  return (
    <PopupContainer>
      <Header title={t('popup_title')} />
      <ContentContainer>
        <DownloadButton onClick={handleGrabImages} isLoading={isLoading} />
        <HelpText text={t('help_text')} />
        <RatingWidget />
      </ContentContainer>
    </PopupContainer>
  );
};
