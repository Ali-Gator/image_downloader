## State management & persistence (Zustand)

### Store conventions
- Store hooks live in `src/store/*` and are re-exported from `src/store/index.ts`.
  - Examples: `useImageStore`, `useSettingsStore`, `useRatingStore`.
- Stores expose:
  - **state fields** (plain data)
  - **actions** (functions that update state)

### Persistence
- Settings use `persist` + `createJSONStorage` with `fallbackStorage`:
  - primary target: `chrome.storage.local` (extension environment)
  - fallback: `localStorage` (dev/non-extension contexts)
- **Do** preserve the persisted schema:
  - Zustand persist stores `{ state: {...}, version: number }`
  - `refreshSettings()` reads `parsedData.state || parsedData`
- **Do not** store functions/actions in persisted state (`partialize` should include only serializable fields).

### Updating persisted stores safely
- If you add a new settings field:
  - add it to default state initialization
  - add setter action if needed
  - add it to `partialize`
  - consider backward compatibility when reading older persisted values (undefined is acceptable; keep defaults)

### Performance & memory considerations (existing style)
- The image flow can handle a lot of data; prefer:
  - filtering and sorting without unnecessary array clones
  - keeping derived state (`filteredImages`) in the store via an `applyFilters()` action
  - limits to prevent overload (content script limits final image count)

### When adding a new store
- Define types in `src/store/types.ts`.
- Create hook in `src/store/<name>Store.ts`.
- Re-export from `src/store/index.ts`.
- Keep actions small and composable; avoid side effects in reducers unless necessary (then wrap with error handling).


