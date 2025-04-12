import React from 'react';

import { PhotoLibrary } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

import { StyledButton } from './styles';
import { useTranslation } from '../../../../utils/useTranslation';

interface DownloadButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

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
