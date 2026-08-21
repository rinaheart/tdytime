# Session Handoff Summary

## Project Snapshot
- **Project:** TdyTime
- **Version:** v1.9.4 (Phase 0 Audit Complete)
- **Current State:** The codebase is extremely stable, clean, and has a CI/CD pipeline integrated. All initial audit issues (B1-B12, Tech Debt, Bundle sizes) have been resolved. Test coverage for parser has 15 passing tests.

## Active Decisions
- ESLint and TypeScript are locked to `8.57.1` and `6.0.3` respectively. Do not auto-upgrade them without thorough testing.
- `crypto.randomUUID()` is now the standard for generating unique IDs.
- Test data / HTML mocks live in `tests/mocks/`, never in `public/`.

## Known Pitfalls
- `vite-plugin-pwa` throws a warning about `__dirname`. This is a known issue but non-blocking. It requires migration to `import.meta.dirname` in the future, but currently, Vite config is left as-is to maintain compatibility.
- Ensure PowerShell scripts are invoked with the correct working directory, as `Read-Host` blocking or relative pathing can cause issues during headless automation.

## Next Starting Point
- **Immediate Task:** The project is ready for new feature development (Phase 1) or UI enhancements since the baseline is now fully stable.
- **If deploying:** Go to `_GH` folder and manually commit/push to the repository.
