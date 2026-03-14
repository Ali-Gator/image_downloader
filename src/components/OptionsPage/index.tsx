import { FC } from 'react';

import { useTranslation } from '@utils';

import { DownloadOptions, OptionsOnboarding } from './components';
import { ContentBox, StyledContainer, StyledTitle } from './styles';

export const OptionsPage: FC = () => {
  const { t } = useTranslation();

  return (
    <StyledContainer>
      <StyledTitle component="h1">{t('options_title')}</StyledTitle>

      <ContentBox>
        <DownloadOptions />
      </ContentBox>

      <OptionsOnboarding />
    </StyledContainer>
  );
};
