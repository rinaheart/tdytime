# Phase 1 Roadmap (Post-Audit Action Items)

This file tracks the action items identified after the Phase 0 Audit (v1.9.4).

## 🔴 Immediate (Blockers)
- [x] **Dependency Lockfile Missing:** Repo was missing `pnpm-lock.yaml` tracking.
  - *Fix:* Generated `pnpm-lock.yaml` via `pnpm install` in the project directory. It must be committed to ensure deterministic builds in CI. Alternatively, `package-lock.json` was generated for `_GH` deployment compatibility.

## 🟡 Short-term (Tech Debt & Parity)
- [x] **i18n Parity Script:** Restore `scripts/check-i18n-parity.mjs` which was omitted from the whitelist.
  - *Fix:* Added `scripts/` to `clone-project-to-upload-GitHub.ps1` whitelist and synced to `_GH/`.
- [x] **ARCHITECTURE.md Doc-Drift:** The scripts path was empty, and `public/mocks` path was outdated.
  - *Fix:* Updated `ARCHITECTURE.md` to reflect `tests/mocks/` and added `scripts/check-i18n-parity.mjs`.
- [ ] **Automate i18n Check:** Add `check-i18n-parity.mjs` execution to `.github/workflows/ci.yml`.
- [ ] **`useTodayData.ts` Tests:** Write unit tests for this critical hook using `vi.setSystemTime` to simulate various schedule edge cases.

## 🟢 Medium-term (Test Coverage)
- [ ] **Utilize New Fixtures:** Integrate `1_schedule_anon_full.html` and `5_schedule_test_ultra_minimal.html` into `parser.test.ts` to increase schedule parsing edge-case coverage.

## 🔵 Technical Debt Radar
- **`__dirname` in Vite Config:** Vite 8+ warns about `__dirname` deprecation in `vite.config.ts:231`. To be migrated to `import.meta.dirname` when dropping old Node versions.
- **`eslint-disable` for hooks:** There are 21 new `eslint-disable` comments suppressing `react-hooks/exhaustive-deps`. True root cause for some (e.g. `PWAUpdateHandler`) should be fixed by using lazy `useState(() => ...)` initialization instead of `useEffect`.
