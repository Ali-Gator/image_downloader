import { ChangeEvent, FC } from 'react';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import { FieldContainer } from '../styles';
import { StyledTextField, StyledTypography } from './styles';

export const FolderField: FC = () => {
  const { t } = useTranslation();
  const { folderName, setFolderName } = useSettingsStore();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFolderName(e.target.value);
  };

  return (
    <FieldContainer>
      <StyledTypography variant="body1">{t('folder_name')}:</StyledTypography>
      <StyledTextField
        fullWidth
        size="small"
        variant="outlined"
        value={folderName}
        placeholder="eg. images"
        onChange={handleChange}
      />
    </FieldContainer>
  );
};
