import { memo, useState, MouseEvent } from 'react';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Menu, MenuItem, ListItemText } from '@mui/material';

import { ResolutionSelectorProps } from '@types';
import { getQualityFromDimensions } from '@utils/imageUtils';

import { StyledResolutionButton, StyledVariantItem, StyledResolutionText } from './styles';

/**
 * Component for selecting image resolution from available variants
 */
export const ResolutionSelector = memo(({ image, onVariantSelect }: ResolutionSelectorProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Get current variant or create default one
  const currentVariantIndex = image.selectedVariantIndex || 0;
  const currentVariant =
    image.variants?.[currentVariantIndex] ||
    (() => {
      const quality = getQualityFromDimensions(image.width, image.height);
      return {
        url: image.src,
        width: image.width,
        height: image.height,
        quality,
        qualityScore: 50,
        label: `${quality.toUpperCase()} ${image.width}×${image.height}`,
        fileSize: image.fileSize,
      };
    })();

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    // Prevent click from bubbling up to parent ImageCard
    event.stopPropagation();

    // Only show dropdown if there are multiple variants
    if (image.variants && image.variants.length > 1) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleVariantSelect = (variantIndex: number, event?: MouseEvent<HTMLElement>) => {
    // Prevent click from bubbling up to parent ImageCard
    event?.stopPropagation();

    onVariantSelect?.(variantIndex);
    handleClose();
  };

  const hasMultipleVariants = image.variants && image.variants.length > 1;

  return (
    <>
      <StyledResolutionButton
        onClick={handleClick}
        quality={currentVariant.quality}
        hasDropdown={hasMultipleVariants}
      >
        <StyledResolutionText>{currentVariant.label}</StyledResolutionText>
        {hasMultipleVariants && <ArrowDropDownIcon fontSize="small" />}
      </StyledResolutionButton>

      {hasMultipleVariants && (
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          slotProps={{
            paper: {
              style: {
                maxHeight: 250,
                minWidth: 180,
                marginTop: 4,
              },
            },
          }}
        >
          {image.variants!.map((variant, index) => (
            <MenuItem
              key={index}
              selected={index === currentVariantIndex}
              onClick={(event) => handleVariantSelect(index, event)}
            >
              <StyledVariantItem>
                <ListItemText primary={variant.label} />
              </StyledVariantItem>
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
});

ResolutionSelector.displayName = 'ResolutionSelector';
