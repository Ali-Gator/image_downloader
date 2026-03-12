# Onboarding Implementation Plan

## Context

No in-app onboarding exists. Users landing on page.html get no guidance. We need:
1. Page onboarding overlay (page.html) — how-to + features
2. Options onboarding (options.html) — explain each setting + debug/bug-report
3. Deferred prompt — after 5 downloads or 7 days, suggest Options tour
4. Re-enable checkbox in Options

---

## Visual Design

### Aesthetic: "Warm Editorial"

Cohesive with existing theme (DM Sans, cream `#FAFAF8` surface, blue `#2D5BE3` primary) but with a premium, magazine-like onboarding feel.

### Dialog Layout

```
┌─────────────────────────────────────────────────┐
│                                                 │
│        ┌─────────────────────────────┐          │
│        │  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔  │  ← top gradient stripe (3px)
│        │    ╭───────────────────╮    │          │
│        │    │   Icon/Visual     │    │  ← 80×80 decorative circle
│        │    │   with gradient   │    │    radial-gradient(#EBF0FD → transparent)
│        │    │   background      │    │    icon: 40px, primaryMain
│        │    ╰───────────────────╯    │    floating animation (3s)
│        │                             │          │
│        │   Step Title                │  ← DM Sans 600, 1.25rem, -0.02em
│        │   ─────────                 │          │
│        │   Description text that     │  ← DM Sans 400, 0.875rem
│        │   explains this feature     │    color: textSecondary, lh 1.6
│        │   in 2-3 clear lines.       │          │
│        │                             │          │
│        │   ● ○ ○ ○ ○                │  ← custom step dots
│        │                             │          │
│        │   [Skip]      [Next →]      │  ← text / contained primary
│        └─────────────────────────────┘          │
│                                                 │
└─────────────────────────────────────────────────┘
         backdrop: rgba(26,26,24,0.4) + blur(8px)
```

### Key Visual Details

**Dialog paper:** `maxWidth: 440px`, `borderRadius: 16px`, shadow: `0 24px 48px rgba(0,0,0,0.12)`. Top decorative stripe: `linear-gradient(90deg, #2D5BE3, #5B8DEF, #2D5BE3)`.

**Step icon:** 80×80 circle, `radial-gradient(circle, #EBF0FD 0%, transparent 70%)`, MUI icon 40px `primaryMain`. Subtle float: `translateY(±3px)` 3s ease-in-out infinite.

**Transitions:** Content fade+slide `opacity 0→1, translateX(20px→0)` 300ms. Back: slide from left.

**Step dots (custom):** Active: 8px `#2D5BE3`. Inactive: 6px `#DDD9D3`. Completed: 6px `#2D5BE3` opacity 0.4. Transition 300ms.

**Buttons:** Skip = text `textSecondary` left. Back = outlined middle. Next/Finish = contained primary right. Last step: Yes=primary, No=outlined.

### Icons per Step (Page)

| Step | Icon | Purpose |
|------|------|---------|
| Welcome | `CollectionsOutlined` | Images collection |
| Select | `CheckBoxOutlined` | Selection |
| Filter | `TuneOutlined` | Filtering |
| Download | `CloudDownloadOutlined` | Downloading |
| Options? | `SettingsOutlined` | Settings prompt |

### Icons per Step (Options)

| Step | Icon | Purpose |
|------|------|---------|
| Folder | `FolderOutlined` | Folder name |
| Rename | `DriveFileRenameOutlineOutlined` | Rename pattern |
| Convert | `TransformOutlined` | Format conversion |
| Zip | `FolderZipOutlined` | Zip archive |
| Debug | `BugReportOutlined` | Debug + report |
| Done | `CheckCircleOutlined` | Completion |

### Deferred Prompt (compact)

```
┌─────────────────────────────────────┐
│  ⚙️  Did you know?                 │
│                                     │
│  There are more download options    │
│  like custom folders, rename        │
│  patterns, and format conversion.   │
│                                     │
│  Want a quick tour?                 │
│                                     │
│  [No thanks]         [Show me →]    │
└─────────────────────────────────────┘
```
`maxWidth: 360px`, same visual treatment, no stepper.

---

## Flow Overview

```
[First open page.html] → Page Onboarding (5 steps)
        ↓ last step
  "Want to explore Options?" → Yes → opens options.html?onboarding=true
                              → No → done

[After 5 downloads OR 7 days, if options onboarding not completed]
  → One-time prompt on page.html: "Did you know there are more Options?"
        → Yes → opens options.html?onboarding=true
        → No → dismiss, never show again

[Options page]
  → If ?onboarding=true OR showOnboardingNextTime flag → Options Onboarding (6 steps)
  → Checkbox "Show onboarding guide next time" to re-trigger both
```

---

## Phase 1: Page Onboarding

### Component: `src/components/Page/components/Onboarding/`

**Files to create:**
- `index.tsx` — main component
- `steps.tsx` — step content definitions
- `styles.ts` — styled components

**Behavior:**
- On mount: read `chrome.storage.local` for `ONBOARDING_COMPLETED` key
- If not set → show MUI `Dialog` with `MobileStepper`
- Skip button on every step (marks completed, closes)
- Back / Next navigation

**Steps:**
1. **Welcome** — "Here are all the images found on the page. Let's walk through how to use the extension."
2. **Select images** — checkboxes on each card, Select All in header, grid/list view toggle
3. **Filter & sort** — search by URL, filter by size (quality presets or custom dimensions), sort options
4. **Download** — Download button, conversion, zip archive, rename — all configured in Settings
5. **Explore Options?** — "There's a Settings button (⚙️) with download options like folder name, rename patterns, format conversion, and zip. Want to explore them now?"
   - **Yes** → set `ONBOARDING_COMPLETED=true`, open `options.html?onboarding=true`
   - **No thanks** → set `ONBOARDING_COMPLETED=true`, close

**Integration:**
- Add `<Onboarding />` to `src/components/Page/index.tsx` (alongside `<RatingReminderModal />`)
- Export from `src/components/Page/components/index.ts`

---

## Phase 2: Options Onboarding

### Component: `src/components/OptionsPage/components/OptionsOnboarding/`

**Files to create:**
- `index.tsx` — main component
- `steps.tsx` — step content definitions
- `styles.ts` — styled components

**Behavior:**
- On mount: check if URL has `?onboarding=true` OR `showOnboardingNextTime` setting is true
- If neither → don't render
- If triggered → show MUI `Dialog` with `MobileStepper`
- On finish → set `OPTIONS_ONBOARDING_COMPLETED=true`, reset `showOnboardingNextTime=false`

**Steps:**
1. **Folder name** — set a custom download folder for all images
2. **Rename pattern** — batch rename with patterns like `{name}_{index}`
3. **Format conversion** — convert images between formats (e.g. WebP → PNG)
4. **Zip archive** — pack all downloads into a single zip file
5. **Debug & bug reporting** — if something goes wrong, use "Export Debug Log" to download logs, then click "Report a Bug" to submit them. Include a Report a Bug link (`ApplicationLinks.BUG_REPORT_FORM`)
6. **All set!** — "You're ready to go. You can re-enable this guide anytime from the checkbox below."

**Integration:**
- Add `<OptionsOnboarding />` to `src/components/OptionsPage/index.tsx`
- Export from `src/components/OptionsPage/components/index.ts`

---

## Phase 3: Deferred Options Prompt

### Component: `src/components/Page/components/OptionsPrompt/`

**Files to create:**
- `index.tsx` — prompt dialog component
- `styles.ts` — styled components

**Behavior:**
- On mount: check conditions:
  1. `OPTIONS_ONBOARDING_COMPLETED` is NOT true (user hasn't seen options onboarding)
  2. `OPTIONS_PROMPT_DISMISSED` is NOT true (user hasn't dismissed this prompt before)
  3. Either: `downloadCount >= 5` OR `daysSinceInstall >= 7`
- Download count: read `usedPageUrls` from `chrome.storage.local` (already tracked by monetization — reuse `getMonetizationLimitState().usedCount`)
- Install date: read `installDate` from `chrome.storage.sync` (already set in background/index.ts on install)
- If all conditions met → show a simple Dialog: "Did you know there are more download options? Want a quick tour?"
  - **Yes** → set `OPTIONS_PROMPT_DISMISSED=true`, open `options.html?onboarding=true`
  - **No thanks** → set `OPTIONS_PROMPT_DISMISSED=true`, close

**Integration:**
- Add `<OptionsPrompt />` to `src/components/Page/index.tsx`

---

## Phase 4: "Show Onboarding" Checkbox in Options

### Component: `src/components/OptionsPage/components/ShowOnboardingCheckbox/`

**Files to create:**
- `index.tsx` — checkbox component
- `styles.ts` — styled components

**Behavior:**
- Checkbox label: "Show onboarding guide next time"
- Reads/writes `showOnboardingNextTime` from `useSettingsStore`
- When checked: also clear `ONBOARDING_COMPLETED`, `OPTIONS_ONBOARDING_COMPLETED`, `OPTIONS_PROMPT_DISMISSED` from `chrome.storage.local`
- When unchecked: just update the setting

**Integration:**
- Add to `src/components/OptionsPage/components/DownloadOptions/index.tsx` after `<ResetButton />`
- Export from `src/components/OptionsPage/components/index.ts`

---

## Storage Keys

Add to `StorageKeys` in `src/utils/constants.ts`:

```ts
ONBOARDING_COMPLETED: 'image-downloader-onboarding-completed',
OPTIONS_ONBOARDING_COMPLETED: 'image-downloader-options-onboarding-completed',
OPTIONS_PROMPT_DISMISSED: 'image-downloader-options-prompt-dismissed',
```

---

## Settings Store Changes

In `src/store/settingsStore.ts` and `src/store/types.ts`:

```ts
// Add to SettingsState interface
showOnboardingNextTime: boolean;
setShowOnboardingNextTime: (show: boolean) => void;

// Default value: false
// Persisted via zustand persist (add to partialize)
```

---

## Localization

Add ~25 keys to `public/_locales/en/messages.json` only. Examples:

```
onboarding_welcome_title, onboarding_welcome_text,
onboarding_select_title, onboarding_select_text,
onboarding_filter_title, onboarding_filter_text,
onboarding_download_title, onboarding_download_text,
onboarding_options_prompt_title, onboarding_options_prompt_text,
onboarding_options_yes, onboarding_options_no,
options_onboarding_folder_title, options_onboarding_folder_text,
options_onboarding_rename_title, options_onboarding_rename_text,
options_onboarding_convert_title, options_onboarding_convert_text,
options_onboarding_zip_title, options_onboarding_zip_text,
options_onboarding_debug_title, options_onboarding_debug_text,
options_onboarding_done_title, options_onboarding_done_text,
options_prompt_title, options_prompt_text,
show_onboarding_checkbox_label,
onboarding_skip, onboarding_next, onboarding_back, onboarding_finish
```

Other 50+ locales updated separately.

---

## Files Summary

### Create
| File | Purpose |
|------|---------|
| `src/components/Page/components/Onboarding/index.tsx` | Page onboarding stepper |
| `src/components/Page/components/Onboarding/steps.tsx` | Step content for Page |
| `src/components/Page/components/Onboarding/styles.ts` | Styles |
| `src/components/OptionsPage/components/OptionsOnboarding/index.tsx` | Options onboarding stepper |
| `src/components/OptionsPage/components/OptionsOnboarding/steps.tsx` | Step content for Options |
| `src/components/OptionsPage/components/OptionsOnboarding/styles.ts` | Styles |
| `src/components/Page/components/OptionsPrompt/index.tsx` | Deferred "explore options?" prompt |
| `src/components/Page/components/OptionsPrompt/styles.ts` | Styles |
| `src/components/OptionsPage/components/ShowOnboardingCheckbox/index.tsx` | Re-enable checkbox |
| `src/components/OptionsPage/components/ShowOnboardingCheckbox/styles.ts` | Styles |
| `src/__tests__/onboarding.test.tsx` | Unit tests: Page onboarding |
| `src/__tests__/optionsOnboarding.test.tsx` | Unit tests: Options onboarding |
| `src/__tests__/optionsPrompt.test.tsx` | Unit tests: deferred prompt |
| `e2e/onboarding.spec.ts` | E2E tests: full onboarding flow |

### Modify
| File | Change |
|------|--------|
| `src/components/Page/index.tsx` | Add `<Onboarding />` and `<OptionsPrompt />` |
| `src/components/Page/components/index.ts` | Export Onboarding, OptionsPrompt |
| `src/components/OptionsPage/index.tsx` | Add `<OptionsOnboarding />` |
| `src/components/OptionsPage/components/index.ts` | Export OptionsOnboarding, ShowOnboardingCheckbox |
| `src/components/OptionsPage/components/DownloadOptions/index.tsx` | Add `<ShowOnboardingCheckbox />` |
| `src/utils/constants.ts` | Add 3 new StorageKeys |
| `src/store/settingsStore.ts` | Add `showOnboardingNextTime` + setter |
| `src/store/types.ts` | Add to `SettingsState` interface |
| `public/_locales/en/messages.json` | Add ~25 onboarding i18n keys |

---

## Reusable Code

| What | Where | How |
|------|-------|-----|
| Dialog + storage check pattern | `src/components/RatingReminderModal/` | Same MUI Dialog + chrome.storage.local read on mount |
| Translation hook | `src/utils/useTranslation.tsx` | `useTranslation()` → `t('key')` |
| Storage keys | `src/utils/constants.ts` | `StorageKeys.*` |
| Fallback storage | `src/store/fallbackStorage.ts` | For zustand persist |
| Open options page | `src/components/Page/components/SettingsButton/` | `chrome.runtime.openOptionsPage()` |
| Download count | `src/utils/monetization.ts` → `getMonetizationLimitState()` | `usedCount` for deferred trigger |
| Install date | Background sets `installDate` in `chrome.storage.sync` | Read for 7-day trigger |
| Bug report link | `ApplicationLinks.BUG_REPORT_FORM` in constants | For Options onboarding step 5 |

---

## Testing

### Unit Tests (vitest + @testing-library/react)

**`src/__tests__/onboarding.test.tsx`:**
- Shows onboarding when `ONBOARDING_COMPLETED` is not set
- Does NOT show when `ONBOARDING_COMPLETED` is true
- Next/Back changes active step
- Skip sets completed flag and closes
- "Yes" on last step calls `chrome.runtime.openOptionsPage`

**`src/__tests__/optionsOnboarding.test.tsx`:**
- Shows when URL has `?onboarding=true`
- Does NOT show without trigger
- Step navigation works
- Finish sets `OPTIONS_ONBOARDING_COMPLETED`
- Step 5 contains bug report link

**`src/__tests__/optionsPrompt.test.tsx`:**
- Shows when downloadCount >= 5 and options onboarding not completed
- Shows when daysSinceInstall >= 7 and options onboarding not completed
- Does NOT show when `OPTIONS_PROMPT_DISMISSED` is true
- Does NOT show when `OPTIONS_ONBOARDING_COMPLETED` is true
- "Yes" opens options page
- "No" sets dismissed flag

### E2E Tests (Playwright)

**`e2e/onboarding.spec.ts`:**
- Fresh install → open page.html → onboarding dialog visible
- Navigate all steps → verify step content changes
- Click "Explore Options" → options.html opens with onboarding
- Complete options onboarding → all steps visible
- Reload page.html → onboarding does NOT reappear
- Enable "Show onboarding" in options → reload page.html → onboarding reappears

---

## Verification Checklist

1. `npm run build` — passes
2. `npm run test` — all unit tests pass
3. `npm run test:e2e` — all e2e tests pass (requires build first)
4. Manual: install extension → grab images → page.html shows onboarding
5. Manual: complete page onboarding → reload → no onboarding
6. Manual: click "Explore Options" → options onboarding appears
7. Manual: after 5 downloads → deferred prompt appears
8. Manual: check "Show onboarding" in options → both onboardings re-trigger
