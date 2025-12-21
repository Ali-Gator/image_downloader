## Examples playbook (pattern-match these)

### Example 1: Add a new popup → content script action
- **Where**:
  - Add enum + typed payload to `src/types/index.ts`
  - Implement handler in `src/contentScript/content-script.ts`
  - Call using `sendMessageToContentScript` from `src/utils/contentScriptUtils.ts`
- **Rules**:
  - Always return `true` from the listener when responding asynchronously.
  - Use `isContentScriptSupported(tab.url)` to gate unsupported URLs before injection/messaging.
  - Prefer `withErrorHandling(...)` in UI to manage `isLoading` state and show alert on failure.

### Example 2: Proxy a fetch through background (CORS-sensitive)
- **Where**:
  - Message type/action: `src/types/index.ts` (`MessageActionType.FETCH_IMAGE`)
  - Background handler: `src/background/index.ts`
  - Error reporting: `src/utils/errorHandlers.ts` (`handleError`)
- **Rules**:
  - Background can use privileged APIs and can apply temporary DNR session rules; always cleanup rules afterward.
  - Return `{ dataUrl }` or `{ error: true }` consistently to keep UI logic simple.

### Example 3: Add a new settings option persisted to storage
- **Where**:
  - Defaults and keys: `src/utils/constants.ts` (`DEFAULT_DOWNLOAD_OPTIONS`, `StorageKeys`)
  - Store: `src/store/settingsStore.ts` (`persist`, `partialize`, `refreshSettings`)
- **Rules**:
  - Add new fields to defaults and `partialize`.
  - Keep persisted state serializable; never persist actions.
  - Maintain backward compatibility (old persisted payloads may not have the new field).

### Example 4: Add a new UI component with consistent styling
- **Where**:
  - Component: `src/components/<Area>/...`
  - Styles: `styles.ts` using MUI `styled(...)`
  - Theme tokens: `src/theme/index.ts`
- **Rules**:
  - Use theme spacing/palette/typography (avoid magic numbers/colors unless justified).
  - Keep layout primitives in `styles.ts`; keep `sx` for small, local overrides.

### Example 5: Add localized user-facing text
- **Where**:
  - English baseline messages: `public/_locales/en/messages.json`
  - React: `src/utils/useTranslation.tsx` (`useTranslation().t`)
  - Non-React code: `getLocalizedMessage(...)`
- **Rules**:
  - Do not hardcode user-facing strings when they should be localizable.
  - Prefer passing localized strings into `handleError(..., showAlert=true, customMessage)`.


