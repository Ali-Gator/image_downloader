import { FC } from 'react';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import { FieldContainer } from '../styles';
import { StyledTextField, StyledTypography } from './styles';

export const SubfolderField: FC = () => {
  const { t } = useTranslation();
  const { subfolderName, setSubfolderName } = useSettingsStore();

  return (
    <FieldContainer>
      <StyledTypography variant="body1">{t('subfolder_name')}:</StyledTypography>
      <StyledTextField
        fullWidth
        size="small"
        variant="outlined"
        value={subfolderName}
        onChange={(e) => setSubfolderName(e.target.value)}
      />
    </FieldContainer>
  );
};
