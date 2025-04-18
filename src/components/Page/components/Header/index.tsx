import { ChangeEvent, FC } from 'react';

import DownloadIcon from '@mui/icons-material/Download';
import { Button, Checkbox, Typography } from '@mui/material';

import { useImageStore } from '@store';
import { useTranslation } from '@utils';

import {
  ControlsContainer,
  HeaderContainer,
  LogoImage,
  SelectAllContainer,
  TitleContainer,
} from './styles';

export const Header: FC = () => {
  const { t } = useTranslation();
  const { filteredImages, selectedImages, selectAll, deselectAll } = useImageStore();

  const handleSelectAllChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      selectAll();
    } else {
      deselectAll();
    }
  };

  const handleDownload = () => {
    if (selectedImages.length === 0) return;

    // Download logic will be implemented here
    // TODO: Implement download functionality for selected images
  };

  const selectedCount = selectedImages.length;
  const totalCount = filteredImages.length;
  const isAllSelected = selectedCount > 0 && selectedCount === totalCount;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  return (
    <HeaderContainer>
      <TitleContainer>
        <LogoImage src="/img/logo-64.png" alt="Logo" />
        <Typography variant="h6">{t('popup_title')}</Typography>
      </TitleContainer>

      <ControlsContainer>
        <SelectAllContainer>
          <Checkbox
            id="selectAll"
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={handleSelectAllChange}
          />
          <label htmlFor="selectAll">Select All</label>
        </SelectAllContainer>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={selectedCount === 0}
        >
          {t('download_btn')}
        </Button>
      </ControlsContainer>
    </HeaderContainer>
  );
};
