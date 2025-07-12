import { memo, useState, MouseEvent } from 'react';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Menu, MenuItem, ListItemText } from '@mui/material';

import { useImageStore } from '@store';
import { ResolutionSelectorProps } from '@types';
import { getQualityFromDimensions } from '@utils/imageUtils';

import { StyledResolutionButton, StyledVariantItem, StyledResolutionText } from './styles';

/**
 * Component for selecting image resolution from available variants
 */
export const ResolutionSelector = memo(({ image, onVariantSelect }: ResolutionSelectorProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const updateImageVariant = useImageStore((state) => state.updateImageVariant);

  // Check if we have meaningful variants (different sizes, not just different URLs)
  const hasRealVariants = () => {
    if (!image.variants || image.variants.length <= 1) {
      return false;
    }

    // Check if variants have different dimensions
    const uniqueDimensions = new Set(image.variants.map((v) => `${v.width}×${v.height}`));

    console.log('🔍 [ResolutionSelector] Checking variants:', {
      imageId: image.id,
      totalVariants: image.variants.length,
      uniqueDimensions: Array.from(uniqueDimensions),
      hasRealVariants: uniqueDimensions.size > 1,
    });

    return uniqueDimensions.size > 1;
  };

  const realVariants = hasRealVariants();

  // Don't render dropdown if there are no real variants
  if (!realVariants) {
    // Show simple quality badge for single variant
    const quality = getQualityFromDimensions(image.width, image.height);
    return (
      <StyledResolutionButton quality={quality} hasDropdown={false}>
        <StyledResolutionText>
          {`${quality.toUpperCase()} ${image.width}×${image.height}`}
        </StyledResolutionText>
      </StyledResolutionButton>
    );
  }

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
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleVariantSelect = (variantIndex: number, event?: MouseEvent<HTMLElement>) => {
    // Prevent click from bubbling up to parent ImageCard
    event?.stopPropagation();

    // Update the selected variant in store
    updateImageVariant(image.id, variantIndex);

    // Call the optional callback prop for additional handling
    onVariantSelect?.(variantIndex);
    handleClose();
  };

  return (
    <>
      <StyledResolutionButton
        onClick={handleClick}
        quality={currentVariant.quality}
        hasDropdown={true}
      >
        <StyledResolutionText>{currentVariant.label}</StyledResolutionText>
        <ArrowDropDownIcon fontSize="small" />
      </StyledResolutionButton>

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
    </>
  );
});

ResolutionSelector.displayName = 'ResolutionSelector';
