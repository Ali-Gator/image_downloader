import { ChangeEvent, FC, useCallback, useRef, useState } from 'react';

import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import StopIcon from '@mui/icons-material/Stop';
import { Button, Checkbox, IconButton, Typography } from '@mui/material';
import { SnackbarKey, useSnackbar } from 'notistack';

import { useImageStore, useSettingsStore } from '@store';

import {
  ControlsContainer,
  HeaderContainer,
  LogoImage,
  SelectAllContainer,
  TitleContainer,
} from './styles';
import {
  downloadImagesWithConversion,
  openPageTabAndSendImages,
  useTranslation,
} from '../../../../utils';
import { NOTIFICATION_DURATION, NotificationType } from '../../../../utils/constants';
import { isSidePanelContext } from '../../../../utils/sidePanelUtils';
import { SettingsButton } from '../SettingsButton';

const ZIP_PROGRESS_SNACKBAR_KEY: SnackbarKey = 'zip-progress';

export const Header: FC = () => {
  const { t } = useTranslation();
  const { filteredImages, selectedImages, selectAll, deselectAll } = useImageStore();
  const { showDownloadNotifications, createZipArchive } = useSettingsStore();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [isDownloading, setIsDownloading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const selectedCount = selectedImages.length;
  const totalCount = filteredImages.length;
  const isAllSelected = selectedCount > 0 && selectedCount === totalCount;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  const handleSelectAllChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      selectAll();
    } else {
      deselectAll();
    }
  };

  /**
   * Shows a notification if notifications are enabled
   */
  const showNotification = useCallback(
    (
      message: string,
      variant: NotificationType,
      duration: number | null = NOTIFICATION_DURATION.MEDIUM,
      key?: SnackbarKey,
    ) => {
      if (showDownloadNotifications) {
        enqueueSnackbar(message, { variant, autoHideDuration: duration, key });
      }
    },
    [showDownloadNotifications, enqueueSnackbar],
  );

  const handleDownload = useCallback(async () => {
    if (selectedImages.length === 0) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsDownloading(true);
    try {
      // Show initial notification
      if (createZipArchive) {
        showNotification(
          t('creating_archive'),
          NotificationType.INFO,
          null,
          ZIP_PROGRESS_SNACKBAR_KEY,
        );
      } else {
        showNotification(
          `${t('download_started_text')} (${selectedImages.length})`,
          NotificationType.INFO,
        );
      }

      // Use unified bulk download with conversion function
      const { successCount, failCount, totalCount, cancelled } = await downloadImagesWithConversion(
        selectedImages,
        createZipArchive,
        controller.signal,
      );

      // Close the persistent progress snackbar
      if (createZipArchive) {
        closeSnackbar(ZIP_PROGRESS_SNACKBAR_KEY);
      }

      // Show completion notification
      if (cancelled) {
        showNotification(
          t('download_cancelled', [successCount.toString(), totalCount.toString()]),
          NotificationType.WARNING,
          NOTIFICATION_DURATION.LONG,
        );
      } else {
        let completionMessage: string;
        if (failCount > 0) {
          completionMessage = t('bulk_download_partial', [
            successCount.toString(),
            totalCount.toString(),
            failCount.toString(),
          ]);
        } else {
          completionMessage = `${t('download_complete_text')}: ${successCount}/${totalCount}`;
        }

        const variant =
          successCount === totalCount ? NotificationType.SUCCESS : NotificationType.WARNING;
        showNotification(completionMessage, variant, NOTIFICATION_DURATION.LONG);
      }
    } catch (error) {
      showNotification(t('download_error_text'), NotificationType.ERROR);
    } finally {
      setIsDownloading(false);
      abortControllerRef.current = null;
    }
  }, [selectedImages, showNotification, closeSnackbar, t, createZipArchive]);

  const handleStopDownload = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const inSidePanel = isSidePanelContext();

  const handleOpenInTab = useCallback(async () => {
    const {
      images,
      selectedImages,
      pageUrl: currentPageUrl,
      sourceTabId,
    } = useImageStore.getState();
    if (!images.length || !sourceTabId) return;

    await openPageTabAndSendImages({
      images,
      pageUrl: currentPageUrl ?? '',
      sourceTabId,
      selectedImages,
    });

    window.close();
  }, []);

  return (
    <HeaderContainer>
      <TitleContainer>
        <LogoImage src="/img/logo-64.png" alt="Logo" />
        <Typography>{t('popup_title')}</Typography>
      </TitleContainer>

      <ControlsContainer>
        <SelectAllContainer data-onboarding="select-all">
          <Checkbox
            id="selectAll"
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={handleSelectAllChange}
          />
          <label htmlFor="selectAll" className="full-label">
            Select All ({selectedCount} of {totalCount} images)
          </label>
          <label htmlFor="selectAll" className="compact-label">
            All {selectedCount}/{totalCount}
          </label>
        </SelectAllContainer>

        <Button
          data-onboarding="download-button"
          variant="contained"
          color={isDownloading ? 'error' : 'secondary'}
          startIcon={inSidePanel ? undefined : isDownloading ? <StopIcon /> : <DownloadIcon />}
          onClick={isDownloading ? handleStopDownload : handleDownload}
          disabled={!isDownloading && selectedCount === 0}
          sx={
            inSidePanel
              ? { minWidth: 'auto', p: 1, '& .MuiSvgIcon-root': { mr: '0px' } }
              : undefined
          }
        >
          {inSidePanel ? (
            isDownloading ? (
              <StopIcon />
            ) : (
              <DownloadIcon />
            )
          ) : isDownloading ? (
            t('stop_btn')
          ) : (
            t('download_btn')
          )}
        </Button>

        {inSidePanel && (
          <IconButton
            onClick={handleOpenInTab}
            title={t('open_in_tab')}
            aria-label={t('open_in_tab')}
            size="small"
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        )}

        <SettingsButton />
      </ControlsContainer>
    </HeaderContainer>
  );
};
