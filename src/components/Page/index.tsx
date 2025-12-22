import { FC, useEffect } from 'react';

import { RatingReminderModal } from '@components';
import { Header, ImageGrid, LoadingOverlay, Toolbar } from '@components/Page/components';
import { useImageStore } from '@store';
import { setupImageListener } from '@utils';

import { PageContainer } from './styles';

export const Page: FC = () => {
  const { setImages, setIsLoading, setPageUrl, isLoading } = useImageStore();

  useEffect(() => {
    const removeListener = setupImageListener(setImages, setIsLoading, setPageUrl);

    return () => {
      removeListener();
    };
  }, [setImages, setIsLoading, setPageUrl]);

  useEffect(() => {
    const allowedOrigins = new Set([
      'https://onlineapp.pro',
      'https://onlineapp.live',
      'https://onlineapp.stream',
    ]);

    const listener = (event: MessageEvent) => {
      if (!allowedOrigins.has(event.origin)) return;
      const data = event.data as { type?: unknown; state?: unknown };
      if (!data || typeof data !== 'object') return;
      if (data.type !== 'state') return;

      const state = data.state as { visibility_status?: unknown; visibility_status_reason?: unknown };
      const visibilityStatus = state?.visibility_status;
      const visibilityReason = state?.visibility_status_reason;

      const visibilityOff =
        visibilityStatus === 'invisible' && visibilityReason === 'visibility-turned-off';

      chrome.storage.local.set({ paywallVisibilityOff: visibilityOff }).catch(() => {
        /* ignore */
      });
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  return (
    <>
      <PageContainer>
        <Header />
        <RatingReminderModal />
        <Toolbar />
        <ImageGrid />
        {isLoading && <LoadingOverlay />}
      </PageContainer>
    </>
  );
};
