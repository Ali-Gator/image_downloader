import React from 'react';
import { Tooltip } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { getFriendlyUrlDisplay } from '@utils';
import { ImageUrlProps } from '@components/Page/types';

import { NonClickableUrl, UrlContainer, UrlLink, UrlText } from './styles';

export const ImageUrl = ({ image }: ImageUrlProps) => {
  const { src } = image;
  const urlDisplay = getFriendlyUrlDisplay(src);
  const canOpenExternally = !src.startsWith('data:') && !src.startsWith('blob:');

  return (
    <UrlContainer className="url-container">
      {canOpenExternally ? (
        <Tooltip title={urlDisplay.tooltip}>
          <UrlLink href={src} className="image-url" target="_blank" rel="noopener noreferrer">
            <OpenInNewIcon className="url-icon" fontSize="small" />
            <UrlText className="url-text">{urlDisplay.text}</UrlText>
          </UrlLink>
        </Tooltip>
      ) : (
        <Tooltip title={urlDisplay.tooltip}>
          <NonClickableUrl className="image-url">{urlDisplay.text}</NonClickableUrl>
        </Tooltip>
      )}
    </UrlContainer>
  );
}; 