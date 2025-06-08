import { FC } from 'react';

import { FolderField, InfoMessage, OptionsHeader, RenamePatternField, ResetButton } from '..';
import { StyledContainer } from './styles';

export const DownloadOptions: FC = () => {
  return (
    <StyledContainer elevation={2}>
      <OptionsHeader />
      <FolderField />
      <RenamePatternField />
      {/*<ConvertOptions />*/}
      <ResetButton />
      <InfoMessage />
    </StyledContainer>
  );
};
