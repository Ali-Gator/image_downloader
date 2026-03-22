import { ChangeEvent, FC, MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Button,
  Checkbox,
  CircularProgress,
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
  getCustomerPortalSupportUrl,
  getCustomerPortalUrl,
  getMonetizationEligibilityWithUser,
  getMonetizationLimitState,
  handleError,
  maybeOpenPaywallOn11thClick,
  openPageTabAndSendImages,
  openPaywallForPurchase,
  recordSuccessfulDownloadPageUrl,
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
  const [usedCount, setUsedCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);

  const selectedCount = selectedImages.length;
  const totalCount = filteredImages.length;
  const isAllSelected = selectedCount > 0 && selectedCount === totalCount;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  const refreshMonetizationState = useCallback(async () => {
    try {
      const [{ eligibility, user }, limit] = await Promise.all([
        getMonetizationEligibilityWithUser(),
        getMonetizationLimitState(),
      ]);

      setShowMonetizationUI(eligibility.showMonetizationUI);
      setPaid(eligibility.paid);
      setUsedCount(limit.usedCount);
      setLimitReached(limit.limitReached);

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

  // Keep UI in sync when local storage changes (successful downloads update usedPageUrls/limitReachedAt)
  useEffect(() => {
    const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
      changes,
      area,
    ) => {
      if (area !== 'local') return;
      if (
        changes.usedPageUrls ||
        changes.limitReachedAt ||
        changes.paywallVisibilityOff ||
        changes.monetizationRefreshAt
      ) {
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

    setIsDownloading(true);
    try {
      const gate = await maybeOpenPaywallOn11thClick({ pageUrl });
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
      const { successCount, failCount, totalCount } = await downloadImagesWithConversion(
        selectedImages,
        createZipArchive,
      );

      // Close the persistent progress snackbar
      if (createZipArchive) {
        closeSnackbar(ZIP_PROGRESS_SNACKBAR_KEY);
      }

      // Count only after at least one successful download
      if (gate.eligibility.showMonetizationUI && successCount > 0) {
        await recordSuccessfulDownloadPageUrl(pageUrl);
        refreshMonetizationState().catch(handleError);
      }

      // Show completion notification
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
    } catch (error) {
      showNotification(t('download_error_text'), NotificationType.ERROR);
    } finally {
      setIsDownloading(false);
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

  const inSidePanel = isSidePanelContext();

  const handleOpenInTab = useCallback(async () => {
    const { images, pageUrl: currentPageUrl, sourceTabId } = useImageStore.getState();
    if (!images.length || !sourceTabId) return;

    await openPageTabAndSendImages({
      images,
      pageUrl: currentPageUrl ?? '',
      sourceTabId,
    });
  }, []);

  const monetizationNode = useMemo(() => {
    if (!showMonetizationUI) return null;

    if (limitReached) {
      return (
        <MonetizationStatusContainer>
          <MonetizationBanner>
            <Typography variant="body2">{t('monetize_free_limit_reached')}</Typography>
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

    return (
      <MonetizationStatusContainer>
        <MonetizationBadge>
          <Typography variant="body2">
            {t('monetize_free_counter', usedCount.toString())}
          </Typography>
        </MonetizationBadge>
      </MonetizationStatusContainer>
    );
  }, [limitReached, refreshMonetizationState, showMonetizationUI, t, usedCount]);

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
          <label htmlFor="selectAll">
            Select All ({selectedCount} of {totalCount} images)
          </label>
        </SelectAllContainer>

        {monetizationNode}

        <Button
          data-onboarding="download-button"
          variant="contained"
          color="secondary"
          startIcon={
            isDownloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />
          }
          onClick={handleDownload}
          disabled={selectedCount === 0 || isDownloading}
        >
          {t('download_btn')}
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
