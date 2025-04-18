import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Tooltip } from '@mui/material';

import { ImageUrlProps } from '@types';
import { getFriendlyUrlDisplay } from '@utils';

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
