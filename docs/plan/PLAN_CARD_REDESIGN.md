# Image Card Redesign — Implementation Plan

## Overview

Redesign the ImageCard component to improve UX: simplify info density, replace the enhanced badge with card-level
treatment, add lightbox preview, and provide original/enhanced resolution toggle.

**Affected components (read before each step):**

- `src/components/Page/components/ImageCard/index.tsx` + `styles.ts`
- `src/components/Page/components/ImageInfo/index.tsx` + `styles.ts`
- `src/components/Page/components/ImageGrid/index.tsx` + `styles.tsx`
- `src/components/Page/components/SafeImage/index.tsx`
- `src/store/imageStore.ts`
- `src/types/index.ts` (ImageData interface)
- `src/theme/index.ts` (colors, palette)
- `public/_locales/en/messages.json` (i18n keys)

---

## Step 1: Simplify Grid Info Area

**Goal:** Replace the row of individual badges with compact inline text + single quality badge.

### Current state

Grid card info area renders 5 separate styled badges in `DimensionsContainer`:

```
[192 × 240] [135 KB] [JPEG] [LOW] [✨]
```

Each badge has its own styled component with border, background, padding — creating visual clutter and wrapping issues
on narrow cards (min 180px).

### Design

```
cookiepref.png
203 × 35 · 35 KB · PNG  LOW
```

- **Line 1**: filename (unchanged — truncated, monospace-ish, ellipsis)
- **Line 2**: dimensions · filesize · extension as a single `<span>` with interpunct (·) separators, followed by the
  quality badge as the **only** colored badge
- Font: inherit from current Dimensions style (`0.6875rem`, `JetBrains Mono`, `text.secondary`)
- The `·` separator: `text.tertiary` color (#9C9C96 from theme)
- Enhanced badge: **removed entirely** (will be replaced in Step 2)

### Files to modify

| File | Change |
|---|---|
| `src/components/Page/components/ImageInfo/index.tsx` | Restructure grid-mode rendering: replace individual badge components with a single `MetadataLine` span. Keep list-mode rendering unchanged. Remove `EnhancedBadge` usage. |
| `src/components/Page/components/ImageInfo/styles.ts` | Add `MetadataLine` styled component. Remove `EnhancedBadge` export (move to unused). Keep `Dimensions`, `FileSize`, `FileExtension` for list-mode. |

### Implementation

In `ImageInfo/index.tsx`, for grid mode only (when `!isListMode`), replace the `DimensionsContainer` contents:

```tsx
{/* Grid mode: compact inline metadata */}
{!isListMode && (
  <DimensionsContainer className="dimensions-container">
    <MetadataLine>
      {dimensionsDisplay}
      {formattedFileSize && <Separator>·</Separator>}
      {formattedFileSize}
      <Separator>·</Separator>
      {fileExtension}
    </MetadataLine>
    <QualityBadge quality={qualityLevel} title={`${t('image_quality')} ${qualityLabel}`}>
      {qualityLabel}
    </QualityBadge>
  </DimensionsContainer>
)}

{/* List mode: keep existing individual badges */}
{isListMode && (
  <DimensionsContainer className="dimensions-container">
    <Dimensions className="dimensions">{dimensionsDisplay}</Dimensions>
    {formattedFileSize && <FileSize className="file-size">{formattedFileSize}</FileSize>}
    <FileExtension className="file-extension">{fileExtension}</FileExtension>
    <QualityBadge quality={qualityLevel} title={`${t('image_quality')} ${qualityLabel}`}>
      {qualityLabel}
    </QualityBadge>
  </DimensionsContainer>
)}
```

New `MetadataLine` styled component in `styles.ts`:

```ts
export const MetadataLine = styled('span')(({ theme }) => ({
  fontSize: '0.6875rem',
  fontFamily: '"JetBrains Mono", monospace',
  color: theme.palette.text.secondary,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

export const Separator = styled('span')(({ theme }) => ({
  margin: '0 3px',
  color: theme.palette.text.disabled,
}));
```

### Acceptance criteria

- [ ] Grid mode: metadata displays as `203 × 35 · 35 KB · PNG` in a single line, no wrapping
- [ ] Grid mode: only QualityBadge remains as a colored badge element
- [ ] Grid mode: EnhancedBadge (`✨`) is no longer rendered
- [ ] List mode: rendering is unchanged (individual badges still shown)
- [ ] No visual regression in list mode
- [ ] `npm run build` passes, no TS errors
- [ ] Verify on cards of different widths (resize browser) — text truncates with ellipsis, never wraps

### Tests

Create `src/__tests__/ImageInfo.test.tsx`:

```ts
describe('ImageInfo', () => {
  describe('grid mode', () => {
    it('renders metadata as inline text with separators', () => {
      // Setup: image with width=800, height=600, fileSize=50000, filename='test.jpg'
      // Assert: text content contains '800 × 600'
      // Assert: text content contains '·' separators
      // Assert: no EnhancedBadge element present
    });

    it('renders quality badge as the only colored badge', () => {
      // Assert: QualityBadge is rendered
      // Assert: no Dimensions, FileSize, FileExtension badge components
    });

    it('omits file size separator when fileSize is missing', () => {
      // Setup: image with fileSize=0
      // Assert: no double separators '· ·'
    });
  });

  describe('list mode', () => {
    it('renders individual badge components', () => {
      // Assert: Dimensions, FileSize, FileExtension, QualityBadge all present
    });
  });
});
```

---

## Step 2: Enhanced Card Treatment

**Goal:** Replace the removed `✨` badge with a card-level visual indicator for enhanced images.

### Design

Enhanced cards get:

1. **Left accent border** — a 3px left border with a subtle gradient (`#7c4dff` → `#2D5BE3`, purple-to-blue from theme
   colors). Applied via a `::before` pseudo-element on the card.
2. **"Enhanced" label on hover** — in grid mode, show a small pill label "Enhanced" in the top-left of the action bar
   (next to the checkbox), using the same purple tint as the old badge. Visible only on hover (same opacity transition
   as the action bar).

This works in both grid and list modes (the accent border is universal).

### Files to modify

| File | Change |
|---|---|
| `src/components/Page/components/ImageCard/index.tsx` | Pass `image.enhanced` to card styles. Add "Enhanced" label in top action bar when enhanced. |
| `src/components/Page/components/ImageCard/styles.ts` | Add `enhancedCardStyles` with `::before` pseudo-element for the left accent border. Add `EnhancedLabel` styled component. |
| `public/_locales/en/messages.json` | Add key `enhanced_label`: `"Enhanced"` |
| `src/components/Page/components/ImageInfo/index.tsx` | Remove the `EnhancedBadge` import and rendering (if not already removed in Step 1). |
| `src/components/Page/components/ImageInfo/styles.ts` | Remove `EnhancedBadge` styled component export. |

### Implementation

In `ImageCard/styles.ts`, add enhanced card styles:

```ts
// Applied conditionally when image.enhanced is true
export const enhancedAccentStyles: SxProps<Theme> = {
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '8px',
    bottom: '8px',
    width: '3px',
    borderRadius: '0 3px 3px 0',
    background: 'linear-gradient(180deg, #7c4dff 0%, #2D5BE3 100%)',
    zIndex: 1,
  },
};

export const EnhancedLabel = styled('span')(({ theme }) => ({
  fontSize: '0.625rem',
  fontWeight: 600,
  color: '#7c4dff',
  backgroundColor: 'rgba(103, 58, 183, 0.10)',
  border: '1px solid rgba(103, 58, 183, 0.25)',
  borderRadius: 4,
  padding: '1px 6px',
  height: '20px',
  display: 'inline-flex',
  alignItems: 'center',
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
}));
```

In `ImageCard/index.tsx`, merge enhanced styles conditionally:

```tsx
const cardStyles = isListMode
  ? listImageItemStyles(theme)
  : gridImageItemStyles(theme);

const mergedStyles = image.enhanced
  ? { ...cardStyles, ...enhancedAccentStyles }
  : cardStyles;

// In the top action bar, after CheckboxButton:
<TopBarLeftSection>
  <CheckboxButton checked={isSelected} readOnly />
  {image.enhanced && <EnhancedLabel>{t('enhanced_label')}</EnhancedLabel>}
</TopBarLeftSection>
```

### Acceptance criteria

- [ ] Enhanced images show a 3px purple-to-blue gradient accent on the left edge
- [ ] Accent is visible without hover (always shown for enhanced cards)
- [ ] Accent has 8px inset from top and bottom (not full-height, looks intentional)
- [ ] In grid mode, hovering an enhanced card reveals "ENHANCED" label next to checkbox
- [ ] Non-enhanced images have no accent and no label
- [ ] Works in both grid and list view modes
- [ ] `EnhancedBadge` (`✨`) is fully removed from codebase (component + styled)
- [ ] `npm run build` passes

### Tests

Add to `src/__tests__/ImageCard.test.tsx`:

```ts
describe('ImageCard enhanced treatment', () => {
  it('applies enhanced accent styles when image.enhanced is true', () => {
    // Render card with enhanced image
    // Assert: card element has ::before pseudo-element (check computed style or class)
  });

  it('does not apply enhanced styles for non-enhanced images', () => {
    // Render card with non-enhanced image
    // Assert: no enhanced accent
  });

  it('shows Enhanced label on hover in grid mode', () => {
    // Render enhanced card in grid mode
    // Assert: EnhancedLabel text "Enhanced" is in DOM (hidden via CSS, but present)
  });
});
```

---

## Step 3: Image Lightbox Preview

**Goal:** Click on the image area to open a fullscreen lightbox overlay showing the image at full resolution with
metadata.

### Design

```
┌─────────────────────────────────────────────────────────────────┐
│                                                            [X]  │
│                                                                 │
│                                                                 │
│                    ┌─────────────────────┐                      │
│                    │                     │                      │
│                    │                     │                      │
│                    │     Full-size       │                      │
│                    │      image          │                      │
│                    │                     │                      │
│                    │                     │                      │
│                    └─────────────────────┘                      │
│                                                                 │
│              photo_2024.jpg                                     │
│              1920 × 1080 · 2.5 MB · JPEG   HD                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- **Backdrop**: semi-transparent black (`rgba(0,0,0,0.85)`)
- **Image**: `object-fit: contain`, max 85vh height, max 90vw width, centered
- **Close**: click backdrop or X button (top-right) or Escape key
- **Metadata**: below the image, centered, using the same compact format from Step 1
- **Animation**: fade-in 200ms (backdrop + image scale from 0.95 to 1)
- **Navigation arrows**: left/right arrows to browse between images without closing the lightbox

### Navigation

- **Left/right arrow buttons** on the sides of the image (semi-transparent, visible on hover over the respective half)
- **Keyboard**: ArrowLeft / ArrowRight to navigate, in addition to Escape to close
- Navigation cycles through `filteredImages` array (the same list visible in the grid/list)
- **Counter**: show `3 / 42` (current index / total) in the bottom-right of the metadata bar
- When navigating, the image crossfades (opacity transition, no sliding)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                            [X]  │
│                                                                 │
│                                                                 │
│   [<]          ┌─────────────────────┐              [>]         │
│                │                     │                          │
│                │     Full-size       │                          │
│                │      image          │                          │
│                │                     │                          │
│                └─────────────────────┘                          │
│                                                                 │
│              photo_2024.jpg                                     │
│              1920 × 1080 · 2.5 MB · JPEG   HD        3 / 42    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Arrow buttons styling:**
- Position: absolute, vertically centered, left/right edges with 16px inset
- Size: 40px circle, `rgba(255,255,255,0.1)` background, `rgba(255,255,255,0.6)` icon
- Hover: `rgba(255,255,255,0.2)` background, `rgba(255,255,255,0.9)` icon
- Hidden when at first/last image (no cycling past boundaries)
- MUI icons: `ChevronLeftIcon` / `ChevronRightIcon`

### Interaction change

Currently clicking anywhere on the card toggles selection. New behavior:

- **Click on image area** (`StyledImageContainer` / `.image-container`) → open lightbox
- **Click elsewhere on card** (info area, padding, action bar background) → toggle selection
- **Action buttons** (copy, download) → unchanged, handled by `event.target.closest('button')`

### Files to create

| File | Purpose |
|---|---|
| `src/components/Page/components/ImageLightbox/index.tsx` | Lightbox component |
| `src/components/Page/components/ImageLightbox/styles.ts` | Styled components |

### Files to modify

| File | Change |
|---|---|
| `src/components/Page/components/ImageCard/index.tsx` | Add click handler on image container to open lightbox. Add lightbox state. |
| `src/store/imageStore.ts` | Add `lightboxImageId: string \| null` and `setLightboxImageId(id)` action |
| `src/components/Page/components/ImageGrid/index.tsx` | Render `<ImageLightbox />` once (portal, outside virtuoso) |
| `public/_locales/en/messages.json` | Add keys: `close_lightbox`: `"Close preview"`, `prev_image`: `"Previous image"`, `next_image`: `"Next image"` |

### Implementation

**Store changes** (`imageStore.ts`):

```ts
// Add to state interface:
lightboxImageId: string | null;

// Add to actions:
setLightboxImageId: (id: string | null) => void;

// Implementation:
lightboxImageId: null,
setLightboxImageId: (id) => set({ lightboxImageId: id }),
```

Navigation is computed inside the component from `filteredImages` + `lightboxImageId` — no extra store state needed.

**ImageCard changes** — separate click handlers:

```tsx
const handleImageClick = useCallback(
  (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation(); // Prevent card selection
    setLightboxImageId(id);
  },
  [id, setLightboxImageId],
);

// In JSX:
<StyledImageContainer className="image-container" onClick={handleImageClick}>
  <SafeImage src={src} alt={alt || filename} />
</StyledImageContainer>
```

**ImageLightbox component:**

```tsx
export const ImageLightbox: FC = () => {
  const { lightboxImageId, setLightboxImageId, filteredImages } = useImageStore();

  const currentIndex = filteredImages.findIndex((img) => img.id === lightboxImageId);
  const image = currentIndex >= 0 ? filteredImages[currentIndex] : null;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < filteredImages.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev) setLightboxImageId(filteredImages[currentIndex - 1].id);
  }, [hasPrev, currentIndex, filteredImages, setLightboxImageId]);

  const goToNext = useCallback(() => {
    if (hasNext) setLightboxImageId(filteredImages[currentIndex + 1].id);
  }, [hasNext, currentIndex, filteredImages, setLightboxImageId]);

  useEffect(() => {
    if (!lightboxImageId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImageId(null);
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImageId, setLightboxImageId, goToPrev, goToNext]);

  if (!image) return null;

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) setLightboxImageId(null);
  };

  return createPortal(
    <Backdrop onClick={handleBackdropClick}>
      <CloseButton onClick={() => setLightboxImageId(null)}>
        <CloseIcon />
      </CloseButton>

      {hasPrev && (
        <NavButton position="left" onClick={goToPrev}>
          <ChevronLeftIcon />
        </NavButton>
      )}
      {hasNext && (
        <NavButton position="right" onClick={goToNext}>
          <ChevronRightIcon />
        </NavButton>
      )}

      <ImageWrapper>
        <LightboxImage src={image.src} alt={image.alt || image.filename} />
      </ImageWrapper>

      <MetadataBar>
        <FileName>{image.filename}</FileName>
        <MetadataLine>
          {image.width} × {image.height} · {formatFileSize(image.fileSize)} · {getFileExtension(image.filename)}
        </MetadataLine>
        <MetadataRow>
          <QualityBadge quality={getQualityFromDimensions(image.width, image.height)}>
            {qualityLabel}
          </QualityBadge>
          <Counter>{currentIndex + 1} / {filteredImages.length}</Counter>
        </MetadataRow>
      </MetadataBar>
    </Backdrop>,
    document.body,
  );
};
```

**Styled components** (`ImageLightbox/styles.ts`):

```ts
export const Backdrop = styled('div')({
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  animation: 'fadeIn 200ms ease',
  cursor: 'zoom-out',
  '@keyframes fadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
});

export const LightboxImage = styled('img')({
  maxHeight: '85vh',
  maxWidth: '90vw',
  objectFit: 'contain',
  borderRadius: 4,
  animation: 'scaleIn 200ms ease',
  cursor: 'default',
  '@keyframes scaleIn': {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
});

export const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  color: 'rgba(255,255,255,0.7)',
  '&:hover': { color: '#fff' },
}));

export const MetadataBar = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
  textAlign: 'center',
  color: 'rgba(255,255,255,0.8)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

export const NavButton = styled(IconButton)<{ position: 'left' | 'right' }>(
  ({ position }) => ({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    ...(position === 'left' ? { left: 16 } : { right: 16 }),
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.6)',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.2)',
      color: 'rgba(255,255,255,0.9)',
    },
  }),
);

export const MetadataRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
});

export const Counter = styled('span')({
  fontSize: '0.75rem',
  color: 'rgba(255,255,255,0.5)',
  fontFamily: '"JetBrains Mono", monospace',
});
```

### Acceptance criteria

- [ ] Clicking the image preview area (not info, not action buttons) opens the lightbox
- [ ] Clicking elsewhere on the card still toggles selection (no regression)
- [ ] Lightbox shows image at full available resolution, centered on screen
- [ ] Metadata displayed below: filename, dimensions · filesize · extension, quality badge
- [ ] Close via: backdrop click, X button, Escape key
- [ ] Fade-in animation on open (200ms)
- [ ] Lightbox uses `createPortal` to render outside the virtuoso container
- [ ] Only one lightbox instance exists (rendered in ImageGrid, not per-card)
- [ ] **Navigation**: left/right arrow buttons on sides of the image
- [ ] **Navigation**: ArrowLeft/ArrowRight keyboard shortcuts work
- [ ] **Navigation**: arrows hidden at first/last image (no wrapping)
- [ ] **Counter**: `3 / 42` format shown in metadata bar
- [ ] `npm run build` passes
- [ ] Works in both grid and list view modes

### Tests

Create `src/__tests__/ImageLightbox.test.tsx`:

```ts
describe('ImageLightbox', () => {
  it('renders nothing when lightboxImageId is null', () => {
    // Assert: no backdrop in DOM
  });

  it('renders image and metadata when lightboxImageId is set', () => {
    // Setup: set lightboxImageId to a valid image id
    // Assert: backdrop rendered
    // Assert: image with correct src
    // Assert: filename text present
    // Assert: dimensions text present
  });

  it('closes on Escape key', () => {
    // Setup: open lightbox
    // Action: fireEvent.keyDown(document, { key: 'Escape' })
    // Assert: lightboxImageId set to null
  });

  it('closes on backdrop click', () => {
    // Setup: open lightbox
    // Action: click the backdrop (not the image)
    // Assert: lightboxImageId set to null
  });

  it('does not close when clicking the image itself', () => {
    // Setup: open lightbox
    // Action: click on the img element
    // Assert: lightboxImageId remains set
  });

  it('navigates to next image on ArrowRight', () => {
    // Setup: open lightbox on first image, filteredImages has 3 items
    // Action: fireEvent.keyDown(document, { key: 'ArrowRight' })
    // Assert: lightboxImageId changes to second image's id
  });

  it('navigates to previous image on ArrowLeft', () => {
    // Setup: open lightbox on second image
    // Action: fireEvent.keyDown(document, { key: 'ArrowLeft' })
    // Assert: lightboxImageId changes to first image's id
  });

  it('hides left arrow on first image', () => {
    // Setup: open lightbox on first image
    // Assert: left NavButton not in DOM
    // Assert: right NavButton is in DOM
  });

  it('hides right arrow on last image', () => {
    // Setup: open lightbox on last image
    // Assert: right NavButton not in DOM
    // Assert: left NavButton is in DOM
  });

  it('shows image counter', () => {
    // Setup: open lightbox on 3rd image out of 42
    // Assert: text '3 / 42' present
  });
});
```

Add to `src/__tests__/ImageCard.test.tsx`:

```ts
describe('ImageCard click behavior', () => {
  it('opens lightbox when clicking the image area', () => {
    // Action: click on .image-container
    // Assert: setLightboxImageId called with image id
  });

  it('toggles selection when clicking outside image area', () => {
    // Action: click on info area
    // Assert: toggleSelectImage called
  });
});
```

---

## Step 4: Resolution Toggle for Enhanced Images

**Goal:** Let users switch between original and enhanced versions of an image.

### Design

For enhanced images (`image.enhanced && image.originalSrc`), show a toggle in two places:

#### A. In the card (both grid and list modes)

A small icon button in the info area, after the metadata line / badges row. Toggle between two states:

- **Enhanced** (default): shows enhanced src, normal metadata
- **Original**: shows original src, original dimensions (need to probe or store)

Visual: a small `<SwapHorizIcon>` (MUI) button, 18px, with tooltip "Switch to original" / "Switch to enhanced".

- **Grid mode**: placed at the end of the `MetadataLine`, inline with quality badge
- **List mode**: placed in the `DimensionsContainer`, after the quality badge (same position where `EnhancedBadge` used to be)

Both modes use the same `SwapButton` styled component — just a small icon button that fits naturally into the row.

#### B. In the lightbox

A more prominent toggle below the image, above metadata:

```
  [ Original 192×240 ]  [ Enhanced 1920×1080 ]
```

Two pill buttons, active state highlighted. Switching updates the displayed image and metadata in real-time.

### Data model change

Current `ImageData` stores `originalSrc` but not original dimensions. We need original dimensions to show them in the
toggle.

In `src/types/index.ts`, add to `ImageData`:

```ts
originalWidth?: number;
originalHeight?: number;
```

In the enhancement flow (`src/contentScript/content-script.ts`), before updating the image, save original dimensions:

```ts
// Before overwriting with enhanced values:
image.originalWidth = image.width;
image.originalHeight = image.height;
```

### Store changes

In `imageStore.ts`, add a per-image override map:

```ts
// State:
imageSourceOverrides: Record<string, 'original' | 'enhanced'>;

// Actions:
toggleImageSource: (imageId: string) => void;
getEffectiveImage: (image: ImageData) => ImageData; // returns image with src/dimensions swapped if override is 'original'
```

The override map approach means we don't mutate the image data — we just track which version the user wants to see/download per image.

### Files to modify

| File | Change |
|---|---|
| `src/types/index.ts` | Add `originalWidth?`, `originalHeight?` to ImageData |
| `src/contentScript/content-script.ts` | Save `originalWidth`/`originalHeight` before enhancement |
| `src/store/imageStore.ts` | Add `imageSourceOverrides` map and `toggleImageSource` action |
| `src/components/Page/components/ImageInfo/index.tsx` | Add swap button for enhanced images in grid mode |
| `src/components/Page/components/ImageLightbox/index.tsx` | Add resolution toggle pills |
| `src/components/Page/components/ImageLightbox/styles.ts` | Add toggle pill styles |
| `src/utils/downloadWithConversion.ts` | Respect source override when downloading |
| `src/utils/zipArchive.ts` | Respect source override when adding to ZIP |
| `public/_locales/en/messages.json` | Add keys: `switch_to_original`, `switch_to_enhanced`, `original_label`, `enhanced_label_resolution` |

### Implementation sketch

**ImageInfo** (both grid and list modes, enhanced images only):

The swap button is rendered inside `DimensionsContainer` in both modes — after the quality badge:

```tsx
// Shared swap button — same in grid and list modes
const swapButton = image.enhanced && image.originalSrc && (
  <Tooltip title={isShowingOriginal ? t('switch_to_enhanced') : t('switch_to_original')}>
    <SwapButton onClick={(e) => { e.stopPropagation(); toggleImageSource(image.id); }}>
      <SwapHorizIcon sx={{ fontSize: 14 }} />
    </SwapButton>
  </Tooltip>
);

// In both grid and list DimensionsContainer, after QualityBadge:
<QualityBadge ...>{qualityLabel}</QualityBadge>
{swapButton}
```

**Lightbox** (enhanced images):

```tsx
{image.enhanced && image.originalSrc && (
  <ResolutionToggle>
    <TogglePill
      active={isShowingOriginal}
      onClick={() => setOverride('original')}
    >
      Original {image.originalWidth}×{image.originalHeight}
    </TogglePill>
    <TogglePill
      active={!isShowingOriginal}
      onClick={() => setOverride('enhanced')}
    >
      Enhanced {image.width}×{image.height}
    </TogglePill>
  </ResolutionToggle>
)}
```

### Acceptance criteria

- [ ] Enhanced images show a swap icon button in info area (both grid and list modes)
- [ ] Clicking swap toggles between original and enhanced src/dimensions
- [ ] Toggle state persists until page reload (in-memory only)
- [ ] Lightbox shows two pill buttons for enhanced images: "Original WxH" and "Enhanced WxH"
- [ ] Active pill is visually highlighted
- [ ] Switching in lightbox updates the displayed image immediately
- [ ] Download respects the current toggle state (downloads whichever version is active)
- [ ] ZIP archive respects the current toggle state
- [ ] Non-enhanced images show no toggle UI
- [ ] `originalWidth` and `originalHeight` are saved during enhancement
- [ ] `npm run build` passes

### Tests

Add to `src/__tests__/imageStore.test.ts`:

```ts
describe('imageSourceOverrides', () => {
  it('defaults to empty overrides', () => {
    expect(store.getState().imageSourceOverrides).toEqual({});
  });

  it('toggles image source between original and enhanced', () => {
    store.getState().toggleImageSource('img-1');
    expect(store.getState().imageSourceOverrides['img-1']).toBe('original');

    store.getState().toggleImageSource('img-1');
    expect(store.getState().imageSourceOverrides['img-1']).toBe('enhanced');
  });
});
```

Create `src/__tests__/ImageLightbox.test.tsx` (extend from Step 3):

```ts
describe('resolution toggle', () => {
  it('shows toggle pills for enhanced images', () => {
    // Setup: enhanced image with originalSrc, originalWidth, originalHeight
    // Assert: two pill buttons visible
  });

  it('does not show toggle for non-enhanced images', () => {
    // Setup: non-enhanced image
    // Assert: no toggle pills
  });

  it('switches displayed image when toggling', () => {
    // Action: click "Original" pill
    // Assert: img src changes to originalSrc
    // Assert: dimensions update to originalWidth × originalHeight
  });
});
```

---

## Execution Order

| Step | Scope | Depends on |
|---|---|---|
| Step 1 | Simplify grid info area | — |
| Step 2 | Enhanced card treatment | Step 1 (enhanced badge already removed) |
| Step 3 | Image lightbox | — (independent, but cleaner after Step 1) |
| Step 4 | Resolution toggle | Step 2 + Step 3 (uses lightbox + enhanced styles) |

Each step is self-contained and results in a working, shippable state. Steps 1-2 can be committed together if preferred
(they both touch ImageInfo). Steps 3-4 each introduce new components.
