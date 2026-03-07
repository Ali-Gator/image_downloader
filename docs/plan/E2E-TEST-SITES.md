# Manual E2E Test Sites

> Use these sites to verify extension behavior before and after each task.
> Run through the checklist after completing each task to ensure no regressions.

## Test Matrix

### Category 1: Static Pages (baseline — must always work)

| Site | What to test | Expected |
|---|---|---|
| https://en.wikipedia.org/wiki/Cat | Basic `<img>` detection, multiple images | 20+ images, various sizes |
| https://www.bbc.com/news | News page with diverse image types | Images detected, multiple sizes |
| https://unsplash.com/s/photos/nature | High-res photography, lazy loading | Original-size images, not thumbnails |

### Category 2: `srcset` / `<picture>` (TASK-2)

| Site | What to test | Expected |
|---|---|---|
| https://web.dev/learn/design/responsive-images | Page with `srcset` examples and `<picture>` elements | Highest-res srcset candidate selected |
| https://www.apple.com | Heavy `<picture>` and `srcset` usage | Large product images, not mobile thumbnails |
| https://www.nytimes.com | News with responsive images | Full-res article images |

### Category 3: Lazy Loading / `data-src` (TASK-2)

| Site | What to test | Expected |
|---|---|---|
| https://unsplash.com/s/photos/landscape | Intersection Observer lazy loading | After scroll + rescan, images detected |
| https://www.instagram.com (logged out) | `data-src` / lazy patterns | At least explore page images found |
| https://www.amazon.com | Product images, lazy loading, CDN resize params (`?w=`) | Product images detected |

### Category 4: CSS Background Images (TASK-2 / TASK-4)

| Site | What to test | Expected |
|---|---|---|
| https://www.airbnb.com | Hero images as CSS `background-image` | Hero/banner images appear in list |
| Any landing page with hero banner | `background-image` in CSS | Background image URL collected |

### Category 5: SPA / Dynamic Content (TASK-3)

| Site | What to test | Expected |
|---|---|---|
| https://react.dev | React SPA, images load after hydration | Images found (not 0) |
| Any Next.js app (e.g. https://vercel.com) | SSR + client-side hydration | Images found after initial delay |
| Infinite scroll page (e.g. https://unsplash.com) | Scroll down, click Rescan | New images merged into list |

### Category 6: Flutter Web / Canvas Apps (TASK-4)

| Site | What to test | Expected |
|---|---|---|
| https://portocupecoy.com | Flutter Web (CanvasKit), user-reported | Images found via Performance API |
| https://flutter.github.io/samples/web/material3_demo/ | Flutter Material 3 demo | At least some images/icons detected |
| https://rive.app | Flutter Web production app | Images found |
| https://fluttergallery.com (if available) | Flutter gallery | Images detected |

### Category 7: Download Reliability (TASK-1)

| Site | What to test | Expected |
|---|---|---|
| https://en.wikipedia.org/wiki/Cat | Download single image | Download starts, success notification |
| https://unsplash.com/s/photos/nature | Download single high-res image | Full-size file saved |
| Any site | Bulk download (select all, download) | All images download, partial failure shows count |
| chrome://extensions | Open popup on unsupported page | Error message, not silent failure |

## Checklist Template

Copy this for each task completion:

```
### Post-[TASK-N] E2E Verification — Date: ____

- [ ] Cat 1 (Static): Wikipedia — count: ___, downloads work: Y/N
- [ ] Cat 1 (Static): BBC News — count: ___, downloads work: Y/N
- [ ] Cat 2 (srcset): apple.com — highest-res selected: Y/N
- [ ] Cat 3 (Lazy): unsplash.com — images after scroll: Y/N
- [ ] Cat 4 (CSS bg): airbnb.com hero — detected: Y/N
- [ ] Cat 5 (SPA): react.dev — images found: ___ (not 0)
- [ ] Cat 6 (Flutter): portocupecoy.com — images found: ___ (not 0)
- [ ] Cat 7 (Download): single image — works: Y/N
- [ ] Cat 7 (Download): bulk download — success/total: ___/___
- [ ] Cat 7 (Download): unsupported page — error shown: Y/N
```

## Notes

- Always test with a fresh build: `yarn build`, then reload unpacked extension
- Clear extension storage between tests if behavior seems stale: remove/re-add extension
- Some sites (Instagram, Amazon) may behave differently when logged in/out
- Flutter sites may take 3-5 seconds to fully load — wait before clicking extension
