## TypeScript / ESLint / Prettier conventions

### TypeScript
- **Strict TS is on** (`strict: true`), and the repo treats unused locals/params as errors (`noUnusedLocals`, `noUnusedParameters`).
- **Do** keep types explicit at boundaries:
  - messaging payloads (`src/types/index.ts`)
  - storage persistence schemas
  - utility function inputs/outputs
- **Do not** introduce `any` unless you are in a `.d.ts` override context.

### Imports
- **Follow `import/order`**:
  - groups: builtin → external → internal → parent/sibling → index → object → type
  - `react` first in external group
  - alphabetize within groups
  - blank line between groups
- **Prefer alias imports** (`@utils`, `@components`, `@store`, `@types`, `@theme`) over deep relative paths.

### Console / logging
- ESLint warns on `console.*` and only allows `console.warn` / `console.error`.
- **Prefer** `handleError(...)` for error reporting instead of raw console logging.

### Formatting (Prettier)
- `singleQuote: true`
- `printWidth: 100`
- `trailingComma: all`
- `semi: true`
- `tabWidth: 2`
- `endOfLine: lf`

### Naming & file layout (project patterns)
- React components are typically organized as:
  - `index.tsx` (component)
  - `styles.ts` (MUI `styled(...)` definitions)
  - `components/*` (subcomponents)
- Utilities live in `src/utils/` and are re-exported from `src/utils/index.ts`.
- Store hooks live in `src/store/*` and are re-exported from `src/store/index.ts`.

### Quick checklist before you finish a change
- No unused locals/params (use `_` prefix for intentionally unused params; ESLint ignores `^_`).
- Imports are ordered and use aliases.
- No direct edits in `build/`.


