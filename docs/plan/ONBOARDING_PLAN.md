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

Cohesive with existing theme (DM Sans, cream `#FAFAF8` surface, blue `#2D5BE3` primary) but with a premium,
magazine-like onboarding feel.

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

**Dialog paper:** `maxWidth: 440px`, `borderRadius: 16px`, shadow: `0 24px 48px rgba(0,0,0,0.12)`. Top decorative
stripe: `linear-gradient(90deg, #2D5BE3, #5B8DEF, #2D5BE3)`.

**Step icon:** 80×80 circle, `radial-gradient(circle, #EBF0FD 0%, transparent 70%)`, MUI icon 40px `primaryMain`. Subtle
float: `translateY(±3px)` 3s ease-in-out infinite.

**Transitions:** Content fade+slide `opacity 0→1, translateX(20px→0)` 300ms. Back: slide from left.

**Step dots (custom):** Active: 8px `#2D5BE3`. Inactive: 6px `#DDD9D3`. Completed: 6px `#2D5BE3` opacity 0.4. Transition
300ms.

**Buttons:** Skip = text `textSecondary` left. Back = outlined middle. Next/Finish = contained primary right. Last step:
Yes=primary, No=outlined.

### Icons per Step (Page)

| Step     | Icon                    | Purpose           |
|----------|-------------------------|-------------------|
| Welcome  | `CollectionsOutlined`   | Images collection |
| Select   | `CheckBoxOutlined`      | Selection         |
| Filter   | `TuneOutlined`          | Filtering         |
| Download | `CloudDownloadOutlined` | Downloading       |
| Options? | `SettingsOutlined`      | Settings prompt   |

### Icons per Step (Options)

| Step    | Icon                             | Purpose           |
|---------|----------------------------------|-------------------|
| Folder  | `FolderOutlined`                 | Folder name       |
| Rename  | `DriveFileRenameOutlineOutlined` | Rename pattern    |
| Convert | `TransformOutlined`              | Format conversion |
| Zip     | `FolderZipOutlined`              | Zip archive       |
| Debug   | `BugReportOutlined`              | Debug + report    |
| Done    | `CheckCircleOutlined`            | Completion        |

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

## Phase 1: Page Onboarding ✅ IMPLEMENTED

### Architecture: Hybrid Spotlight/Dialog

Instead of a static dialog for all steps, the onboarding uses a **hybrid approach**:

- **Dialog mode** — for steps without a UI target (Welcome, Explore Options). Centered MUI Dialog with
  backdrop blur, same "Warm Editorial" visual treatment.
- **Spotlight mode** — for steps that reference a specific UI element (Select All, Filter, Rescan, Download).
  A full-screen SVG overlay dims the page with a rounded-rect cutout around the target element. A floating
  tooltip card is positioned near the highlighted element.

### Technical decisions

- **Target binding:** `data-onboarding="..."` attributes on target elements, queried via CSS selectors.
  Decoupled from component internals, easy to add/remove.
- **Fallback:** If a target element is not found in the DOM (e.g., Rescan button when `sourceTabId` is null),
  the step automatically falls back to dialog mode.
- **Positioning:** `getBoundingClientRect()` measured in `useLayoutEffect`, re-measured on resize/scroll.
  Tooltip placement configurable per step (`top`, `bottom`, `left`, `right`) with viewport clamping.
- **Cutout:** SVG `<mask>` with a black rounded rect punched out of a white fill, applied to a semi-transparent
  overlay rect. This gives a smooth rounded cutout without CSS hacks.

### Component: `src/components/Page/components/Onboarding/`

**Files:**

- `index.tsx` — main component (hybrid dialog/spotlight renderer)
- `steps.tsx` — step definitions with `targetSelector` and `tooltipPlacement`
- `styles.ts` — styled components for both modes

**Data attributes added to existing components:**

- `Header/index.tsx`: `data-onboarding="select-all"` on `SelectAllContainer`,
  `data-onboarding="download-button"` on Download `Button`
- `Toolbar/index.tsx`: `data-onboarding="filter-section"` on `LeftSection`,
  `data-onboarding="rescan-button"` on Rescan `Button`

**Steps:**

1. **Welcome** (dialog) — intro overview
2. **Select images** (spotlight → `[data-onboarding="select-all"]`) — checkboxes, Select All
3. **Filter & sort** (spotlight → `[data-onboarding="filter-section"]`) — search, quality, dimensions
4. **Reset & Rescan** (spotlight → `[data-onboarding="rescan-button"]`) — reset filters, rescan page
5. **Download** (spotlight → `[data-onboarding="download-button"]`) — download, settings in Options
6. **Explore Options?** (dialog) — Yes opens `options.html?onboarding=true`, No closes

**Integration:**

- `<Onboarding />` added to `src/components/Page/index.tsx`
- Exported from `src/components/Page/components/index.ts`

---

## Phase 2: Options Onboarding ✅ IMPLEMENTED

### Architecture: Hybrid Spotlight/Dialog (same as Phase 1)

Reuse the same spotlight infrastructure from Phase 1. The Options page settings sections will get
`data-onboarding` attributes. Steps 1-4 spotlight the corresponding settings section; steps 5-6 use dialog.

### Component: `src/components/OptionsPage/components/OptionsOnboarding/`

**Files to create:**

- `index.tsx` — main component (import shared styles from Page Onboarding or extract shared styles)
- `steps.tsx` — step definitions with `targetSelector` and `tooltipPlacement`
- `styles.ts` — styled components (can re-export shared spotlight styles)

**Data attributes to add to Options page components:**

- `data-onboarding="folder-name"` on the folder name section
- `data-onboarding="rename-pattern"` on the rename section
- `data-onboarding="convert"` on the conversion section
- `data-onboarding="zip-archive"` on the zip section

**Behavior:**

- On mount: check if URL has `?onboarding=true` OR `showOnboardingNextTime` setting is true
- If neither → don't render
- If triggered → show hybrid spotlight/dialog onboarding
- On finish → set `OPTIONS_ONBOARDING_COMPLETED=true`, reset `showOnboardingNextTime=false`

**Steps:**

1. **Folder name** (spotlight) — set a custom download folder for all images
2. **Rename pattern** (spotlight) — batch rename with patterns like `{name}_{index}`
3. **Format conversion** (spotlight) — convert images between formats (e.g. WebP → PNG)
4. **Zip archive** (spotlight) — pack all downloads into a single zip file
5. **Debug & bug reporting** (dialog) — "Export Debug Log" + "Report a Bug" link
6. **All set!** (dialog) — completion, re-enable checkbox mention

**Integration:**

- Add `<OptionsOnboarding />` to `src/components/OptionsPage/index.tsx`
- Export from `src/components/OptionsPage/components/index.ts`

**Shared code consideration:** Consider extracting the spotlight overlay, tooltip positioning logic,
and shared styled components into a shared module (e.g., `src/components/shared/SpotlightOnboarding/`)
to avoid duplication between Page and Options onboarding. This can be done when implementing Phase 2.

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
- Download count: read `usedPageUrls` from `chrome.storage.local` (already tracked by monetization — reuse
  `getMonetizationLimitState().usedCount`)
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
- When checked: also clear `ONBOARDING_COMPLETED`, `OPTIONS_ONBOARDING_COMPLETED`, `OPTIONS_PROMPT_DISMISSED` from
  `chrome.storage.local`
- When unchecked: just update the setting

**Integration:**

- Add to `src/components/OptionsPage/components/DownloadOptions/index.tsx` after `<ResetButton />`
- Export from `src/components/OptionsPage/components/index.ts`

---

## Storage Keys

Add to `StorageKeys` in `src/utils/constants.ts`:

```ts
ONBOARDING_COMPLETED: 'image-downloader-onboarding-completed',
  OPTIONS_ONBOARDING_COMPLETED
:
'image-downloader-options-onboarding-completed',
  OPTIONS_PROMPT_DISMISSED
:
'image-downloader-options-prompt-dismissed',
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

| File                                                                     | Purpose                            |
|--------------------------------------------------------------------------|------------------------------------|
| `src/components/Page/components/Onboarding/index.tsx`                    | Page onboarding stepper            |
| `src/components/Page/components/Onboarding/steps.tsx`                    | Step content for Page              |
| `src/components/Page/components/Onboarding/styles.ts`                    | Styles                             |
| `src/components/OptionsPage/components/OptionsOnboarding/index.tsx`      | Options onboarding stepper         |
| `src/components/OptionsPage/components/OptionsOnboarding/steps.tsx`      | Step content for Options           |
| `src/components/OptionsPage/components/OptionsOnboarding/styles.ts`      | Styles                             |
| `src/components/Page/components/OptionsPrompt/index.tsx`                 | Deferred "explore options?" prompt |
| `src/components/Page/components/OptionsPrompt/styles.ts`                 | Styles                             |
| `src/components/OptionsPage/components/ShowOnboardingCheckbox/index.tsx` | Re-enable checkbox                 |
| `src/components/OptionsPage/components/ShowOnboardingCheckbox/styles.ts` | Styles                             |
| `src/__tests__/onboarding.test.tsx`                                      | Unit tests: Page onboarding        |
| `src/__tests__/optionsOnboarding.test.tsx`                               | Unit tests: Options onboarding     |
| `src/__tests__/optionsPrompt.test.tsx`                                   | Unit tests: deferred prompt        |
| `e2e/onboarding.spec.ts`                                                 | E2E tests: full onboarding flow    |

### Modify

| File                                                              | Change                                           |
|-------------------------------------------------------------------|--------------------------------------------------|
| `src/components/Page/index.tsx`                                   | Add `<Onboarding />` and `<OptionsPrompt />`     |
| `src/components/Page/components/index.ts`                         | Export Onboarding, OptionsPrompt                 |
| `src/components/OptionsPage/index.tsx`                            | Add `<OptionsOnboarding />`                      |
| `src/components/OptionsPage/components/index.ts`                  | Export OptionsOnboarding, ShowOnboardingCheckbox |
| `src/components/OptionsPage/components/DownloadOptions/index.tsx` | Add `<ShowOnboardingCheckbox />`                 |
| `src/utils/constants.ts`                                          | Add 3 new StorageKeys                            |
| `src/store/settingsStore.ts`                                      | Add `showOnboardingNextTime` + setter            |
| `src/store/types.ts`                                              | Add to `SettingsState` interface                 |
| `public/_locales/en/messages.json`                                | Add ~25 onboarding i18n keys                     |

---

## Reusable Code

| What                           | Where                                                       | How                                                  |
|--------------------------------|-------------------------------------------------------------|------------------------------------------------------|
| Dialog + storage check pattern | `src/components/RatingReminderModal/`                       | Same MUI Dialog + chrome.storage.local read on mount |
| Translation hook               | `src/utils/useTranslation.tsx`                              | `useTranslation()` → `t('key')`                      |
| Storage keys                   | `src/utils/constants.ts`                                    | `StorageKeys.*`                                      |
| Fallback storage               | `src/store/fallbackStorage.ts`                              | For zustand persist                                  |
| Open options page              | `src/components/Page/components/SettingsButton/`            | `chrome.runtime.openOptionsPage()`                   |
| Download count                 | `src/utils/monetization.ts` → `getMonetizationLimitState()` | `usedCount` for deferred trigger                     |
| Install date                   | Background sets `installDate` in `chrome.storage.sync`      | Read for 7-day trigger                               |
| Bug report link                | `ApplicationLinks.BUG_REPORT_FORM` in constants             | For Options onboarding step 5                        |

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
