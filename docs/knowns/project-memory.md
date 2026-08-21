# Project Memory & Decisions

## Technical Decisions
- **Dependencies Upgrade:** Vite, React, Tailwind, Vitest, PWA bumped to latest LTS/Stable versions (v1.9.4).
- **Stability Lock:** Kept `eslint@8.57.1` and `typescript@6.0.3` to avoid AST parser breaking changes in older config.
- **ID Generation Strategy:** Replaced legacy ID generation with `crypto.randomUUID()` in History Service.
- **Production Asset Safety:** Moved all test mocks from `public/mocks/` to `tests/mocks/` so they don't bloat the production bundle.
- **Performance Optimization:** Dynamically lazy-loaded `@react-pdf/renderer` in `WeekNavigation.tsx` and `SemesterView.tsx` to dramatically reduce main bundle size.
- **CI/CD Integration:** Adopted GitHub Actions (`.github/workflows/ci.yml`) replacing local-only checks. Using pnpm caching for speed.

## Domain Rules
- **Regex `TH` courses:** Code must handle various representations of TH courses. Replaced strict `/-TH\./i` with `/-TH(?:\.|\d|$)/i` to support formats like `...TH1`.
- **Pre-publish Script:** Use `clone-project-to-upload-GitHub.ps1` via `/ship-gh` to copy a whitelist of files to `_GH/` for Git pushing. DO NOT use standard `git push` directly in the active project directory.
