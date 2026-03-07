Perfect. Below is a **clean, structured technical specification + acceptance criteria** in English, formatted so you can
paste it directly into Claude CLI and execute step-by-step.

---

# PROJECT: Image Downloader – Stability & Revenue Optimization Sprint

## Objective

Increase retention, ratings, and revenue by:

1. Fixing “Download doesn’t start” issues
2. Ensuring original-size image downloads
3. Improving compatibility with SPA / modern frameworks (React, Flutter Web)
4. Adding diagnostic logging
5. Reducing uninstall friction

Primary KPI:

- Reduce “doesn’t work” complaints by 70%
- Increase rating toward 4.3+
- Improve paid conversion

---

# TASK 1 — Fix “Download Doesn’t Start”

## Problem

Users report:

- “Download button isn’t working”
- “Nothing happens”
- “Downloading doesn’t start”

Likely causes:

- MV3 service worker termination
- chrome.downloads API failure
- Missing permissions
- Blob URL issues
- CORS restrictions
- Silent promise rejection

---

## Implementation Requirements

### 1. Add deterministic download flow

Refactor download logic so that:

- Every download request:

  - Returns a resolved success state
  - Or returns a structured error object

- No silent failures allowed

Use structured result pattern:

```
{
  success: boolean,
  errorCode?: string,
  errorMessage?: string
}
```

---

### 2. Add full error logging layer

Add centralized logging utility:

- Logs:

  - download start
  - download success
  - download failure
  - error stack
  - URL attempted
  - file name
  - site domain

- Logs stored temporarily in local storage
- Add “Export Debug Log” button in settings

---

### 3. Handle MV3 Service Worker reliability

If using Manifest V3:

- Ensure background service worker is not relied upon for long-running download logic
- Move critical logic to:

  - content script OR
  - use chrome.downloads directly from extension context

- Verify no race condition between popup close and download trigger

---

### 4. Add fallback mechanism

If `chrome.downloads.download()` fails:

Fallback strategy:

1. Try direct download
2. If fails → fetch as blob → create object URL → trigger anchor click
3. If fails → open image in new tab

---

## Acceptance Criteria

- Clicking Download always results in:

  - A visible browser download OR
  - A visible error notification

- No silent failures
- Error log captures at least:

  - URL
  - domain
  - error stack

- Tested successfully on:

  - Static website
  - React SPA
  - Flutter Web site

- 0 uncaught promise rejections in console

---

# TASK 2 — Ensure Original-Size Image Download

## Problem

Users complain:

- Downloads previews instead of originals
- Low resolution images
- Only thumbnails detected

---

## Implementation Requirements

### 1. Improve image source detection

When parsing images:

Extract from:

- img.src
- img.srcset (select highest resolution candidate)
- data-src
- data-original
- data-lazy
- background-image (computed style)
- picture > source

---

### 2. Resolve original image URLs

Implement URL normalization strategy:

- Remove common resize params:

  - ?w=
  - ?width=
  - ?size=
  - &quality=

- Detect CDN patterns
- Attempt highest-resolution srcset candidate

---

### 3. Add resolution comparison logic

If multiple URLs available:

- Prefer largest resolution
- Use naturalWidth/naturalHeight if available
- Sort descending by size

---

### 4. Add optional “Force original detection” toggle (Advanced)

If enabled:

- Aggressively attempt URL reconstruction
- Remove resizing query params

---

## Acceptance Criteria

- On test page with thumbnails + originals:

  - Extension downloads highest resolution version

- On sites using lazy loading:

  - Images are detected correctly

- On srcset-based pages:

  - Largest resolution candidate is selected

- Resolution difference verified manually in test

---

# TASK 3 — Improve SPA / Modern Website Compatibility

## Problem

Fails on:

- React
- Flutter Web
- Infinite scroll pages
- Dynamically injected content

---

## Implementation Requirements

### 1. Add MutationObserver

- Observe DOM changes
- Re-scan for images on:

  - node insert
  - attribute change

Debounce scan for performance.

---

### 2. Add “Rescan Page” button

Manual trigger:

- Forces fresh scan
- Clears cached results

---

### 3. Delay initial scan

Wait:

- DOMContentLoaded
- - small delay (e.g. 500–1000ms)
- Optional: wait until network idle

---

## Acceptance Criteria

- Works on:

  - React SPA
  - Infinite scroll page
  - Flutter Web demo site

- New images added dynamically are detected
- Rescan button works reliably

---

# TASK 4 — Improve Uninstall Feedback System

## Problem

Uninstall survey gives mostly useless noise.

---

## Implementation Requirements

Before uninstall redirect, show modal:

“What went wrong?”

Checkbox options:

- Download didn’t start
- Couldn’t get original size
- Limit reached
- Doesn’t work on specific site
- Other

If user selects:

- “Doesn’t work on specific site” → auto capture domain
- “Download didn’t start” → offer “Send debug report”

---

## Acceptance Criteria

- Domain auto-collected
- Debug logs exportable
- Survey responses structured
