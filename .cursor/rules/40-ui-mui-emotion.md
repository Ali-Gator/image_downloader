## UI conventions (React + MUI + Emotion)

### Theme usage
- App theme is defined in `src/theme/index.ts` and provided via `ThemeProvider` in each React entrypoint container.
- **Do** use `theme.palette`, `theme.spacing`, and `theme.typography` from the theme for consistent visuals.
- **Do not** hardcode colors/spacings when a theme token exists.

### Styling approach
- Primary style mechanism: MUI `styled(...)` (Emotion) in a colocated `styles.ts`.
  - Example pattern: `src/components/Popup/index.tsx` + `src/components/Popup/styles.ts`.
- `sx={{...}}` is acceptable for small one-off tweaks, but avoid turning it into a full styling system.

### Component structure
- Prefer:
  - `src/components/<Area>/index.tsx` as the main component
  - `src/components/<Area>/styles.ts` for styled building blocks
  - `src/components/<Area>/components/*` for subcomponents (each can have its own `styles.ts`)
- Re-export public components via `src/components/index.ts`.

### Providers & app bootstrap
- UI containers typically wrap the app with:
  - `<ThemeProvider theme={theme}>`
  - `<CssBaseline />`
  - `<SnackbarProvider ...>`
  - `<ErrorBoundary>`
- Keep this consistent across popup/page/options containers unless there is a strong reason to diverge.

### UX rules (extension context)
- Prefer non-blocking user feedback:
  - notistack snackbars for transient notifications
  - `alert(...)` only via `handleError(..., showAlert=true)` when you must block
- Always handle unsupported pages gracefully (web store, internal URLs, file URLs).


