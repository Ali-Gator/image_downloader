import { FC } from 'react';

import {
  ConvertOptions,
  InfoMessage,
  OptionsHeader,
  RenamePatternField,
  ResetButton,
  SubfolderField,
} from '..';
import { StyledContainer } from './styles';

export const DownloadOptions: FC = () => {
  return (
    <StyledContainer elevation={2}>
      <OptionsHeader />
      <SubfolderField />
      <RenamePatternField />
      <ConvertOptions />
      <ResetButton />
      <InfoMessage />
    </StyledContainer>
  );
};
