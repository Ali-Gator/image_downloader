import { PAYWALL_ID } from './constants';
import { handleError } from './errorHandlers';

const SEEN_PAGE_URLS_KEY = 'seenPageUrls';
const PAYWALL_VISIBILITY_OFF_KEY = 'paywallVisibilityOff';
const MONETIZATION_REFRESH_AT_KEY = 'monetizationRefreshAt';

export function getCustomerPortalUrl(paywallId: string = PAYWALL_ID): string {
  const safePaywallId = encodeURIComponent(paywallId);
  return `https://appbox.space/paywall/${safePaywallId}/customer-portal/get`;
}

export function getCustomerPortalSupportUrl(paywallId: string = PAYWALL_ID): string {
  return `${getCustomerPortalUrl(paywallId)}?tab=support`;
}

export async function ensureMonetizeSdkLoaded(): Promise<void> {
  // If already loaded (production via <script src="/wall.2.1.3.js">), do nothing.
  if (window.paywall) return;

  await new Promise<void>((resolve) => {
    try {
      const existing = document.querySelector('script[data-monetize-wall-sdk="1"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => resolve(), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.dataset.monetizeWallSdk = '1';
      script.async = false;
      script.type = 'text/javascript';
      script.src = chrome.runtime.getURL('wall.2.1.3.js');
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.prepend(script);
    } catch {
      resolve();
    }
  });
}

type PaywallVisibilityStatusReason =
  | 'active-payment-found'
  | 'openings-trial'
  | 'time-trial'
  | 'country-not-match'
  | 'visibility-turned-off'
  | 'closed-by-user'
  | 'error';

async function ensurePaywallReady(): Promise<void> {
  await ensureMonetizeSdkLoaded();

  try {
    const initResult = window.paywall?.init?.(PAYWALL_ID);
    const isPromise = Boolean(
      initResult && typeof (initResult as Promise<unknown>).then === 'function',
    );

    // IMPORTANT: Monetize SDK's `init()` can return a promise that only resolves after the iframe is created
    // (which happens during `open()`/`getUser()` internally). Awaiting here can deadlock eligibility checks.
    // We intentionally do NOT await init; we only ensure it was invoked.
    void isPromise;
  } catch {
    // ignore: eligibility will fall back to false
  }
}

export type MonetizationEligibility = {
  isNew: boolean;
  countryMatch: boolean;
  paid: boolean;
  showMonetizationUI: boolean;
};

export type MonetizationEligibilityWithUser = {
  eligibility: MonetizationEligibility;
  user: PaywallUser | null;
};

async function getPaywallVisibilityOff(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get([PAYWALL_VISIBILITY_OFF_KEY]);
    return Boolean(result[PAYWALL_VISIBILITY_OFF_KEY]);
  } catch (error) {
    handleError(error);
    return false;
  }
}

async function touchMonetizationRefresh(): Promise<void> {
  try {
    await chrome.storage.local.set({ [MONETIZATION_REFRESH_AT_KEY]: new Date().toISOString() });
  } catch (error) {
    handleError(error);
  }
}

export type TrialState = {
  remainingActions: number;
  totalActions: number;
  expired: boolean;
};

export type PaywallOpenOutcome =
  | { ok: true; outcome: 'success-purchase' }
  | { ok: false; outcome: 'prevented'; reason?: PaywallVisibilityStatusReason }
  | { ok: false; outcome: 'unavailable' }
  | { ok: false; outcome: 'error' };

export function normalizePageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url.split('#')[0] ?? url;
  }
}

export async function getIsNewUser(): Promise<boolean> {
  try {
    const result = await chrome.storage.sync.get(['installDate']);
    return Boolean(result.installDate);
  } catch (error) {
    handleError(error);
    return false;
  }
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function safeGetPaywallUser(): Promise<PaywallUser | null> {
  try {
    await ensurePaywallReady();
    const result = await window.paywall?.getUser?.();
    if (result && typeof result === 'object') return result as PaywallUser;
    return null;
  } catch (error) {
    // Monetize may throw 401 with a JSON body containing `countryMatch`
    const e = error as { body?: unknown; response?: { body?: unknown }; data?: unknown };
    const body = e?.body ?? e?.response?.body ?? e?.data;
    const parsed = parseMaybeJson(body);
    if (parsed && typeof parsed === 'object') return parsed as PaywallUser;
    return null;
  }
}

export async function getMonetizationEligibilityWithUser(): Promise<MonetizationEligibilityWithUser> {
  const [visibilityOff, isNew, user] = await Promise.all([
    getPaywallVisibilityOff(),
    getIsNewUser(),
    safeGetPaywallUser(),
  ]);

  const countryMatch = Boolean(user?.countryMatch);
  const paid = Boolean(user?.paid);

  // UI should not show for paid users (they have a dedicated account menu).
  const showMonetizationUI = !visibilityOff && isNew && countryMatch && !paid;

  return {
    eligibility: {
      isNew,
      countryMatch,
      paid,
      showMonetizationUI,
    },
    user,
  };
}

function getVisibilityStatusReason(error: unknown): PaywallVisibilityStatusReason | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const e = error as { visibility_status_reason?: unknown };
  const reason = e.visibility_status_reason;

  return typeof reason === 'string' ? (reason as PaywallVisibilityStatusReason) : undefined;
}

// Monetize docs: https://monetize.software/docs-v2/paywall-api/open#visibility-status-reasons
function shouldAllowAccessForReason(reason: PaywallVisibilityStatusReason | undefined): boolean {
  if (!reason) return false;
  return (
    reason === 'active-payment-found' ||
    reason === 'openings-trial' ||
    reason === 'time-trial' ||
    reason === 'visibility-turned-off'
  );
}

export async function openPaywallForPurchase(): Promise<PaywallOpenOutcome> {
  await ensurePaywallReady();

  const sdk = window.paywall;

  if (!sdk?.open) {
    return { ok: false, outcome: 'unavailable' };
  }

  try {
    // Important: keep correct `this` binding for SDK methods (they rely on internal `this.*`).
    await sdk.open({ resolveEvent: 'success-purchase' });

    await touchMonetizationRefresh();
    return { ok: true, outcome: 'success-purchase' };
  } catch (error) {
    const reason = getVisibilityStatusReason(error);

    // "Normal" prevention cases should not be reported as errors.
    // We only capture truly technical problems.
    if (reason && reason !== 'error') {
      // Even if paywall opening is prevented (active payment / trial / etc.),
      // the UI might need a refresh to reflect the latest access state.
      await touchMonetizationRefresh();
      return { ok: false, outcome: 'prevented', reason };
    }

    handleError(error);
    return { ok: false, outcome: 'error' };
  }
}

export async function getMonetizationEligibility(): Promise<MonetizationEligibility> {
  const { eligibility } = await getMonetizationEligibilityWithUser();
  return eligibility;
}

export async function getTrialState(): Promise<TrialState> {
  try {
    await ensurePaywallReady();
    const info = await window.paywall?.getTrialInfo?.();

    if (info && typeof info === 'object' && 'remainingActions' in info) {
      return {
        remainingActions: info.remainingActions,
        totalActions: info.totalActions,
        expired: info.expired,
      };
    }

    // No action-based trial configured or 'no trial' — treat as expired so paywall shows.
    return { remainingActions: 0, totalActions: 0, expired: true };
  } catch (error) {
    handleError(error);
    return { remainingActions: 0, totalActions: 0, expired: true };
  }
}

async function getSeenPageUrls(): Promise<string[]> {
  try {
    const result = await chrome.storage.local.get([SEEN_PAGE_URLS_KEY]);
    const raw = result[SEEN_PAGE_URLS_KEY];
    return Array.isArray(raw) ? raw.filter((v) => typeof v === 'string') : [];
  } catch (error) {
    handleError(error);
    return [];
  }
}

async function checkAndRecordSeenPageUrl(
  pageUrl: string,
  mode: 'check' | 'record',
): Promise<boolean> {
  const normalized = normalizePageUrl(pageUrl);
  if (!normalized) return false;

  try {
    const seen = await getSeenPageUrls();
    if (seen.includes(normalized)) return true;
    if (mode === 'record') {
      await chrome.storage.local.set({ [SEEN_PAGE_URLS_KEY]: [...seen, normalized] });
    }
    return false;
  } catch (error) {
    handleError(error);
    return false;
  }
}

export async function gateDownloadWithPaywall(params: { pageUrl: string | null }): Promise<{
  blocked: boolean;
  eligibility: MonetizationEligibility;
}> {
  const eligibility = await getMonetizationEligibility();

  // Guardrail: if we're not showing monetization UI, behavior must not change at all.
  if (!eligibility.showMonetizationUI) {
    return { blocked: false, eligibility };
  }

  // If we can't determine pageUrl, do not block and do not count.
  if (!params.pageUrl) {
    return { blocked: false, eligibility };
  }

  // Already counted this URL — allow without consuming another trial open.
  if (await checkAndRecordSeenPageUrl(params.pageUrl, 'check')) {
    return { blocked: false, eligibility };
  }

  // New URL → call open() which consumes a trial open (or shows paywall when trial exhausted).
  const result = await openPaywallForPurchase();

  const shouldAllow =
    (result.ok && result.outcome === 'success-purchase') ||
    (!result.ok && result.outcome === 'prevented' && shouldAllowAccessForReason(result.reason));

  if (shouldAllow) {
    // After a successful purchase the trial tracking is no longer needed — clear it
    // so that if the subscription expires later the user gets a fresh trial.
    if (result.ok && result.outcome === 'success-purchase') {
      await chrome.storage.local.remove(SEEN_PAGE_URLS_KEY);
    } else {
      await checkAndRecordSeenPageUrl(params.pageUrl, 'record');
    }
    const nextEligibility = await getMonetizationEligibility();
    return { blocked: false, eligibility: nextEligibility };
  }

  // User closed paywall or error → block.
  return { blocked: true, eligibility };
}
