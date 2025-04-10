// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.action === 'grabImages') {
    const images = Array.from(document.getElementsByTagName('img'))
      .map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight
      }));

    sendResponse({ images });
  }
});
