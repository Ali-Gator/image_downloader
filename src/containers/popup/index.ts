/**
 * Minimal auto-grab popup — no UI.
 * Opens when side panel is disabled; grabs images, shows alert() on error,
 * opens page.html on success, then closes itself.
 */
import { autoGrabImages } from '@utils/autoGrabImages';
import { openPageTabAndSendImages } from '@utils/messaging';

(async () => {
  const outcome = await autoGrabImages();

  if (!outcome) {
    window.close();
    return;
  }

  if ('error' in outcome) {
    alert(outcome.error);
    window.close();
    return;
  }

  await openPageTabAndSendImages({
    images: outcome.images,
    pageUrl: outcome.pageUrl,
    sourceTabId: outcome.sourceTabId,
  });
  window.close();
})();
