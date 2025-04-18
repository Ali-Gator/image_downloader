import { FC, useEffect } from 'react';

import { Header, ImageGrid, LoadingOverlay, Toolbar } from '@components/Page/components';
import { useImageStore } from '@store';
import { setupImageListener } from '@utils';

import { PageContainer } from './styles';

export const Page: FC = () => {
  const { setImages, setIsLoading, isLoading } = useImageStore();

  useEffect(() => {
    const removeListener = setupImageListener(setImages, setIsLoading);

    return () => {
      removeListener();
    };
  }, [setImages, setIsLoading]);

  return (
    <PageContainer>
      <Header />
      <Toolbar />
      <ImageGrid />
      {isLoading && <LoadingOverlay />}
    </PageContainer>
  );
};
