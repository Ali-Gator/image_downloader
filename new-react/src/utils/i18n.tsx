import messages from '../../public/_locales/en/messages.json';

type Messages = typeof messages;

export const getI18nText = (text: keyof Messages, placeholders?: string | string[]): string => {
  if (chrome.i18n == null) {
    return getI18nTextEmulation(text, placeholders);
  }
  return chrome.i18n.getMessage(text, placeholders);
};

export const getI18nTextEmulation = (
  text: keyof Messages,
  placeholders?: string | string[],
): string => {
  return messages[text].message ?? getPlaceholder(placeholders);
};

export const getPlaceholder = (placeholders?: string | string[]): string => {
  if (Array.isArray(placeholders)) {
    return placeholders[0] ?? 'Placeholder';
  }
  return placeholders ?? 'Placeholder';
};
