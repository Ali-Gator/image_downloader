export {};

declare global {
  type PaywallOpenResolveEvent = 'opened' | 'signed-in' | 'success-purchase';

  interface PaywallOpenOptions {
    resolveEvent?: PaywallOpenResolveEvent;
    consumeTrialOpen?: boolean;
  }

  interface User {
    /** Unique user identifier */
    id: string;
    /** User's email address */
    email: string;
    /** User's full name */
    name: string;
    /** URL to user's avatar image */
    avatar: string;
    /** ISO timestamp when user was created */
    created_at: string;
  }

  interface Balance {
    /** Type of tokens (e.g., 'standard', 'advanced') */
    type: string;
    /** Amount of balance remaining */
    count: number;
  }

  interface Purchase {
    /** ID of the purchase/subscription */
    id: string;
    /** Current status of the purchase/subscription */
    status:
      | 'active'
      | 'paid'
      | 'pending'
      | 'unpaid'
      | 'canceled'
      | 'incomplete_expired'
      | 'past_due'
      | 'incomplete';
    /** ISO timestamp when current billing period started */
    current_period_start: string;
    /** ISO timestamp when current billing period ends */
    current_period_end: string;
    /** Whether subscription will cancel at period end */
    cancel_at_period_end: boolean;
    /** ISO timestamp when subscription was canceled, if applicable */
    canceled_at?: string;
    /** ISO timestamp when subscription was created */
    created: string;
    unit_amount: number;
    interval: string;
    currency: string;
    /** ISO timestamp when subscription ended, if applicable */
    ended_at?: string;
  }

  interface PaywallUser {
    /** User profile information */
    user: User;
    /** Array of user's balance information */
    balances: Balance[];
    /** Whether user's country matches allowed countries */
    countryMatch: boolean;
    /** User's country tier level */
    tier: number;
    /** User's country code */
    country: string;
    /** Array of user's purchases/subscriptions */
    purchases: Purchase[];
    /** Whether user has active paid subscription or lifetime payment */
    paid: boolean;
    /** If user has active subscription trial otherwise undefined */
    trial?: {
      startedAt: string;
      expiresAt: string;
    };
  }

  interface PaywallSDK {
    init: (paywallId: string) => Promise<boolean> | boolean;
    open: (options?: PaywallOpenOptions) => Promise<unknown>;
    getUser: () => Promise<PaywallUser>;
    renew: () => Promise<unknown>;
    destroy: () => Promise<void>;
  }

  interface Window {
    paywall?: PaywallSDK;
  }
}
