import { FC, SyntheticEvent, useState } from 'react';

import GridViewIcon from '@mui/icons-material/GridView';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TuneIcon from '@mui/icons-material/Tune';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import { RatingWidget } from '@components';
import { useImageStore } from '@store';
import { SizeFilter, SortOption, useTranslation } from '@utils';

import {
  ControlItem,
  ControlsRow,
  CustomDimensionsContainer,
  DimensionInput,
  DividerContainer,
  LeftSection,
  MiddleSection,
  RightSection,
  SizePopoverContent,
  SortContainer,
  ToolbarContainer,
  ViewButton,
  ViewOptionsContainer,
} from './styles';

export const Toolbar: FC = () => {
  const { t } = useTranslation();
  const {
    filterText,
    setFilterText,
    sizeFilters,
    setSizeFilters,
    toggleSizeFilter,
    customSizeFilter,
    setCustomSizeFilter,
    sortOption,
    setSortOption,
    isGridView,
    setIsGridView,
    selectedImages,
    bulkUpdateVariants,
  } = useImageStore();

  // Size filter popover state
  const [sizeAnchorEl, setSizeAnchorEl] = useState<HTMLElement | null>(null);
  const sizePopoverOpen = Boolean(sizeAnchorEl);

  // Resolution selector popover state
  const [resolutionAnchorEl, setResolutionAnchorEl] = useState<HTMLElement | null>(null);
  const resolutionPopoverOpen = Boolean(resolutionAnchorEl);

  // Custom dimensions state
  const [minWidth, setMinWidth] = useState<string>(customSizeFilter.minWidth?.toString() || '');
  const [minHeight, setMinHeight] = useState<string>(customSizeFilter.minHeight?.toString() || '');

  // Track if custom dimensions have user input
  const hasCustomDimensions = Boolean(minWidth || minHeight);

  const handleSizeFilterClick = (event: SyntheticEvent<HTMLElement>) => {
    setSizeAnchorEl(event.currentTarget);
  };

  const handleSizePopoverClose = () => {
    setSizeAnchorEl(null);
  };

  const handleResolutionFilterClick = (event: SyntheticEvent<HTMLElement>) => {
    setResolutionAnchorEl(event.currentTarget);
  };

  const handleResolutionPopoverClose = () => {
    setResolutionAnchorEl(null);
  };

  const handleBulkResolutionChange = (strategy: 'highest' | 'lowest' | 'medium') => {
    if (selectedImages.length > 0) {
      const imageIds = selectedImages.map((img) => img.id);
      bulkUpdateVariants(imageIds, strategy);
    }
    handleResolutionPopoverClose();
  };

  const handleSizeFilterChange = (filter: SizeFilter) => {
    // Clear custom dimensions if user selects a standard filter
    if (hasCustomDimensions) {
      setMinWidth('');
      setMinHeight('');
      setCustomSizeFilter({ minWidth: undefined, minHeight: undefined });
    }
    toggleSizeFilter(filter);
  };

  const handleCustomDimensionsChange = (field: 'width' | 'height', value: string) => {
    // Сохраняем введенные значения
    if (field === 'width') {
      setMinWidth(value);
    } else {
      setMinHeight(value);
    }
  };

  const handleApplyFilters = () => {
    // Проверяем, есть ли введенные значения для кастомных фильтров
    const hasCustomWidth = Boolean(minWidth && minWidth !== '0');
    const hasCustomHeight = Boolean(minHeight && minHeight !== '0');

    if (hasCustomWidth || hasCustomHeight) {
      // Если есть кастомные размеры, применяем их
      const newFilter = {
        minWidth: hasCustomWidth ? parseInt(minWidth, 10) : undefined,
        minHeight: hasCustomHeight ? parseInt(minHeight, 10) : undefined,
      };
      setCustomSizeFilter(newFilter);
      // Снимаем стандартные фильтры
      setSizeFilters([]);
    } else {
      // Если нет кастомных размеров, очищаем их
      setCustomSizeFilter({ minWidth: undefined, minHeight: undefined });

      // Проверяем стандартные фильтры
      if (sizeFilters.length === 0) {
        // Если не выбраны стандартные фильтры, устанавливаем ALL
        setSizeFilters([SizeFilter.ALL]);
      }
    }

    // Close the popover
    handleSizePopoverClose();
  };

  const handleClearFilters = () => {
    setFilterText('');
    setSizeFilters([SizeFilter.ALL]);
    setCustomSizeFilter({ minWidth: undefined, minHeight: undefined });
    setMinWidth('');
    setMinHeight('');
    setSortOption(SortOption.DEFAULT);
  };

  const handleWidthFocus = () => {
    if (minWidth === '0') {
      setMinWidth('');
    }
  };

  const handleHeightFocus = () => {
    if (minHeight === '0') {
      setMinHeight('');
    }
  };

  const getSizeFilterLabel = () => {
    // Show custom dimensions if they are set
    if (customSizeFilter.minWidth || customSizeFilter.minHeight) {
      const parts = [];
      if (customSizeFilter.minWidth) {
        parts.push(`W ≥ ${customSizeFilter.minWidth}px`);
      }
      if (customSizeFilter.minHeight) {
        parts.push(`H ≥ ${customSizeFilter.minHeight}px`);
      }
      return parts.join(', ');
    }

    // Otherwise show standard filters
    if (sizeFilters.includes(SizeFilter.ALL)) {
      return t('size_filter_all');
    }

    if (sizeFilters.length === 1) {
      switch (sizeFilters[0]) {
        case SizeFilter.SMALL:
          return t('size_filter_small');
        case SizeFilter.MEDIUM:
          return t('size_filter_medium');
        case SizeFilter.LARGE:
          return t('size_filter_large');
        default:
          return t('filter_by_size_text');
      }
    }

    return `${sizeFilters.length} ${t('size_filters_selected')}`;
  };

  return (
    <ToolbarContainer>
      <LeftSection>
        <ControlsRow>
          <ControlItem>
            <TextField
              placeholder={t('filter_text')}
              variant="outlined"
              size="small"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </ControlItem>

          <ControlItem>
            <Button
              variant="outlined"
              size="medium"
              onClick={handleSizeFilterClick}
              aria-describedby="size-filter-popover"
            >
              {getSizeFilterLabel()}
            </Button>

            <Popover
              id="size-filter-popover"
              open={sizePopoverOpen}
              anchorEl={sizeAnchorEl}
              onClose={handleSizePopoverClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              <SizePopoverContent>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sizeFilters.includes(SizeFilter.ALL)}
                        onChange={() => handleSizeFilterChange(SizeFilter.ALL)}
                      />
                    }
                    label={t('size_filter_all')}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sizeFilters.includes(SizeFilter.SMALL)}
                        onChange={() => handleSizeFilterChange(SizeFilter.SMALL)}
                      />
                    }
                    label={t('size_filter_small')}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sizeFilters.includes(SizeFilter.MEDIUM)}
                        onChange={() => handleSizeFilterChange(SizeFilter.MEDIUM)}
                      />
                    }
                    label={t('size_filter_medium')}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sizeFilters.includes(SizeFilter.LARGE)}
                        onChange={() => handleSizeFilterChange(SizeFilter.LARGE)}
                      />
                    }
                    label={t('size_filter_large')}
                  />
                </FormGroup>

                <DividerContainer>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    OR
                  </Typography>
                  <Divider />
                </DividerContainer>

                <CustomDimensionsContainer>
                  <DimensionInput>
                    <TextField
                      label={t('min_width')}
                      type="number"
                      size="small"
                      value={minWidth}
                      onChange={(e) => handleCustomDimensionsChange('width', e.target.value)}
                      onFocus={handleWidthFocus}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </DimensionInput>
                  <DimensionInput>
                    <TextField
                      label={t('min_height')}
                      type="number"
                      size="small"
                      value={minHeight}
                      onChange={(e) => handleCustomDimensionsChange('height', e.target.value)}
                      onFocus={handleHeightFocus}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </DimensionInput>
                </CustomDimensionsContainer>

                <Button
                  variant="contained"
                  size="medium"
                  fullWidth
                  onClick={handleApplyFilters}
                  sx={{ mt: 2 }}
                >
                  {t('apply_btn')}
                </Button>
              </SizePopoverContent>
            </Popover>
          </ControlItem>

          <ControlItem>
            <Button
              startIcon={<RestartAltIcon />}
              variant="outlined"
              onClick={handleClearFilters}
              title={t('reset_filters_title')}
            >
              {t('reset_btn')}
            </Button>
          </ControlItem>

          <ControlItem>
            <Button
              startIcon={<TuneIcon />}
              variant="outlined"
              onClick={handleResolutionFilterClick}
              disabled={selectedImages.length === 0}
              title={
                selectedImages.length === 0
                  ? 'Select images to change resolution'
                  : 'Change resolution for selected images'
              }
            >
              Resolution ({selectedImages.length})
            </Button>

            <Popover
              id="resolution-filter-popover"
              open={resolutionPopoverOpen}
              anchorEl={resolutionAnchorEl}
              onClose={handleResolutionPopoverClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              <SizePopoverContent>
                <Typography variant="subtitle2" gutterBottom>
                  Set resolution for {selectedImages.length} selected image
                  {selectedImages.length !== 1 ? 's' : ''}:
                </Typography>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleBulkResolutionChange('highest')}
                  sx={{ mb: 1 }}
                >
                  Highest Quality
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleBulkResolutionChange('medium')}
                  sx={{ mb: 1 }}
                >
                  Medium Quality
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleBulkResolutionChange('lowest')}
                >
                  Lowest Quality
                </Button>
              </SizePopoverContent>
            </Popover>
          </ControlItem>
        </ControlsRow>
      </LeftSection>

      <MiddleSection>
        <RatingWidget />
      </MiddleSection>

      <RightSection>
        <SortContainer>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="sort-images-label">{t('sort_text')}</InputLabel>
            <Select
              labelId="sort-images-label"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              label={t('sort_text')}
            >
              <MenuItem value={SortOption.DEFAULT}>{t('sort_default')}</MenuItem>
              <MenuItem value={SortOption.NAME_ASC}>{t('sort_name_asc')}</MenuItem>
              <MenuItem value={SortOption.NAME_DESC}>{t('sort_name_desc')}</MenuItem>
              <MenuItem value={SortOption.SIZE_ASC}>{t('sort_size_asc')}</MenuItem>
              <MenuItem value={SortOption.SIZE_DESC}>{t('sort_size_desc')}</MenuItem>
            </Select>
          </FormControl>
        </SortContainer>

        <ViewOptionsContainer>
          <ViewButton
            onClick={() => setIsGridView(true)}
            active={isGridView}
            title={t('grid_view_text')}
          >
            <GridViewIcon />
          </ViewButton>
          <ViewButton
            onClick={() => setIsGridView(false)}
            active={!isGridView}
            title={t('list_view_text')}
          >
            <ViewListIcon />
          </ViewButton>
        </ViewOptionsContainer>
      </RightSection>
    </ToolbarContainer>
  );
};
