import { FC } from 'react';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import { FieldContainer } from '../styles';
import { StyledTextField, StyledTypography } from './styles';

export const RenamePatternField: FC = () => {
  const { t } = useTranslation();
  const { renamePattern, setRenamePattern } = useSettingsStore();

  return (
    <FieldContainer>
      <StyledTypography variant="body1">{t('rename_files')}:</StyledTypography>
      <StyledTextField
        fullWidth
        size="small"
        variant="outlined"
        value={renamePattern}
        onChange={(e) => setRenamePattern(e.target.value)}
      />
    </FieldContainer>
  );
};
