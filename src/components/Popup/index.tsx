import React, { useState } from 'react';

import { DownloadButton, Header, HelpText } from './components';
import { ContentContainer, PopupContainer } from './styles';
import { handleError } from '../../utils/errorHandlers';
import { useTranslation } from '../../utils/useTranslation';
import RatingWidget from '../Rating/RatingWidget';

export const Popup: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const grabImages = () => {
    const images = document.querySelectorAll('img');
    return Array.from(images).map((image) => image.src);
  };

  const openImagesPage = async (urls: string[]) => {
    const tab = await chrome.tabs.create({
      url: 'page.html',
      active: false,
    });

    setTimeout(async () => {
      try {
        const response = await chrome.tabs.sendMessage(tab.id!, urls);
        if (response === 'OK') {
          await chrome.tabs.update(tab.id!, { active: true });
        } else {
          handleError(new Error('Failed to confirm images received'), true, 'Something went wrong');
        }
      } catch (error) {
        handleError(error, true, 'Something went wrong');
      }
    }, 500);
  };

  const onResult = (frames: chrome.scripting.InjectionResult[]) => {
    if (!frames || !frames.length) {
      handleError(
        new Error('No frames returned from injection'),
        true,
        'Could not retrieve images from specified page',
      );
      return;
    }

    const imageUrls = frames.map((frame) => frame.result).flat();
    openImagesPage(imageUrls);
  };

  const handleGrabImages = async () => {
    setIsLoading(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        handleError(new Error('No active tabs'), true, 'There are no active tabs');
        return;
      }

      if (!tab.id) {
        handleError(new Error('Cannot access active tab'), true, 'Could not access the active tab');
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id, allFrames: true },
          func: grabImages,
        },
        onResult,
      );
    } catch (error) {
      handleError(error, true, 'Could not retrieve images from the page');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PopupContainer>
      <Header title={t('popup_title')} />
      <ContentContainer>
        <DownloadButton onClick={handleGrabImages} isLoading={isLoading} text={t('download_btn')} />
        <HelpText text={t('help_text')} />
        <RatingWidget />
      </ContentContainer>
    </PopupContainer>
  );
};
