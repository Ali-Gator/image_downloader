import { PAYWALL_ID } from './constants';
import { handleError } from './errorHandlers';

const USED_PAGE_URLS_KEY = 'usedPageUrls';
const LIMIT_REACHED_AT_KEY = 'limitReachedAt';
const PAYWALL_VISIBILITY_OFF_KEY = 'paywallVisibilityOff';
const MONETIZATION_REFRESH_AT_KEY = 'monetizationRefreshAt';

export function getCustomerPortalUrl(paywallId: string = PAYWALL_ID): string {
  const safePaywallId = encodeURIComponent(paywallId);
  return `https://onlineapp.pro/paywall/${safePaywallId}/customer-portal/get`;
}

export function getCustomerPortalSupportUrl(paywallId: string = PAYWALL_ID): string {
  return `${getCustomerPortalUrl(paywallId)}?tab=support`;
}

export async function ensureMonetizeSdkLoaded(): Promise<void> {
  // If already loaded (production via <script src="/wall.2.1.2.js">), do nothing.
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
      script.src = chrome.runtime.getURL('wall.2.1.2.js');
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

export type MonetizationLimitState = {
  usedPageUrls: string[];
  usedCount: number;
  limitReached: boolean;
  limitReachedAt: string | null;
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

export async function getMonetizationLimitState(): Promise<MonetizationLimitState> {
  try {
    const result = await chrome.storage.local.get([USED_PAGE_URLS_KEY, LIMIT_REACHED_AT_KEY]);

    const usedPageUrlsRaw = result[USED_PAGE_URLS_KEY];
    const usedPageUrls = Array.isArray(usedPageUrlsRaw)
      ? usedPageUrlsRaw.filter((v) => typeof v === 'string')
      : [];

    const limitReachedAtRaw = result[LIMIT_REACHED_AT_KEY];
    const limitReachedAt = typeof limitReachedAtRaw === 'string' ? limitReachedAtRaw : null;

    const usedCount = usedPageUrls.length;

    const limitReached = usedCount >= 10 || Boolean(limitReachedAt);

    return { usedPageUrls, usedCount, limitReached, limitReachedAt };
  } catch (error) {
    handleError(error);
    return { usedPageUrls: [], usedCount: 0, limitReached: false, limitReachedAt: null };
  }
}

export async function recordSuccessfulDownloadPageUrl(pageUrl: string | null): Promise<void> {
  if (!pageUrl) return;

  const normalized = normalizePageUrl(pageUrl);
  if (!normalized) return;

  try {
    const current = await chrome.storage.local.get([USED_PAGE_URLS_KEY, LIMIT_REACHED_AT_KEY]);

    const usedPageUrlsRaw = current[USED_PAGE_URLS_KEY];
    const usedPageUrls: string[] = Array.isArray(usedPageUrlsRaw)
      ? usedPageUrlsRaw.filter((v) => typeof v === 'string')
      : [];

    if (usedPageUrls.includes(normalized)) return;

    const nextUsed = [...usedPageUrls, normalized].slice(0, 10);

    const updates: Record<string, unknown> = {
      [USED_PAGE_URLS_KEY]: nextUsed,
    };

    const currentLimitReachedAt = current[LIMIT_REACHED_AT_KEY];
    const alreadyReached =
      typeof currentLimitReachedAt === 'string' && currentLimitReachedAt.length > 0;

    if (nextUsed.length >= 10 && !alreadyReached) {
      updates[LIMIT_REACHED_AT_KEY] = new Date().toISOString();
    }

    await chrome.storage.local.set(updates);
  } catch (error) {
    handleError(error);
  }
}

export async function maybeOpenPaywallOn11thClick(params: { pageUrl: string | null }): Promise<{
  blocked: boolean;
  eligibility: MonetizationEligibility;
  limit: MonetizationLimitState;
}> {
  const eligibility = await getMonetizationEligibility();
  const limit = await getMonetizationLimitState();

  // Guardrail: if we're not showing monetization UI, behavior must not change at all.
  if (!eligibility.showMonetizationUI) {
    return { blocked: false, eligibility, limit };
  }

  // If we can't determine pageUrl, do not block and do not count.
  if (!params.pageUrl) {
    return { blocked: false, eligibility, limit };
  }

  if (!limit.limitReached) {
    return { blocked: false, eligibility, limit };
  }

  // Limit reached and unpaid -> open paywall on click (11th+)
  const result = await openPaywallForPurchase();

  // Successful purchase -> allow this click and return fresh eligibility so caller can avoid counting.
  if (result.ok && result.outcome === 'success-purchase') {
    const nextEligibility = await getMonetizationEligibility();
    return { blocked: false, eligibility: nextEligibility, limit };
  }

  // If Monetize prevented opening because user already has access (active payment / trial / etc.),
  // do not block the download.
  if (!result.ok && result.outcome === 'prevented' && shouldAllowAccessForReason(result.reason)) {
    const nextEligibility = await getMonetizationEligibility();
    return { blocked: false, eligibility: nextEligibility, limit };
  }

  // Otherwise block this click (user closed paywall or paywall unavailable), consistent with UX:
  // banner already warned; next clicks keep prompting upgrade.
  return { blocked: true, eligibility, limit };
}
