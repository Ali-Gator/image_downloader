import React from 'react';

import { PhotoLibrary } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

import { useTranslation } from '@utils';

import { StyledButton } from './styles';
import { DownloadButtonProps } from '../../types';

const DownloadButton: React.FC<DownloadButtonProps> = ({ onClick, isLoading }) => {
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
