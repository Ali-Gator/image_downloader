import { ChangeEvent, FC, MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DownloadIcon from '@mui/icons-material/Download';
import { Button, Checkbox, Menu, MenuItem, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

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
  openPaywallForPurchase,
  recordSuccessfulDownloadPageUrl,
  useTranslation,
} from '../../../../utils';
import { NOTIFICATION_DURATION, NotificationType } from '../../../../utils/constants';
import { SettingsButton } from '../SettingsButton';

export const Header: FC = () => {
  const { t } = useTranslation();
  const { filteredImages, selectedImages, selectAll, deselectAll, pageUrl } = useImageStore();
  const { showDownloadNotifications, createZipArchive } = useSettingsStore();
  const { enqueueSnackbar } = useSnackbar();

  const [showMonetizationUI, setShowMonetizationUI] = useState(false);
  const [paid, setPaid] = useState(false);
  const [usedCount, setUsedCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);

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
      if (changes.usedPageUrls || changes.limitReachedAt || changes.paywallVisibilityOff) {
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
    (message: string, variant: NotificationType, duration = NOTIFICATION_DURATION.MEDIUM) => {
      if (showDownloadNotifications) {
        enqueueSnackbar(message, {
          variant,
          autoHideDuration: duration,
        });
      }
    },
    [showDownloadNotifications, enqueueSnackbar],
  );

  const handleDownload = useCallback(async () => {
    if (selectedImages.length === 0) return;

    try {
      const gate = await maybeOpenPaywallOn11thClick({ pageUrl });
      if (gate.blocked) return;

      // Show initial notification
      const startMessage = createZipArchive
        ? t('creating_archive')
        : `${t('download_started_text')} (${selectedImages.length})`;

      showNotification(startMessage, NotificationType.INFO);

      // Progress callback for ZIP creation
      const onProgress = createZipArchive
        ? (current: number, total: number) => {
            const progressMessage = t('adding_image', [current.toString(), total.toString()]);
            showNotification(progressMessage, NotificationType.INFO, NOTIFICATION_DURATION.SHORT);
          }
        : undefined;

      // Use unified bulk download with conversion function
      const { successCount, totalCount } = await downloadImagesWithConversion(
        selectedImages,
        onProgress,
      );

      // Count only after at least one successful download
      if (gate.eligibility.showMonetizationUI && successCount > 0) {
        await recordSuccessfulDownloadPageUrl(pageUrl);
        refreshMonetizationState().catch(handleError);
      }

      // Show completion notification
      const completionMessage = createZipArchive
        ? t('download_complete_text')
        : `${t('download_complete_text')}: ${successCount}/${totalCount}`;

      const variant =
        successCount === totalCount ? NotificationType.SUCCESS : NotificationType.WARNING;
      showNotification(completionMessage, variant, NOTIFICATION_DURATION.LONG);
    } catch (error) {
      showNotification(t('download_error_text'), NotificationType.ERROR);
    }
  }, [selectedImages, showNotification, t, createZipArchive, pageUrl, refreshMonetizationState]);

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

  const selectedCount = selectedImages.length;
  const totalCount = filteredImages.length;
  const isAllSelected = selectedCount > 0 && selectedCount === totalCount;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  return (
    <HeaderContainer>
      <TitleContainer>
        <LogoImage src="/img/logo-64.png" alt="Logo" />
        <Typography variant="h6">{t('popup_title')}</Typography>
      </TitleContainer>

      <ControlsContainer>
        <SelectAllContainer>
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
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={selectedCount === 0}
        >
          {t('download_btn')}
        </Button>

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
