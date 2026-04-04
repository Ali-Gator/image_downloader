import { ChangeEvent, FC, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DownloadIcon from '@mui/icons-material/Download';
import StopIcon from '@mui/icons-material/Stop';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Button,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { SnackbarKey, useSnackbar } from 'notistack';

import { useImageStore, useSettingsStore } from '@store';

import {
  ControlsContainer,
  HeaderContainer,
  LogoImage,
  MonetizationBadge,
  MonetizationBanner,
  MonetizationStatusContainer,
  SelectAllContainer,
  TitleContainer,
  UserAvatar,
  UserMenuIconButton,
} from './styles';
import {
  downloadImagesWithConversion,
  gateDownloadWithPaywall,
  getCustomerPortalSupportUrl,
  getCustomerPortalUrl,
  getMonetizationEligibilityWithUser,
  getTrialState,
  handleError,
  openPageTabAndSendImages,
  openPaywallForPurchase,
  useTranslation,
} from '../../../../utils';
import { NOTIFICATION_DURATION, NotificationType } from '../../../../utils/constants';
import { isSidePanelContext } from '../../../../utils/sidePanelUtils';
import { SettingsButton } from '../SettingsButton';

const ZIP_PROGRESS_SNACKBAR_KEY: SnackbarKey = 'zip-progress';

export const Header: FC = () => {
  const { t } = useTranslation();
  const { filteredImages, selectedImages, selectAll, deselectAll, pageUrl } = useImageStore();
  const { showDownloadNotifications, createZipArchive } = useSettingsStore();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [showMonetizationUI, setShowMonetizationUI] = useState(false);
  const [paid, setPaid] = useState(false);
  const [remainingActions, setRemainingActions] = useState(0);
  const [totalActions, setTotalActions] = useState(0);
  const [trialExpired, setTrialExpired] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const selectedCount = selectedImages.length;
  const totalCount = filteredImages.length;
  const isAllSelected = selectedCount > 0 && selectedCount === totalCount;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  const refreshMonetizationState = useCallback(async () => {
    try {
      const [{ eligibility, user }, trial] = await Promise.all([
        getMonetizationEligibilityWithUser(),
        getTrialState(),
      ]);

      setShowMonetizationUI(eligibility.showMonetizationUI);
      setPaid(eligibility.paid);
      setRemainingActions(trial.remainingActions);
      setTotalActions(trial.totalActions);
      setTrialExpired(trial.expired);

      const maybeAvatar = user?.user?.avatar;
      setAvatarUrl(
        typeof maybeAvatar === 'string' && maybeAvatar.trim().length > 0 ? maybeAvatar : '',
      );
    } catch (error) {
      handleError(error);
    }
  }, []);

  useEffect(() => {
    refreshMonetizationState().catch(handleError);
  }, [refreshMonetizationState]);

  // Keep UI in sync when local storage changes (successful downloads update seenPageUrls)
  useEffect(() => {
    const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
      changes,
      area,
    ) => {
      if (area !== 'local') return;
      if (changes.seenPageUrls || changes.paywallVisibilityOff || changes.monetizationRefreshAt) {
        refreshMonetizationState().catch(handleError);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [refreshMonetizationState]);

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
      const gate = await gateDownloadWithPaywall({ pageUrl });
      if (gate.blocked) return;

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
      const { successCount, failCount, totalCount, cancelled } =
        await downloadImagesWithConversion(selectedImages, createZipArchive, controller.signal);

      // Close the persistent progress snackbar
      if (createZipArchive) {
        closeSnackbar(ZIP_PROGRESS_SNACKBAR_KEY);
      }

      if (successCount > 0) {
        refreshMonetizationState().catch(handleError);
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
  }, [
    selectedImages,
    showNotification,
    closeSnackbar,
    t,
    createZipArchive,
    pageUrl,
    refreshMonetizationState,
  ]);

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

  const monetizationNode = useMemo(() => {
    if (!showMonetizationUI) return null;

    if (trialExpired) {
      return (
        <MonetizationStatusContainer>
          <MonetizationBanner>
            <Typography variant="body2">
              {inSidePanel ? t('monetize_limit_short') : t('monetize_free_limit_reached')}
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              size="small"
              onClick={async () => {
                await openPaywallForPurchase();
                refreshMonetizationState().catch(handleError);
              }}
            >
              {t('upgrade_btn')}
            </Button>
          </MonetizationBanner>
        </MonetizationStatusContainer>
      );
    }

    if (totalActions > 0) {
      const usedActions = totalActions - remainingActions;
      return (
        <MonetizationStatusContainer>
          <MonetizationBadge>
            <Typography variant="body2">
              {t('monetize_free_counter', [usedActions.toString(), totalActions.toString()])}
            </Typography>
          </MonetizationBadge>
        </MonetizationStatusContainer>
      );
    }

    return null;
  }, [
    inSidePanel,
    trialExpired,
    totalActions,
    remainingActions,
    refreshMonetizationState,
    showMonetizationUI,
    t,
  ]);

  const isUserMenuOpen = Boolean(userMenuAnchorEl);

  const handleUserMenuOpen = useCallback((e: MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(e.currentTarget);
  }, []);

  const handleUserMenuClose = useCallback(() => {
    setUserMenuAnchorEl(null);
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

        {monetizationNode}

        <Button
          data-onboarding="download-button"
          variant="contained"
          color={isDownloading ? 'error' : 'secondary'}
          startIcon={
            inSidePanel ? undefined : isDownloading ? (
              <StopIcon />
            ) : (
              <DownloadIcon />
            )
          }
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

        {paid ? (
          <>
            <UserMenuIconButton
              onClick={handleUserMenuOpen}
              aria-label={t('manage_subscription')}
              aria-controls={isUserMenuOpen ? 'user-menu' : undefined}
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen ? 'true' : undefined}
            >
              <UserAvatar src={avatarUrl || undefined}>
                <AccountCircleIcon fontSize="small" />
              </UserAvatar>
            </UserMenuIconButton>

            <Menu
              id="user-menu"
              anchorEl={userMenuAnchorEl}
              open={isUserMenuOpen}
              onClose={handleUserMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem
                component="a"
                href={getCustomerPortalUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleUserMenuClose}
              >
                {t('manage_subscription')}
              </MenuItem>
              <MenuItem
                component="a"
                href={getCustomerPortalSupportUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleUserMenuClose}
              >
                {t('contact_us')}
              </MenuItem>
            </Menu>
          </>
        ) : null}
      </ControlsContainer>
    </HeaderContainer>
  );
};
