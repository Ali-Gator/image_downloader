import { FC, SyntheticEvent, useCallback, useState } from 'react';

import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import GridViewIcon from '@mui/icons-material/GridView';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  Button,
  Checkbox,
  CircularProgress,
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
import { useSnackbar } from 'notistack';

import { RatingWidget } from '@components';
import { useImageStore, useSettingsStore } from '@store';
import { GrabImagesResponse, ImageData, MessageActionType } from '@types';
import { QualityLevel, SortOption, sendMessageToContentScript, useTranslation } from '@utils';
import { isSidePanelContext } from '@utils/sidePanelUtils';

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
  const { enqueueSnackbar } = useSnackbar();
  const {
    sourceTabId,
    filterText,
    setFilterText,
    qualityFilters,
    setQualityFilters,
    toggleQualityFilter,
    customSizeFilter,
    setCustomSizeFilter,
    sortOption,
    setSortOption,
    isGridView,
    setIsGridView,
    updateImages,
  } = useImageStore();

  const { setDefaultGridView } = useSettingsStore();

  const handleSetIsGridView = useCallback(
    (value: boolean) => {
      setIsGridView(value);
      setDefaultGridView(value);
    },
    [setIsGridView, setDefaultGridView],
  );

  const [isRescanning, setIsRescanning] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleRescan = useCallback(async () => {
    setIsRescanning(true);
    try {
      let targetTabId = sourceTabId;

      if (isSidePanelContext()) {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!activeTab?.id) {
          enqueueSnackbar(t('rescan_tab_closed'), { variant: 'warning' });
          return;
        }
        targetTabId = activeTab.id;
      }

      if (!targetTabId) return;

      const isSwitchedTab = targetTabId !== sourceTabId;

      const response = await sendMessageToContentScript<GrabImagesResponse>(
        targetTabId,
        { action: isSwitchedTab ? MessageActionType.GRAB_IMAGES : MessageActionType.RESCAN_IMAGES },
        10000,
      );
      if (response?.images) {
        if (isSwitchedTab) {
          useImageStore.setState({ pageUrl: response.pageUrl ?? '', sourceTabId: targetTabId });
          useImageStore.getState().setImages(response.images);
          enqueueSnackbar(t('rescan_found_new', response.images.length.toString()), {
            variant: 'success',
          });
        } else {
          const { images, setImages } = useImageStore.getState();
          const existingSrcs = new Set(images.map((img) => img.src));
          const newImages = response.images.filter((img) => !existingSrcs.has(img.src));
          if (newImages.length > 0) {
            setImages([...images, ...newImages]);
            enqueueSnackbar(t('rescan_found_new', newImages.length.toString()), {
              variant: 'success',
            });
          } else {
            enqueueSnackbar(t('rescan_no_new'), { variant: 'info' });
          }
        }
      } else {
        enqueueSnackbar(t('rescan_tab_closed'), { variant: 'warning' });
      }
    } finally {
      setIsRescanning(false);
    }
  }, [sourceTabId, enqueueSnackbar, t]);

  const handleEnhance = useCallback(async () => {
    if (!sourceTabId) return;

    setIsEnhancing(true);
    try {
      const { images } = useImageStore.getState();
      const response = await sendMessageToContentScript<{
        images: ImageData[];
        upgradedCount: number;
      }>(sourceTabId, { action: MessageActionType.ENHANCE_IMAGES, images }, 60000);
      if (response?.images && response.upgradedCount > 0) {
        updateImages(response.images);
        enqueueSnackbar(t('enhance_found', response.upgradedCount.toString()), {
          variant: 'success',
        });
      } else {
        enqueueSnackbar(t('enhance_no_upgrades'), { variant: 'info' });
      }
    } finally {
      setIsEnhancing(false);
    }
  }, [sourceTabId, updateImages, enqueueSnackbar, t]);

  // Size filter popover state
  const [sizeAnchorEl, setSizeAnchorEl] = useState<HTMLElement | null>(null);
  const sizePopoverOpen = Boolean(sizeAnchorEl);

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

  const handleQualityFilterChange = (filter: QualityLevel) => {
    // Clear custom dimensions if user selects a standard filter
    if (hasCustomDimensions) {
      setMinWidth('');
      setMinHeight('');
      setCustomSizeFilter({ minWidth: undefined, minHeight: undefined });
    }
    toggleQualityFilter(filter);
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
      setQualityFilters([]);
    } else {
      // Если нет кастомных размеров, очищаем их
      setCustomSizeFilter({ minWidth: undefined, minHeight: undefined });

      // Проверяем стандартные фильтры
      if (qualityFilters.length === 0) {
        // Если не выбраны стандартные фильтры, устанавливаем ALL
        setQualityFilters([QualityLevel.ALL]);
      }
    }

    // Close the popover
    handleSizePopoverClose();
  };

  const handleClearFilters = () => {
    setFilterText('');
    setQualityFilters([QualityLevel.ALL]);
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

  const getQualityFilterLabel = () => {
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
    if (qualityFilters.includes(QualityLevel.ALL)) {
      return t('quality_filter_all');
    }

    if (qualityFilters.length === 1) {
      switch (qualityFilters[0]) {
        case QualityLevel.LOW:
          return t('quality_filter_low');
        case QualityLevel.MEDIUM:
          return t('quality_filter_medium');
        case QualityLevel.HD:
          return t('quality_filter_hd');
        default:
          return t('filter_by_quality_text');
      }
    }

    return `${qualityFilters.length} ${t('quality_filters_selected')}`;
  };

  return (
    <ToolbarContainer>
      <LeftSection>
        <ControlsRow data-onboarding="filter-section">
          <ControlItem>
            <TextField
              placeholder={t('filter_text')}
              variant="outlined"
              size="small"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.1rem', mr: 0.5 }} />
                ),
              }}
            />
          </ControlItem>

          <ControlItem>
            <Button
              variant="outlined"
              size="medium"
              onClick={handleSizeFilterClick}
              aria-describedby="size-filter-popover"
              sx={{
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 500,
                px: 2,
                py: 0.5,
                minWidth: 'auto',
              }}
            >
              {getQualityFilterLabel()}
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
                        checked={qualityFilters.includes(QualityLevel.ALL)}
                        onChange={() => handleQualityFilterChange(QualityLevel.ALL)}
                      />
                    }
                    label={t('quality_filter_all')}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={qualityFilters.includes(QualityLevel.LOW)}
                        onChange={() => handleQualityFilterChange(QualityLevel.LOW)}
                      />
                    }
                    label={t('quality_filter_low')}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={qualityFilters.includes(QualityLevel.MEDIUM)}
                        onChange={() => handleQualityFilterChange(QualityLevel.MEDIUM)}
                      />
                    }
                    label={t('quality_filter_medium')}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={qualityFilters.includes(QualityLevel.HD)}
                        onChange={() => handleQualityFilterChange(QualityLevel.HD)}
                      />
                    }
                    label={t('quality_filter_hd')}
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
              size="small"
              onClick={handleClearFilters}
              title={t('reset_filters_title')}
              sx={{ fontSize: '0.75rem' }}
            >
              {t('reset_btn')}
            </Button>
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
            onClick={() => handleSetIsGridView(true)}
            active={isGridView}
            title={t('grid_view_text')}
          >
            <GridViewIcon />
          </ViewButton>
          <ViewButton
            onClick={() => handleSetIsGridView(false)}
            active={!isGridView}
            title={t('list_view_text')}
          >
            <ViewListIcon />
          </ViewButton>
        </ViewOptionsContainer>

        {(sourceTabId || isSidePanelContext()) && (
          <>
            <Button
              data-onboarding="enhance-button"
              startIcon={
                isEnhancing ? <CircularProgress size={16} color="inherit" /> : <AutoFixHighIcon />
              }
              variant="outlined"
              size="small"
              onClick={handleEnhance}
              disabled={isEnhancing}
              title={t('enhance_button_title')}
              sx={{ fontSize: '0.75rem' }}
            >
              {t('enhance_button')}
            </Button>
            <Button
              data-onboarding="rescan-button"
              startIcon={
                isRescanning ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />
              }
              variant="outlined"
              size="small"
              onClick={handleRescan}
              disabled={isRescanning}
              title={t('rescan_button')}
              sx={{ fontSize: '0.75rem' }}
            >
              {t('rescan_button')}
            </Button>
          </>
        )}
      </RightSection>
    </ToolbarContainer>
  );
};
