# Reusable Knowledge & Patterns

## UI / UX Patterns
- **Header Layout:** Keep frequently accessed toggles (like Dark Mode) as top-level buttons on the header instead of burying them inside popovers (e.g. ThemePicker). Current order: Language (`Globe`) -> Theme (`Palette`) -> Dark Mode (`Sun/Moon`) -> Import (`Upload`).
- **Lazy Loading heavy libraries:** Always use `import()` within event handlers or `React.lazy()` for massive libraries like `@react-pdf/renderer` or `jspdf` to keep initial load fast (TTI).

## Workflow / DevOps Patterns
- **Whitelist Project Cloning:** A PowerShell script strategy for separating the "Working Directory" from the "Git Publish Directory" using a strict whitelist. This ensures no temp files, dot-env files, or build caches accidentally leak into GitHub.
- **GitHub Actions for Monorepos/Node projects:** Always include a `pnpm install` step with cache setup (`pnpm/action-setup@v4`) before running `lint`, `test`, and `build` commands to save CI minutes.
