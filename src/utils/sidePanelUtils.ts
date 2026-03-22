/**
 * Checks whether the Chrome SidePanel API is available in the current browser.
 */
export function isSidePanelSupported(): boolean {
  return typeof chrome?.sidePanel !== 'undefined';
}

/**
 * Evaluated once at module load — the pathname never changes within a
 * Chrome extension page lifetime. Works in both dev (no query param)
 * and prod (with ?context=sidepanel).
 */
const _isSidePanelContext: boolean =
  typeof window !== 'undefined' && window.location.pathname.endsWith('sidepanel.html');

/**
 * Returns true when the current page is sidepanel.html.
 */
export function isSidePanelContext(): boolean {
  return _isSidePanelContext;
}
