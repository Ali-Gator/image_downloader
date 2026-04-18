import { GrabImagesResponse, ImageData, MessageActionType, PageImagesPayload } from '@types';

import {
  ContentScriptAccessDeniedError,
  isContentScriptSupported,
  sendMessageToContentScript,
} from './contentScriptUtils';
import { handleError } from './errorHandlers';
import { openPageTabAndSendImages } from './messaging';

export interface AutoGrabResult {
  images: ImageData[];
  pageUrl: string;
  sourceTabId: number;
}

export interface AutoGrabError {
  error: string;
}

export type AutoGrabOutcome = AutoGrabResult | AutoGrabError;

export function isAutoGrabError(outcome: AutoGrabOutcome | null): outcome is AutoGrabError {
  return outcome != null && 'error' in outcome;
}

/**
 * Wrapper around chrome.i18n.getMessage that works in both service worker and page contexts.
 * Avoids importing useTranslation which pulls in @sentry/browser (window-dependent).
 */
function t(key: string): string {
  try {
    return chrome.i18n.getMessage(key) || key;
  } catch {
    return key;
  }
}

/**
 * Returns a user-friendly error message for unsupported URLs.
 */
function getUnsupportedUrlError(url: string): string {
  if (
    url.includes('chrome.google.com/webstore') ||
    url.includes('microsoftedge.microsoft.com/addons')
  ) {
    return t('webstore_not_supported');
  }
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return t('internal_pages_not_supported');
  }
  if (url.startsWith('file://')) {
    return t('local_files_not_supported');
  }
  if (url.startsWith('https://chrome.google.com/')) {
    return t('webstore_not_supported');
  }
  return t('unsupported_page_type');
}

/**
 * Core grab logic: sends GRAB_IMAGES to a given tab and returns structured result or error.
 * Shared between side panel (autoGrabImages) and background (openPageTabWithImages).
 */
async function grabImagesFromTab(tab: chrome.tabs.Tab): Promise<AutoGrabOutcome | null> {
  if (!tab.id || !tab.url) return null;

  if (!isContentScriptSupported(tab.url)) {
    return { error: getUnsupportedUrlError(tab.url) };
  }

  let response: GrabImagesResponse | null;
  try {
    response = await sendMessageToContentScript<GrabImagesResponse>(
      tab.id,
      { action: MessageActionType.GRAB_IMAGES },
      10000,
    );
  } catch (error) {
    if (error instanceof ContentScriptAccessDeniedError) {
      return { error: t('page_not_accessible') };
    }
    throw error;
  }

  if (!response) {
    return { error: t('content_script_not_loaded') };
  }

  if (response.error) {
    return { error: response.details || response.error };
  }

  if (!response.images?.length) {
    return { error: t('no_images_found_detailed') };
  }

  return {
    images: response.images,
    pageUrl: response.pageUrl ?? tab.url,
    sourceTabId: tab.id,
  };
}

/**
 * Grabs images from the currently active tab.
 * Used by the side panel to auto-collect images on open.
 */
export async function autoGrabImages(): Promise<AutoGrabOutcome | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return null;
    return await grabImagesFromTab(tab);
  } catch (error) {
    handleError(error);
    return null;
  }
}

/**
 * Grabs images from the given tab and opens them in a new page.html tab.
 * Safety net for action.onClicked (fires only if popup and side panel are both inactive).
 */
export async function openPageTabWithImages(sourceTab: chrome.tabs.Tab): Promise<void> {
  const outcome = await grabImagesFromTab(sourceTab);
  if (!outcome) return;
  if (isAutoGrabError(outcome)) {
    handleError(new Error(`openPageTabWithImages: ${outcome.error}`));
    return;
  }

  await openPageTabAndSendImages({
    images: outcome.images,
    pageUrl: outcome.pageUrl,
    sourceTabId: outcome.sourceTabId,
  } satisfies PageImagesPayload);
}
