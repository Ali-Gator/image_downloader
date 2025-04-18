import React from 'react';

import { PhotoLibrary } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

import { PopupDownloadButtonProps } from '@types';
import { useTranslation } from '@utils';

import { StyledButton } from './styles';

const DownloadButton: React.FC<PopupDownloadButtonProps> = ({ onClick, isLoading }) => {
  const { t } = useTranslation();

  return (
    <StyledButton
      id="grabBtn"
      onClick={onClick}
      disabled={isLoading}
      variant="contained"
      color="secondary"
      fullWidth
    >
      {isLoading ? (
        <CircularProgress size={20} color="inherit" />
      ) : (
        <>
          <PhotoLibrary />
          <span id="downloadBtnText">{t('download_btn')}</span>
        </>
      )}
    </StyledButton>
  );
};

export default DownloadButton;
