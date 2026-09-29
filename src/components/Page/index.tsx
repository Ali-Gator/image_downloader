import { FC, useEffect } from 'react';

import { useSnackbar } from 'notistack';

import { RatingReminderModal, RatingWidget } from '@components';
import {
  Header,
  ImageGrid,
  LoadingOverlay,
  Onboarding,
  OptionsPrompt,
  Toolbar,
} from '@components/Page/components';
import { useImageStore, useRatingStore, useSettingsStore } from '@store';
import { setupImageListener } from '@utils';
import { autoGrabImages, isAutoGrabError } from '@utils/autoGrabImages';
import { isSidePanelContext } from '@utils/sidePanelUtils';

import { PageContainer, StickyRatingBar } from './styles';

export const Page: FC = () => {
  const {
    setImages,
    setIsLoading,
    setPageUrl,
    setSourceTabId,
    setSelectedImages,
    isLoading,
    setIsGridView,
  } = useImageStore();
  const { defaultGridView } = useSettingsStore();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setIsGridView(defaultGridView);
  }, [defaultGridView, setIsGridView]);

  useEffect(() => {
    if (isSidePanelContext()) {
      // Side panel: auto-grab images from the active tab
      let cancelled = false;
      setIsLoading(true);
      autoGrabImages()
        .then((outcome) => {
          if (cancelled) return;
          if (isAutoGrabError(outcome)) {
            enqueueSnackbar(outcome.error, { variant: 'warning' });
          } else if (outcome) {
            setImages(outcome.images);
            setPageUrl(outcome.pageUrl);
            setSourceTabId(outcome.sourceTabId);
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    // page.html: wait for images from background
    const removeListener = setupImageListener(
      setImages,
      setIsLoading,
      setPageUrl,
      setSourceTabId,
      setSelectedImages,
    );
    return () => {
      removeListener();
    };
  }, [setImages, setIsLoading, setPageUrl, setSourceTabId, setSelectedImages, enqueueSnackbar]);

  const hasRatedApp = useRatingStore((s) => s.hasRatedApp);

  return (
    <>
      <PageContainer>
        <Header />
        <RatingReminderModal />
        <Onboarding />
        <OptionsPrompt />
        <Toolbar />
        <ImageGrid />
        {isLoading && <LoadingOverlay />}
        {!hasRatedApp && (
          <StickyRatingBar>
            <RatingWidget />
          </StickyRatingBar>
        )}
      </PageContainer>
    </>
  );
};
