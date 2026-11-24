/**
 * Automated Design System Runtime Integrity & WCAG 2.2 Contrast Auditor — TdyTime
 *
 * Enforces:
 * 1. Canonical 7-document Design System structure in `docs/design-system/`.
 * 2. Zero external project branding (`TdyTripZ`) in active code, CSS, docs, or i18n locales.
 * 3. Single Source of Palette Parity: parses `THEME_PALETTES` directly from `src/core/config/constants.ts`
 *    and verifies 100% 1:1 parity across:
 *    - `:root` fallback palette in `src/styles/tokens.css` (must match `THEME_PALETTES.themeBlue` across all 16 tokens).
 *    - All 7 `[data-accent="theme..."]` blocks × 16 tokens (11 `--accent-50..950` shades + 3 `--accent-action-*` + 2 `--accent-focus-*`).
 * 4. Fail-closed RGB validation & WCAG 2.2 (0.04045 relative luminance threshold) contrast verification:
 *    - `--accent-action-bg` & `--accent-action-hover` vs `--accent-on-action` >= 4.5:1 (WCAG 2.2 SC 1.4.3).
 *    - `--accent-focus-light` vs Light Mode surfaces (`#FFFFFF` & `slate-50` `#F8FAFC`) >= 3.0:1 (WCAG 2.2 SC 1.4.11).
 *    - `--accent-focus-dark` vs Dark Mode surfaces (`slate-900` `#0F172A` & `slate-950` `#020617`) >= 3.0:1 (WCAG 2.2 SC 1.4.11).
 * 5. Zero CSS Variable Self-Reference (`--x: var(--x)`) and `@theme inline` wiring of `--tdy-radius-*` and `--tdy-shadow-*`.
 * 6. Compiled CSS Runtime Selector & Declaration Verification via PostCSS + `@tailwindcss/postcss` on `src/styles/global.css`.
 * 7. Multi-Line Context & 3-Tier Semantic Contrast Scanner across `src/`:
 *    - Complete 22-family Tailwind CSS palette (`TAILWIND_COLOR_RGB`) + fail-closed rejection of any unknown color family/shade.
 *    - Multi-line `className="..."`, `className={...}` (template literal + branch interpolation), and `{ bg, text }` object scanning.
 *    - Alpha-blended opacity modifier evaluation (`/0..100`) over Light & Dark surfaces.
 *    - Independent Light (`focus-visible:ring-*`) and Dark (`dark:focus-visible:ring-*`) focus ring contrast evaluation.
 *    - Two-way manifest verification against `SEMANTIC_COLOR_EXCEPTIONS` (30 canonical entries: 24 text-contrast + 6 focus-contrast).
 *
 * Usage:
 *   node scripts/check-design-system.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import tailwindcssPostcss from '@tailwindcss/postcss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const CANONICAL_DOCS = [
    'README.md',
    'DESIGN_DNA.md',
    'DESIGN_TOKENS.md',
    'COMPONENT_GUIDELINES.md',
    'LAYOUT_AND_RESPONSIVE.md',
    'INTERACTION_AND_ACCESSIBILITY.md',
    'DESIGN_AUDIT_REPORT.md',
];

export const DEPRECATED_SPLIT_DOCS = [
    'DESIGN_PRINCIPLES.md',
    'COLOR_SYSTEM.md',
    'TYPOGRAPHY.md',
    'SPACING_AND_LAYOUT.md',
    'RESPONSIVE_GUIDELINES.md',
    'INTERACTION_AND_MOTION.md',
    'ACCESSIBILITY.md',
    'DO_AND_DONT.md',
];

export const ACCENT_SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
export const ACTION_TOKENS = ['--accent-action-bg', '--accent-action-hover', '--accent-on-action'];
export const FOCUS_TOKENS = ['--accent-focus-light', '--accent-focus-dark'];
export const THEME_IDS = [
    'themeBlue',
    'themeGreen',
    'themePink',
    'themeViolet',
    'themeRed',
    'themeYellow',
    'themeGrey',
];

/** Adjacent surface colors in RGB for WCAG 2.2 Contrast Calculations */
export const LIGHT_SURFACE_WHITE = [255, 255, 255]; // #FFFFFF
export const LIGHT_SURFACE_SLATE_50 = [248, 250, 252]; // #F8FAFC
export const DARK_SURFACE_SLATE_900 = [15, 23, 42]; // #0F172A
export const DARK_SURFACE_SLATE_950 = [2, 6, 23]; // #020617

/**
 * Complete Official 22-Family Tailwind CSS RGB Palette (11 shades per family: 50..950)
 * Includes: slate, gray, zinc, neutral, stone, red, orange, amber, yellow, lime,
 * green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose.
 */
export const TAILWIND_COLOR_RGB = {
    slate: {
        50: [248, 250, 252],
        100: [241, 245, 249],
        200: [226, 232, 240],
        300: [203, 213, 225],
        400: [148, 163, 184],
        500: [100, 116, 139],
        600: [71, 85, 105],
        700: [51, 65, 85],
        800: [30, 41, 59],
        900: [15, 23, 42],
        950: [2, 6, 23],
    },
    gray: {
        50: [249, 250, 251],
        100: [243, 244, 246],
        200: [229, 231, 235],
        300: [209, 213, 219],
        400: [156, 163, 175],
        500: [107, 114, 128],
        600: [75, 85, 99],
        700: [55, 65, 81],
        800: [31, 41, 55],
        900: [17, 24, 39],
        950: [3, 7, 18],
    },
    zinc: {
        50: [250, 250, 250],
        100: [244, 244, 245],
        200: [228, 228, 231],
        300: [212, 212, 216],
        400: [161, 161, 170],
        500: [113, 113, 122],
        600: [82, 82, 91],
        700: [63, 63, 70],
        800: [39, 39, 42],
        900: [24, 24, 27],
        950: [9, 9, 11],
    },
    neutral: {
        50: [250, 250, 250],
        100: [245, 245, 245],
        200: [229, 229, 229],
        300: [212, 212, 212],
        400: [163, 163, 163],
        500: [115, 115, 115],
        600: [82, 82, 82],
        700: [64, 64, 64],
        800: [38, 38, 38],
        900: [23, 23, 23],
        950: [10, 10, 10],
    },
    stone: {
        50: [250, 250, 249],
        100: [245, 245, 244],
        200: [231, 229, 228],
        300: [214, 211, 209],
        400: [168, 162, 158],
        500: [120, 113, 108],
        600: [87, 83, 78],
        700: [68, 64, 60],
        800: [41, 37, 36],
        900: [28, 25, 23],
        950: [12, 10, 9],
    },
    red: {
        50: [254, 242, 242],
        100: [254, 226, 226],
        200: [254, 202, 202],
        300: [252, 165, 165],
        400: [248, 113, 113],
        500: [239, 68, 68],
        600: [220, 38, 38],
        700: [185, 28, 28],
        800: [153, 27, 27],
        900: [127, 29, 29],
        950: [69, 10, 10],
    },
    orange: {
        50: [255, 247, 237],
        100: [255, 237, 213],
        200: [254, 215, 170],
        300: [253, 186, 116],
        400: [251, 146, 60],
        500: [249, 115, 22],
        600: [234, 88, 12],
        700: [194, 65, 12],
        800: [154, 52, 18],
        900: [124, 45, 18],
        950: [67, 20, 7],
    },
    amber: {
        50: [255, 251, 235],
        100: [254, 243, 199],
        200: [253, 230, 138],
        300: [252, 211, 77],
        400: [251, 191, 36],
        500: [245, 158, 11],
        600: [217, 119, 6],
        700: [180, 83, 9],
        800: [146, 64, 14],
        900: [120, 53, 15],
        950: [69, 26, 3],
    },
    yellow: {
        50: [254, 252, 232],
        100: [254, 249, 195],
        200: [254, 240, 138],
        300: [253, 224, 71],
        400: [250, 204, 21],
        500: [234, 179, 8],
        600: [202, 138, 4],
        700: [161, 98, 7],
        800: [133, 77, 14], // #854D0E
        900: [113, 63, 18],
        950: [66, 32, 6],
    },
    lime: {
        50: [247, 254, 231],
        100: [236, 252, 203],
        200: [217, 249, 157],
        300: [190, 242, 100],
        400: [163, 230, 53],
        500: [132, 204, 22],
        600: [101, 163, 13],
        700: [77, 124, 15],
        800: [63, 98, 18],
        900: [54, 83, 20],
        950: [26, 46, 5],
    },
    green: {
        50: [240, 253, 244],
        100: [220, 252, 231],
        200: [187, 247, 208],
        300: [134, 239, 172],
        400: [74, 222, 128],
        500: [34, 197, 94],
        600: [22, 163, 74],
        700: [21, 128, 61],
        800: [22, 101, 52],
        900: [20, 83, 45],
        950: [5, 46, 22],
    },
    emerald: {
        50: [236, 253, 245],
        100: [209, 250, 229],
        200: [167, 243, 208],
        300: [110, 231, 183],
        400: [52, 211, 153],
        500: [16, 185, 129],
        600: [5, 150, 105],
        700: [4, 120, 87],
        800: [6, 95, 70],
        900: [6, 78, 59],
        950: [2, 44, 34],
    },
    teal: {
        50: [240, 253, 250],
        100: [204, 251, 241],
        200: [153, 246, 228],
        300: [94, 234, 212],
        400: [45, 212, 191],
        500: [20, 184, 166],
        600: [13, 148, 136],
        700: [15, 118, 110],
        800: [17, 94, 89],
        900: [19, 78, 74],
        950: [4, 47, 46],
    },
    cyan: {
        50: [236, 254, 255],
        100: [207, 250, 254],
        200: [165, 243, 252],
        300: [103, 232, 249],
        400: [34, 211, 238],
        500: [6, 182, 212],
        600: [8, 145, 178],
        700: [14, 116, 144],
        800: [21, 94, 117],
        900: [22, 78, 99],
        950: [8, 51, 68],
    },
    sky: {
        50: [240, 249, 255],
        100: [224, 242, 254],
        200: [186, 230, 253],
        300: [125, 211, 252],
        400: [56, 189, 248],
        500: [14, 165, 233],
        600: [2, 132, 199],
        700: [3, 105, 161],
        800: [7, 89, 133],
        900: [12, 74, 110],
        950: [8, 47, 73],
    },
    blue: {
        50: [239, 246, 255],
        100: [219, 234, 254],
        200: [191, 219, 254],
        300: [147, 197, 253],
        400: [96, 165, 250],
        500: [59, 130, 246],
        600: [37, 99, 235],
        700: [29, 78, 216],
        800: [30, 64, 175],
        900: [30, 58, 138],
        950: [23, 37, 84],
    },
    indigo: {
        50: [238, 242, 255],
        100: [224, 231, 255],
        200: [199, 210, 254],
        300: [165, 180, 252],
        400: [129, 140, 248],
        500: [99, 102, 241],
        600: [79, 70, 229],
        700: [67, 56, 202],
        800: [55, 48, 163],
        900: [49, 46, 129],
        950: [30, 27, 75],
    },
    violet: {
        50: [245, 243, 255],
        100: [237, 233, 254],
        200: [221, 214, 254],
        300: [196, 181, 253],
        400: [167, 139, 250],
        500: [139, 92, 246],
        600: [124, 58, 237],
        700: [109, 40, 217],
        800: [91, 33, 182],
        900: [76, 29, 149],
        950: [46, 16, 101],
    },
    purple: {
        50: [250, 245, 255],
        100: [243, 232, 255],
        200: [233, 213, 255],
        300: [216, 180, 254],
        400: [192, 132, 252],
        500: [168, 85, 247],
        600: [147, 51, 234],
        700: [126, 34, 206],
        800: [107, 33, 168],
        900: [88, 28, 135],
        950: [59, 7, 100],
    },
    fuchsia: {
        50: [253, 244, 255],
        100: [250, 232, 255],
        200: [245, 208, 254],
        300: [240, 171, 252],
        400: [232, 121, 249],
        500: [217, 70, 239],
        600: [192, 38, 211],
        700: [162, 28, 175],
        800: [134, 25, 143],
        900: [112, 26, 117],
        950: [74, 4, 78],
    },
    pink: {
        50: [253, 242, 248],
        100: [252, 231, 243],
        200: [251, 207, 232],
        300: [249, 168, 212],
        400: [244, 114, 182],
        500: [236, 72, 153],
        600: [219, 39, 119],
        700: [190, 24, 93],
        800: [157, 23, 77],
        900: [131, 24, 67],
        950: [80, 7, 36],
    },
    rose: {
        50: [255, 241, 242],
        100: [255, 228, 230],
        200: [254, 205, 211],
        300: [253, 164, 175],
        400: [251, 113, 133],
        500: [244, 63, 94],
        600: [225, 29, 72],
        700: [190, 18, 60],
        800: [159, 18, 57],
        900: [136, 19, 55],
        950: [76, 5, 25],
    },
};

/**
 * Canonical Manifest of all approved Fixed-Color Semantic Exceptions across `src/`.
 * Enforce two-way parity:
 * 1. Every entry in this manifest MUST exist in `src/` and pass its WCAG 2.2 threshold.
 * 2. Every fixed-color `bg-*` + `text-white` or `focus(-visible):ring-*` found in `src/`
 *    MUST be registered in this manifest (zero unapproved exceptions).
 */
export const SEMANTIC_COLOR_EXCEPTIONS = [
    // 1. PWAUpdateHandler.tsx (5 entries)
    {
        id: 'pwa-install-banner-bg',
        file: 'src/app/PWAUpdateHandler.tsx',
        line: 503,
        kind: 'text-contrast',
        token: 'bg-slate-800',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'High-contrast dark surface for PWA install prompt toast in Light Mode',
    },
    {
        id: 'pwa-status-toast-bg',
        file: 'src/app/PWAUpdateHandler.tsx',
        line: 534,
        kind: 'text-contrast',
        token: 'bg-slate-800',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'High-contrast dark surface for PWA update check status toast in Light Mode',
    },
    {
        id: 'pwa-status-offline-pill',
        file: 'src/app/PWAUpdateHandler.tsx',
        line: 535,
        kind: 'text-contrast',
        token: 'bg-amber-700',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Offline warning icon pill inside PWA update toast',
    },
    {
        id: 'pwa-status-error-pill',
        file: 'src/app/PWAUpdateHandler.tsx',
        line: 535,
        kind: 'text-contrast',
        token: 'bg-red-600',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Error status icon pill inside PWA update toast',
    },
    {
        id: 'pwa-status-success-pill',
        file: 'src/app/PWAUpdateHandler.tsx',
        line: 535,
        kind: 'text-contrast',
        token: 'bg-green-700',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Up-to-date success icon pill inside PWA update toast',
    },
    // 2. constants.ts SESSION_ACCENT_COLORS (3 entries)
    {
        id: 'session-accent-morning',
        file: 'src/core/config/constants.ts',
        line: 347,
        kind: 'text-contrast',
        token: 'bg-blue-600',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Morning shift S legend badge background',
    },
    {
        id: 'session-accent-afternoon',
        file: 'src/core/config/constants.ts',
        line: 348,
        kind: 'text-contrast',
        token: 'bg-orange-700',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Afternoon shift C legend badge background',
    },
    {
        id: 'session-accent-evening',
        file: 'src/core/config/constants.ts',
        line: 349,
        kind: 'text-contrast',
        token: 'bg-purple-600',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Evening shift T legend badge background',
    },
    // 3. FilterBar.tsx (1 entry)
    {
        id: 'filterbar-clear-focus',
        file: 'src/ui/composites/FilterBar.tsx',
        line: 79,
        kind: 'focus-contrast',
        token: 'focus-visible:ring-red-500',
        pairedWith: 'light+dark-surfaces',
        minContrast: 3.0,
        purpose: 'Destructive clear-filters button keyboard focus ring',
    },
    // 4. ConfirmModal.tsx (3 entries)
    {
        id: 'confirm-modal-danger-bg',
        file: 'src/ui/primitives/ConfirmModal.tsx',
        line: 139,
        kind: 'text-contrast',
        token: 'bg-red-600',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Destructive confirmation dialog primary action button',
    },
    {
        id: 'confirm-modal-danger-hover',
        file: 'src/ui/primitives/ConfirmModal.tsx',
        line: 139,
        kind: 'text-contrast',
        token: 'hover:bg-red-700',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Destructive confirmation dialog primary action button hover state',
    },
    {
        id: 'confirm-modal-danger-focus',
        file: 'src/ui/primitives/ConfirmModal.tsx',
        line: 139,
        kind: 'focus-contrast',
        token: 'focus-visible:ring-red-500',
        pairedWith: 'light+dark-surfaces',
        minContrast: 3.0,
        purpose: 'Destructive confirmation dialog primary action button focus ring',
    },
    // 5. Toast.tsx (2 entries)
    {
        id: 'toast-light-bg',
        file: 'src/ui/primitives/Toast.tsx',
        line: 34,
        kind: 'text-contrast',
        token: 'bg-slate-900',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Floating notification toast surface in Light Mode',
    },
    {
        id: 'toast-dark-bg',
        file: 'src/ui/primitives/Toast.tsx',
        line: 34,
        kind: 'text-contrast',
        token: 'dark:bg-slate-800',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Floating notification toast surface in Dark Mode',
    },
    // 6. ExamView.tsx (3 entries)
    {
        id: 'exam-delete-confirm-bg',
        file: 'src/views/exam/ExamView.tsx',
        line: 525,
        kind: 'text-contrast',
        token: 'bg-red-600',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Exam row 2-step delete confirmation active button background',
    },
    {
        id: 'exam-delete-confirm-hover',
        file: 'src/views/exam/ExamView.tsx',
        line: 525,
        kind: 'text-contrast',
        token: 'hover:bg-red-700',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Exam row 2-step delete confirmation active button hover background',
    },
    {
        id: 'exam-delete-focus',
        file: 'src/views/exam/ExamView.tsx',
        line: 525,
        kind: 'focus-contrast',
        token: 'focus-visible:ring-red-500',
        pairedWith: 'light+dark-surfaces',
        minContrast: 3.0,
        purpose: 'Exam row delete button focus ring',
    },
    // 7. SemesterView.tsx (1 entry)
    {
        id: 'semester-toast-bg',
        file: 'src/views/semester/SemesterView.tsx',
        line: 291,
        kind: 'text-contrast',
        token: 'bg-slate-800',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Semester feedback floating toast surface in Light Mode',
    },
    // 8. BackupRestoreCard.tsx (3 entries)
    {
        id: 'backup-restore-confirm-bg',
        file: 'src/views/settings/BackupRestoreCard.tsx',
        line: 274,
        kind: 'text-contrast',
        token: 'bg-amber-700',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Warning confirmation button for atomic data restore overwrite',
    },
    {
        id: 'backup-restore-confirm-hover',
        file: 'src/views/settings/BackupRestoreCard.tsx',
        line: 274,
        kind: 'text-contrast',
        token: 'hover:bg-amber-800',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Warning confirmation button hover state for atomic data restore overwrite',
    },
    {
        id: 'backup-restore-confirm-focus',
        file: 'src/views/settings/BackupRestoreCard.tsx',
        line: 274,
        kind: 'focus-contrast',
        token: 'focus-visible:ring-amber-700',
        pairedWith: 'light+dark-surfaces',
        minContrast: 3.0,
        purpose: 'Warning confirmation button focus ring for atomic data restore overwrite',
    },
    // 9. CourseTypeCard.tsx (1 entry)
    {
        id: 'course-type-th-selected-bg',
        file: 'src/views/settings/CourseTypeCard.tsx',
        line: 159,
        kind: 'text-contrast',
        token: 'bg-slate-600',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Practice (TH) radio button selected state indicator',
    },
    // 10. DangerZoneCard.tsx (3 entries)
    {
        id: 'danger-zone-reset-bg',
        file: 'src/views/settings/DangerZoneCard.tsx',
        line: 46,
        kind: 'text-contrast',
        token: 'bg-red-600',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Danger Zone 2-step full app reset confirmation button background',
    },
    {
        id: 'danger-zone-reset-hover',
        file: 'src/views/settings/DangerZoneCard.tsx',
        line: 46,
        kind: 'text-contrast',
        token: 'hover:bg-red-700',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Danger Zone 2-step full app reset confirmation button hover state',
    },
    {
        id: 'danger-zone-reset-focus',
        file: 'src/views/settings/DangerZoneCard.tsx',
        line: 46,
        kind: 'focus-contrast',
        token: 'focus-visible:ring-red-500',
        pairedWith: 'light+dark-surfaces',
        minContrast: 3.0,
        purpose: 'Danger Zone 2-step full app reset confirmation button focus ring',
    },
    // 11. SettingsView.tsx (2 entries)
    {
        id: 'settings-clear-cache-confirm-bg',
        file: 'src/views/settings/SettingsView.tsx',
        line: 327,
        kind: 'text-contrast',
        token: 'bg-red-600',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: '2-step PWA Clear Cache confirmation active state background',
    },
    {
        id: 'settings-clear-cache-confirm-hover',
        file: 'src/views/settings/SettingsView.tsx',
        line: 327,
        kind: 'text-contrast',
        token: 'hover:bg-red-700',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: '2-step PWA Clear Cache confirmation active state hover background',
    },
    // 12. WelcomeView.tsx (3 entries)
    {
        id: 'welcome-history-delete-bg',
        file: 'src/views/welcome/WelcomeView.tsx',
        line: 103,
        kind: 'text-contrast',
        token: 'bg-red-600',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Recent timetable history 2-step delete confirmation button background',
    },
    {
        id: 'welcome-history-delete-hover',
        file: 'src/views/welcome/WelcomeView.tsx',
        line: 103,
        kind: 'text-contrast',
        token: 'hover:bg-red-700',
        pairedWith: 'text-white',
        minContrast: 4.5,
        purpose: 'Recent timetable history 2-step delete confirmation button hover state',
    },
    {
        id: 'welcome-history-delete-focus',
        file: 'src/views/welcome/WelcomeView.tsx',
        line: 103,
        kind: 'focus-contrast',
        token: 'focus-visible:ring-red-500',
        pairedWith: 'light+dark-surfaces',
        minContrast: 3.0,
        purpose: 'Recent timetable history 2-step delete confirmation button focus ring',
    },
];

/**
 * Parse a 3-channel "R G B" string (e.g. "37 99 235"). Returns null if malformed or out of [0, 255].
 */
export function parseRgbChannels(rgbStr) {
    if (typeof rgbStr !== 'string') return null;
    const trimmed = rgbStr.trim();
    if (!/^\d+\s+\d+\s+\d+$/.test(trimmed)) return null;
    const parts = trimmed.split(/\s+/).map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
        return null;
    }
    return parts;
}

/**
 * Alpha-blend a foreground RGB color over an opaque surface RGB color with alpha in [0, 1].
 */
export function blendRgbOverSurface(fgRgb, surfaceRgb, alpha = 1) {
    const a = Math.max(0, Math.min(1, alpha));
    return [
        Math.round(a * fgRgb[0] + (1 - a) * surfaceRgb[0]),
        Math.round(a * fgRgb[1] + (1 - a) * surfaceRgb[1]),
        Math.round(a * fgRgb[2] + (1 - a) * surfaceRgb[2]),
    ];
}

/**
 * Compute W3C WCAG 2.2 relative luminance using the canonical 0.04045 sRGB threshold.
 */
export function getRelativeLuminance([r, g, b]) {
    const toLinear = (c) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const [R, G, B] = [toLinear(r), toLinear(g), toLinear(b)];
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function getContrastRatio(rgbA, rgbB) {
    const lumA = getRelativeLuminance(rgbA);
    const lumB = getRelativeLuminance(rgbB);
    const brightest = Math.max(lumA, lumB);
    const darkest = Math.min(lumA, lumB);
    return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Extract multi-line className="..." / className={...} contexts and { bg, text } object literals
 * from a TypeScript / TSX source string so multi-line background/text/focus pairs are never missed.
 */
export function extractClassContexts(source) {
    const contexts = [];

    // 1. JSX className="..." or className={...} (handles multi-line expressions and nested braces)
    const classAttrRegex = /className\s*=\s*/g;
    let m;
    while ((m = classAttrRegex.exec(source)) !== null) {
        const startIdx = m.index;
        const lineNum = source.slice(0, startIdx).split('\n').length;
        let i = classAttrRegex.lastIndex;
        while (i < source.length && /\s/.test(source[i])) i++;
        const ch = source[i];
        if (ch === '"' || ch === "'") {
            let j = i + 1;
            while (j < source.length && source[j] !== ch) {
                if (source[j] === '\\') j++;
                j++;
            }
            const rawStr = source.slice(i + 1, j);
            contexts.push({ line: lineNum, branches: [rawStr], raw: rawStr });
        } else if (ch === '{') {
            let depth = 1;
            let j = i + 1;
            while (j < source.length && depth > 0) {
                if (source[j] === '{') depth++;
                else if (source[j] === '}') depth--;
                j++;
            }
            const expr = source.slice(i + 1, j - 1);
            const branches = extractExpressionBranches(expr);
            contexts.push({ line: lineNum, branches, raw: expr });
        }
    }

    // 2. Multi-line or single-line object literals with bg: '...' and text: '...'
    const objRegex = /\{[^{}]*\bbg\s*:\s*['"][^'"]+['"][^{}]*\btext\s*:\s*['"][^'"]+['"][^{}]*\}/g;
    while ((m = objRegex.exec(source)) !== null) {
        const lineNum = source.slice(0, m.index).split('\n').length;
        contexts.push({ line: lineNum, branches: [m[0]], raw: m[0] });
    }

    return contexts;
}

function extractExpressionBranches(expr) {
    const literals = [];
    const strRegex = /(['"])((?:\\.|(?!\1)[\s\S])*)\1/g;
    let m;
    while ((m = strRegex.exec(expr)) !== null) {
        literals.push(m[2]);
    }

    let baseStatic = '';
    if (expr.includes('`')) {
        let inTick = false;
        let interpDepth = 0;
        for (let k = 0; k < expr.length; k++) {
            if (expr[k] === '`' && interpDepth === 0) {
                inTick = !inTick;
            } else if (inTick && expr[k] === '$' && expr[k + 1] === '{') {
                interpDepth = 1;
                k++;
            } else if (interpDepth > 0) {
                if (expr[k] === '{') interpDepth++;
                else if (expr[k] === '}') interpDepth--;
            } else if (inTick) {
                baseStatic += expr[k];
            }
        }
    }

    if (literals.length === 0) {
        return [baseStatic || expr];
    }
    return [baseStatic, ...literals.map((lit) => `${baseStatic} ${lit}`)];
}

/**
 * Non-color Tailwind `bg-*` keywords that could precede a number (none in standard Tailwind,
 * but kept for safety) vs `accent` token prefix.
 */
const IGNORED_COLOR_FAMILIES = new Set(['accent', 'opacity']);

/**
 * Scan a single file's source text for WCAG 2.2 Text Contrast (>= 4.5:1),
 * Non-Text Focus Contrast (>= 3.0:1), and Semantic Exception Manifest compliance.
 *
 * Returns `{ errors: string[], discoveredExceptions: Array<{ file, line, kind, token, pairedWith, ratio }> }`
 */
export function scanFileContentForContrast(sourceText, relFilePath = 'fixture.tsx') {
    const fileErrors = [];
    const discoveredExceptions = [];
    const contexts = extractClassContexts(sourceText);

    // Fail-closed regexes matching ANY alphabetic color family name + numeric shade + optional /opacity
    const bgTokenRegex = /(?:(hover|dark):)?\bbg-([a-z]+)-(\d{2,3})(?:\/(\d{1,3}))?\b/g;
    const focusRingTokenRegex = /(?:(dark):)?\b(focus|focus-visible):ring-([a-z]+)-(\d{2,3})(?:\/(\d{1,3}))?\b/g;

    for (const ctx of contexts) {
        const checkedBgTokensInCtx = new Set();
        const checkedRingTokensInCtx = new Set();

        for (const branch of ctx.branches) {
            const hasLightTextWhite = /(?<!dark:)\btext-white\b/.test(branch);
            const hasDarkTextWhite = /\bdark:text-white\b/.test(branch);
            const hasDarkNonWhiteTextOverride = /\bdark:text-(?!white\b)[a-z]+-\d{2,3}\b/.test(branch);

            // 1. Check raw accent backgrounds paired with text-white
            if (/bg-accent-(400|500|600)(?:\/\d{1,3})?\b/.test(branch) && (hasLightTextWhite || hasDarkTextWhite)) {
                fileErrors.push(
                    `[Text Contrast] ${relFilePath}:${ctx.line} pairs bg-accent-400/500/600 directly with text-white (fails 4.5:1 in themeYellow/themeGreen). Use bg-accent-action and text-accent-on-action.`
                );
            }

            // 2. Check fixed background utilities paired with white text
            if (hasLightTextWhite || hasDarkTextWhite) {
                let bgMatch;
                bgTokenRegex.lastIndex = 0;
                while ((bgMatch = bgTokenRegex.exec(branch)) !== null) {
                    const [fullBgToken, statePrefix, colorFamily, shadeStr, alphaStr] = bgMatch;
                    if (IGNORED_COLOR_FAMILIES.has(colorFamily)) continue;

                    // If this is a dark:bg-* token, it pairs with white text ONLY if dark mode text is white
                    // (i.e., either dark:text-white is set, OR text-white is set without a dark:text-* override)
                    if (statePrefix === 'dark') {
                        const darkTextIsWhite = hasDarkTextWhite || (hasLightTextWhite && !hasDarkNonWhiteTextOverride);
                        if (!darkTextIsWhite) continue;
                    } else {
                        // Light/hover bg-* pairs with white text when hasLightTextWhite is true
                        if (!hasLightTextWhite) continue;
                    }

                    if (checkedBgTokensInCtx.has(fullBgToken)) continue;
                    checkedBgTokensInCtx.add(fullBgToken);

                    const familyTable = TAILWIND_COLOR_RGB[colorFamily];
                    const baseRgb = familyTable?.[shadeStr];
                    if (!familyTable || !baseRgb) {
                        fileErrors.push(
                            `[Fail-Closed Color Lookup] ${relFilePath}:${ctx.line} uses unknown or unverified Tailwind background color "${fullBgToken}".`
                        );
                        continue;
                    }

                    const alpha = alphaStr !== undefined ? Number(alphaStr) / 100 : 1;
                    if (Number.isNaN(alpha) || alpha < 0 || alpha > 1) {
                        fileErrors.push(
                            `[Fail-Closed Opacity] ${relFilePath}:${ctx.line} has invalid opacity modifier in "${fullBgToken}".`
                        );
                        continue;
                    }

                    // Composite over the worst-case surface for that mode (White/Slate-50 for light, Slate-900/950 for dark)
                    const targetSurfaces =
                        statePrefix === 'dark'
                            ? [DARK_SURFACE_SLATE_900, DARK_SURFACE_SLATE_950]
                            : [LIGHT_SURFACE_WHITE, LIGHT_SURFACE_SLATE_50];

                    const worstRatio = Math.min(
                        ...targetSurfaces.map((surf) =>
                            getContrastRatio(blendRgbOverSurface(baseRgb, surf, alpha), LIGHT_SURFACE_WHITE)
                        )
                    );

                    if (worstRatio < 4.5) {
                        fileErrors.push(
                            `[Text Contrast Failure] ${relFilePath}:${ctx.line} pairs "${fullBgToken}" with text-white (${worstRatio.toFixed(2)}:1 < 4.5:1 WCAG 2.2 SC 1.4.3).`
                        );
                    } else {
                        discoveredExceptions.push({
                            file: relFilePath,
                            line: ctx.line,
                            kind: 'text-contrast',
                            token: fullBgToken,
                            pairedWith: 'text-white',
                            ratio: worstRatio,
                        });
                    }
                }
            }

            // 3. Check raw accent focus rings
            if (/(?:dark:)?(?:focus|focus-visible):ring-accent-(400|500|600)(?:\/\d{1,3})?\b/.test(branch)) {
                fileErrors.push(
                    `[Non-Text Focus Contrast] ${relFilePath}:${ctx.line} uses raw focus ring accent shade (fails 3.0:1 in themeYellow/themeGreen). Use focus-visible:ring-accent-focus.`
                );
            }

            // 4. Collect all fixed focus rings in this branch (both light/unprefixed and dark: prefixed)
            const branchRings = [];
            let ringMatch;
            focusRingTokenRegex.lastIndex = 0;
            while ((ringMatch = focusRingTokenRegex.exec(branch)) !== null) {
                const [fullRingToken, darkPrefix, focusType, colorFamily, shadeStr, alphaStr] = ringMatch;
                if (IGNORED_COLOR_FAMILIES.has(colorFamily)) continue;
                branchRings.push({
                    fullRingToken,
                    isDark: darkPrefix === 'dark',
                    focusType,
                    colorFamily,
                    shadeStr,
                    alphaStr,
                });
            }

            const hasExplicitDarkFocusOverride =
                branchRings.some((r) => r.isDark) ||
                /\bdark:(?:focus|focus-visible):ring-accent-focus\b/.test(branch);

            for (const ring of branchRings) {
                if (checkedRingTokensInCtx.has(ring.fullRingToken)) continue;
                checkedRingTokensInCtx.add(ring.fullRingToken);

                const familyTable = TAILWIND_COLOR_RGB[ring.colorFamily];
                const baseRgb = familyTable?.[ring.shadeStr];
                if (!familyTable || !baseRgb) {
                    fileErrors.push(
                        `[Fail-Closed Color Lookup] ${relFilePath}:${ctx.line} uses unknown or unverified Tailwind focus ring color "${ring.fullRingToken}".`
                    );
                    continue;
                }

                const alpha = ring.alphaStr !== undefined ? Number(ring.alphaStr) / 100 : 1;
                if (Number.isNaN(alpha) || alpha < 0 || alpha > 1) {
                    fileErrors.push(
                        `[Fail-Closed Opacity] ${relFilePath}:${ctx.line} has invalid opacity modifier in "${ring.fullRingToken}".`
                    );
                    continue;
                }

                let failed = false;
                let minMeasuredRatio = Infinity;

                if (!ring.isDark) {
                    // Must pass Light Mode surfaces (#FFFFFF and slate-50 #F8FAFC) >= 3.0:1
                    const ratioWhite = getContrastRatio(
                        blendRgbOverSurface(baseRgb, LIGHT_SURFACE_WHITE, alpha),
                        LIGHT_SURFACE_WHITE
                    );
                    const ratioSlate50 = getContrastRatio(
                        blendRgbOverSurface(baseRgb, LIGHT_SURFACE_SLATE_50, alpha),
                        LIGHT_SURFACE_SLATE_50
                    );
                    minMeasuredRatio = Math.min(minMeasuredRatio, ratioWhite, ratioSlate50);
                    if (ratioWhite < 3.0 || ratioSlate50 < 3.0) {
                        failed = true;
                        fileErrors.push(
                            `[Non-Text Focus Contrast Failure] ${relFilePath}:${ctx.line} "${ring.fullRingToken}" fails Light Mode 3.0:1 threshold (vs white=${ratioWhite.toFixed(2)}:1, vs slate-50=${ratioSlate50.toFixed(2)}:1).`
                        );
                    }

                    // If there is no dark:focus(-visible):ring-* override, this same ring also applies in Dark Mode
                    if (!hasExplicitDarkFocusOverride) {
                        const ratioSlate900 = getContrastRatio(
                            blendRgbOverSurface(baseRgb, DARK_SURFACE_SLATE_900, alpha),
                            DARK_SURFACE_SLATE_900
                        );
                        const ratioSlate950 = getContrastRatio(
                            blendRgbOverSurface(baseRgb, DARK_SURFACE_SLATE_950, alpha),
                            DARK_SURFACE_SLATE_950
                        );
                        minMeasuredRatio = Math.min(minMeasuredRatio, ratioSlate900, ratioSlate950);
                        if (ratioSlate900 < 3.0 || ratioSlate950 < 3.0) {
                            failed = true;
                            fileErrors.push(
                                `[Non-Text Focus Contrast Failure] ${relFilePath}:${ctx.line} "${ring.fullRingToken}" (active in Dark Mode without dark: override) fails Dark Mode 3.0:1 threshold (vs slate-900=${ratioSlate900.toFixed(2)}:1, vs slate-950=${ratioSlate950.toFixed(2)}:1).`
                            );
                        }
                    }
                } else {
                    // Standalone or paired dark:focus(-visible):ring-* MUST always be checked against Dark Mode surfaces >= 3.0:1
                    const ratioSlate900 = getContrastRatio(
                        blendRgbOverSurface(baseRgb, DARK_SURFACE_SLATE_900, alpha),
                        DARK_SURFACE_SLATE_900
                    );
                    const ratioSlate950 = getContrastRatio(
                        blendRgbOverSurface(baseRgb, DARK_SURFACE_SLATE_950, alpha),
                        DARK_SURFACE_SLATE_950
                    );
                    minMeasuredRatio = Math.min(minMeasuredRatio, ratioSlate900, ratioSlate950);
                    if (ratioSlate900 < 3.0 || ratioSlate950 < 3.0) {
                        failed = true;
                        fileErrors.push(
                            `[Non-Text Focus Contrast Failure] ${relFilePath}:${ctx.line} "${ring.fullRingToken}" fails Dark Mode 3.0:1 threshold (vs slate-900=${ratioSlate900.toFixed(2)}:1, vs slate-950=${ratioSlate950.toFixed(2)}:1).`
                        );
                    }
                }

                if (!failed) {
                    discoveredExceptions.push({
                        file: relFilePath,
                        line: ctx.line,
                        kind: 'focus-contrast',
                        token: ring.fullRingToken,
                        pairedWith: ring.isDark ? 'dark-surfaces' : 'light+dark-surfaces',
                        ratio: minMeasuredRatio,
                    });
                }
            }
        }
    }

    return { errors: fileErrors, discoveredExceptions };
}

/**
 * Reconcile discovered semantic fixed-color exceptions against the canonical manifest (two-way parity).
 */
export function verifySemanticExceptionsManifest(
    discoveredExceptions,
    manifest = SEMANTIC_COLOR_EXCEPTIONS
) {
    const manifestErrors = [];
    const matchedManifestIds = new Set();

    for (const item of discoveredExceptions) {
        const match = manifest.find(
            (m) =>
                m.file === item.file &&
                m.line === item.line &&
                m.kind === item.kind &&
                m.token === item.token
        );
        if (!match) {
            manifestErrors.push(
                `[Unregistered Semantic Exception] ${item.file}:${item.line} uses fixed color "${item.token}" (${item.kind}, ${item.ratio.toFixed(2)}:1) which is not registered in SEMANTIC_COLOR_EXCEPTIONS.`
            );
        } else {
            matchedManifestIds.add(match.id);
            if (item.ratio < match.minContrast) {
                manifestErrors.push(
                    `[Semantic Exception Threshold Failure] ${match.id} (${item.file}:${item.line} "${item.token}") achieved ${item.ratio.toFixed(2)}:1 < required ${match.minContrast}:1.`
                );
            }
        }
    }

    for (const entry of manifest) {
        if (!matchedManifestIds.has(entry.id)) {
            manifestErrors.push(
                `[Stale Semantic Exception Manifest Entry] "${entry.id}" (${entry.file}:${entry.line} "${entry.token}") was not found in source scan.`
            );
        }
    }

    return manifestErrors;
}

function parseThemePalettesFromConstants(constantsSource, errors) {
    const palettes = {};
    for (const themeId of THEME_IDS) {
        const blockRegex = new RegExp(`${themeId}\\s*:\\s*\\{([^}]*)\\}`, 'm');
        const match = constantsSource.match(blockRegex);
        if (!match) {
            errors.push(`src/core/config/constants.ts THEME_PALETTES is missing ${themeId} definition.`);
            continue;
        }
        const entries = {};
        const propRegex = /['"]?([a-zA-Z0-9]+)['"]?\s*:\s*['"]([^'"]+)['"]/g;
        let propMatch;
        while ((propMatch = propRegex.exec(match[1])) !== null) {
            entries[propMatch[1]] = propMatch[2].trim();
        }
        palettes[themeId] = entries;
    }
    return palettes;
}

function extractCssBlock(css, selector) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm');
    const match = css.match(regex);
    return match ? match[1] : null;
}

function parseCssVars(blockText) {
    const vars = {};
    const regex = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
    let match;
    while ((match = regex.exec(blockText)) !== null) {
        vars[match[1].trim()] = match[2].trim();
    }
    return vars;
}

function detectSelfReferencingCssVars(cssText, fileName, errors) {
    const regex = /(--[a-zA-Z0-9-]+)\s*:\s*var\(\s*(--[a-zA-Z0-9-]+)\s*\)/g;
    let match;
    while ((match = regex.exec(cssText)) !== null) {
        if (match[1] === match[2]) {
            errors.push(
                `Self-referencing CSS variable detected in ${fileName}: "${match[1]}: var(${match[2]})" creates a dependency cycle.`
            );
        }
    }
}

export async function runDesignSystemAudit() {
    const errors = [];
    const allDiscoveredExceptions = [];

    function readFileSafe(relPath) {
        const full = path.join(rootDir, relPath);
        if (!fs.existsSync(full)) {
            errors.push(`Missing required file: ${relPath}`);
            return null;
        }
        return fs.readFileSync(full, 'utf8');
    }

    // 1. Verify Canonical 7-Document Design System Suite & absence of deprecated split docs
    for (const docName of CANONICAL_DOCS) {
        readFileSafe(path.join('docs/design-system', docName));
    }
    for (const oldDoc of DEPRECATED_SPLIT_DOCS) {
        const fullOld = path.join(rootDir, 'docs/design-system', oldDoc);
        if (fs.existsSync(fullOld)) {
            errors.push(`Deprecated split document still exists and should be merged: docs/design-system/${oldDoc}`);
        }
    }

    // 2. Verify zero external "TdyTripZ" branding in active standards, CSS, and user-facing locales
    const brandingCheckFiles = [
        'DESIGN.md',
        'src/styles/tokens.css',
        'src/styles/global.css',
        'src/app/PWAUpdateHandler.tsx',
        'src/i18n/locales/vi.json',
        'src/i18n/locales/en.json',
        ...CANONICAL_DOCS.filter((d) => d !== 'DESIGN_AUDIT_REPORT.md').map((d) => path.join('docs/design-system', d)),
    ];
    for (const relPath of brandingCheckFiles) {
        const content = readFileSafe(relPath);
        if (content && content.includes('TdyTripZ')) {
            errors.push(`Active file "${relPath}" still contains external "TdyTripZ" branding.`);
        }
    }

    // 3. Parse tokens.css, global.css, and constants.ts for parity, WCAG 2.2 contrast, and zero self-reference
    const tokensCss = readFileSafe('src/styles/tokens.css');
    const globalCss = readFileSafe('src/styles/global.css');
    const constantsTs = readFileSafe('src/core/config/constants.ts');

    if (tokensCss && globalCss && constantsTs) {
        detectSelfReferencingCssVars(tokensCss, 'src/styles/tokens.css', errors);
        detectSelfReferencingCssVars(globalCss, 'src/styles/global.css', errors);

        const canonicalPalettes = parseThemePalettesFromConstants(constantsTs, errors);

        const rootBlock = extractCssBlock(tokensCss, ':root');
        if (!rootBlock) {
            errors.push('src/styles/tokens.css is missing :root block.');
        } else {
            const rootVars = parseCssVars(rootBlock);
            const requiredRootTokens = [
                '--font-heading',
                '--font-body',
                '--font-num',
                '--tdy-radius-badge',
                '--tdy-radius-control',
                '--tdy-radius-card',
                '--tdy-radius-dialog',
                '--tdy-shadow-card',
                '--tdy-shadow-card-hover',
                '--tdy-shadow-modal',
                '--accent-focus-light',
                '--accent-focus-dark',
                '--accent-focus',
                '--semantic-success-from',
                '--semantic-success-to',
                '--semantic-warning-from',
                '--semantic-warning-to',
                '--semantic-danger-from',
                '--semantic-danger-to',
                '--semantic-info-from',
                '--semantic-info-to',
                '--semantic-morning-from',
                '--semantic-morning-to',
                '--semantic-afternoon-from',
                '--semantic-afternoon-to',
                '--semantic-evening-from',
                '--semantic-evening-to',
            ];
            for (const token of requiredRootTokens) {
                if (!rootVars[token]) {
                    errors.push(`src/styles/tokens.css :root is missing required token ${token}.`);
                }
            }

            // Verify :root fallback palette matches THEME_PALETTES.themeBlue 1:1 across all 16 tokens
            const bluePalette = canonicalPalettes.themeBlue || {};
            for (const shade of ACCENT_SHADES) {
                const varName = `--accent-${shade}`;
                if (!rootVars[varName]) {
                    errors.push(`src/styles/tokens.css :root is missing fallback ${varName}.`);
                } else if (rootVars[varName] !== bluePalette[shade]) {
                    errors.push(
                        `Root fallback palette mismatch for ${varName}: :root has "${rootVars[varName]}" vs THEME_PALETTES.themeBlue "${bluePalette[shade]}".`
                    );
                }
            }
            const rootTokenParityMap = {
                '--accent-action-bg': 'actionBg',
                '--accent-action-hover': 'actionHover',
                '--accent-on-action': 'onAction',
                '--accent-focus-light': 'focusLight',
                '--accent-focus-dark': 'focusDark',
            };
            for (const [cssVar, paletteKey] of Object.entries(rootTokenParityMap)) {
                if (!rootVars[cssVar]) {
                    errors.push(`src/styles/tokens.css :root is missing fallback ${cssVar}.`);
                } else if (rootVars[cssVar] !== bluePalette[paletteKey]) {
                    errors.push(
                        `Root fallback palette mismatch for ${cssVar}: :root has "${rootVars[cssVar]}" vs THEME_PALETTES.themeBlue "${bluePalette[paletteKey]}".`
                    );
                }
            }
            if (rootVars['--accent-focus'] !== 'var(--accent-focus-light)') {
                errors.push('src/styles/tokens.css :root must set --accent-focus: var(--accent-focus-light);');
            }
        }

        // Verify Dark Mode focus ring switch rule in tokens.css
        if (!tokensCss.includes('--accent-focus: var(--accent-focus-dark);')) {
            errors.push('src/styles/tokens.css is missing dark-mode focus token switch (--accent-focus: var(--accent-focus-dark);).');
        }

        // Verify each of the 7 themes individually against THEME_PALETTES and WCAG 2.2 thresholds
        for (const themeId of THEME_IDS) {
            if (!constantsTs.includes(`id: '${themeId}'`)) {
                errors.push(`src/core/config/constants.ts THEMES array is missing ${themeId}.`);
            }

            const block = extractCssBlock(tokensCss, `[data-accent="${themeId}"]`);
            if (!block) {
                errors.push(`src/styles/tokens.css is missing [data-accent="${themeId}"] block.`);
                continue;
            }
            const themeVars = parseCssVars(block);
            const expectedPalette = canonicalPalettes[themeId] || {};

            for (const shade of ACCENT_SHADES) {
                const varName = `--accent-${shade}`;
                const rawVal = themeVars[varName];
                if (!rawVal) {
                    errors.push(`[data-accent="${themeId}"] is missing ${varName}.`);
                } else if (!parseRgbChannels(rawVal)) {
                    errors.push(`[data-accent="${themeId}"] ${varName}="${rawVal}" is not a valid 3-channel RGB string (0-255).`);
                } else if (expectedPalette[shade] !== rawVal) {
                    errors.push(
                        `Palette parity mismatch in ${themeId} ${varName}: tokens.css has "${rawVal}" vs constants.ts THEME_PALETTES "${expectedPalette[shade]}".`
                    );
                }
            }

            const parsedAction = {};
            for (const actionToken of ACTION_TOKENS) {
                const rawVal = themeVars[actionToken];
                if (!rawVal) {
                    errors.push(`[data-accent="${themeId}"] is missing ${actionToken}.`);
                    continue;
                }
                const rgb = parseRgbChannels(rawVal);
                if (!rgb) {
                    errors.push(
                        `[data-accent="${themeId}"] ${actionToken}="${rawVal}" is not a valid 3-channel RGB string (0-255). Contrast check cannot be skipped.`
                    );
                    continue;
                }
                parsedAction[actionToken] = rgb;
            }

            const actionParityMap = {
                '--accent-action-bg': 'actionBg',
                '--accent-action-hover': 'actionHover',
                '--accent-on-action': 'onAction',
            };
            for (const [cssVar, paletteKey] of Object.entries(actionParityMap)) {
                if (themeVars[cssVar] && expectedPalette[paletteKey] !== themeVars[cssVar]) {
                    errors.push(
                        `Palette parity mismatch in ${themeId} ${cssVar}: tokens.css has "${themeVars[cssVar]}" vs constants.ts "${expectedPalette[paletteKey]}".`
                    );
                }
            }

            const bgRgb = parsedAction['--accent-action-bg'];
            const hoverRgb = parsedAction['--accent-action-hover'];
            const onRgb = parsedAction['--accent-on-action'];

            if (bgRgb && onRgb) {
                const ratio = getContrastRatio(bgRgb, onRgb);
                if (ratio < 4.5) {
                    errors.push(
                        `WCAG 2.2 AA Contrast Failure in ${themeId}: --accent-action-bg vs --accent-on-action is ${ratio.toFixed(2)}:1 (< 4.5:1).`
                    );
                }
            }
            if (hoverRgb && onRgb) {
                const hoverRatio = getContrastRatio(hoverRgb, onRgb);
                if (hoverRatio < 4.5) {
                    errors.push(
                        `WCAG 2.2 AA Contrast Failure in ${themeId}: --accent-action-hover vs --accent-on-action is ${hoverRatio.toFixed(2)}:1 (< 4.5:1).`
                    );
                }
            }

            const parsedFocus = {};
            for (const focusToken of FOCUS_TOKENS) {
                const rawVal = themeVars[focusToken];
                if (!rawVal) {
                    errors.push(`[data-accent="${themeId}"] is missing ${focusToken}.`);
                    continue;
                }
                const rgb = parseRgbChannels(rawVal);
                if (!rgb) {
                    errors.push(
                        `[data-accent="${themeId}"] ${focusToken}="${rawVal}" is not a valid 3-channel RGB string (0-255).`
                    );
                    continue;
                }
                parsedFocus[focusToken] = rgb;
            }

            if (themeVars['--accent-focus'] !== 'var(--accent-focus-light)') {
                errors.push(`[data-accent="${themeId}"] must set --accent-focus: var(--accent-focus-light);`);
            }

            const focusParityMap = {
                '--accent-focus-light': 'focusLight',
                '--accent-focus-dark': 'focusDark',
            };
            for (const [cssVar, paletteKey] of Object.entries(focusParityMap)) {
                if (themeVars[cssVar] && expectedPalette[paletteKey] !== themeVars[cssVar]) {
                    errors.push(
                        `Palette parity mismatch in ${themeId} ${cssVar}: tokens.css has "${themeVars[cssVar]}" vs constants.ts "${expectedPalette[paletteKey]}".`
                    );
                }
            }

            if (parsedFocus['--accent-focus-light']) {
                const ratioWhite = getContrastRatio(parsedFocus['--accent-focus-light'], LIGHT_SURFACE_WHITE);
                const ratioSlate50 = getContrastRatio(parsedFocus['--accent-focus-light'], LIGHT_SURFACE_SLATE_50);
                if (ratioWhite < 3.0 || ratioSlate50 < 3.0) {
                    errors.push(
                        `WCAG 2.2 SC 1.4.11 Focus Contrast Failure in ${themeId} (Light Mode): --accent-focus-light vs white=${ratioWhite.toFixed(2)}:1, slate-50=${ratioSlate50.toFixed(2)}:1 (< 3.0:1).`
                    );
                }
            }

            if (parsedFocus['--accent-focus-dark']) {
                const ratioSlate900 = getContrastRatio(parsedFocus['--accent-focus-dark'], DARK_SURFACE_SLATE_900);
                const ratioSlate950 = getContrastRatio(parsedFocus['--accent-focus-dark'], DARK_SURFACE_SLATE_950);
                if (ratioSlate900 < 3.0 || ratioSlate950 < 3.0) {
                    errors.push(
                        `WCAG 2.2 SC 1.4.11 Focus Contrast Failure in ${themeId} (Dark Mode): --accent-focus-dark vs slate-900=${ratioSlate900.toFixed(2)}:1, slate-950=${ratioSlate950.toFixed(2)}:1 (< 3.0:1).`
                    );
                }
            }

            for (const varName of Object.keys(themeVars)) {
                if (varName.startsWith('--semantic-')) {
                    errors.push(
                        `[data-accent="${themeId}"] mutates fixed semantic/domain token ${varName}. Status and Domain colors must remain stable across themes.`
                    );
                }
            }
        }

        // 4. Verify global.css @theme inline wiring
        if (!globalCss.includes('@custom-variant dark (&:where(.dark, .dark *));')) {
            errors.push('src/styles/global.css is missing mandatory Tailwind v4 @custom-variant dark directive.');
        }
        if (!globalCss.includes('@theme inline')) {
            errors.push('src/styles/global.css must use "@theme inline" when bridging CSS variables into Tailwind v4.');
        }

        for (const shade of ACCENT_SHADES) {
            if (!globalCss.includes(`--color-accent-${shade}: rgb(var(--accent-${shade}));`)) {
                errors.push(`src/styles/global.css @theme inline block is missing --color-accent-${shade} registration.`);
            }
        }

        const requiredGlobalWiring = [
            '--color-accent-action: rgb(var(--accent-action-bg));',
            '--color-accent-action-hover: rgb(var(--accent-action-hover));',
            '--color-accent-on-action: rgb(var(--accent-on-action));',
            '--color-accent-focus: rgb(var(--accent-focus));',
            '--radius-badge: var(--tdy-radius-badge);',
            '--radius-control: var(--tdy-radius-control);',
            '--radius-card: var(--tdy-radius-card);',
            '--radius-dialog: var(--tdy-radius-dialog);',
            '--radius-sm: var(--tdy-radius-badge);',
            '--radius-md: var(--tdy-radius-control);',
            '--radius-lg: var(--tdy-radius-control);',
            '--radius-xl: var(--tdy-radius-control);',
            '--radius-2xl: var(--tdy-radius-card);',
            '--radius-3xl: var(--tdy-radius-dialog);',
            '--shadow-card: var(--tdy-shadow-card);',
            '--shadow-card-hover: var(--tdy-shadow-card-hover);',
            '--shadow-modal: var(--tdy-shadow-modal);',
            'font-family: var(--font-body);',
            'font-family: var(--font-heading);',
            'font-family: var(--font-num);',
        ];
        for (const snippet of requiredGlobalWiring) {
            if (!globalCss.includes(snippet)) {
                errors.push(`src/styles/global.css is missing wired token rule: "${snippet}"`);
            }
        }
    }

    // 5. Compiled CSS Runtime Selector & Declaration Check via PostCSS + @tailwindcss/postcss
    try {
        const globalCssPath = path.join(rootDir, 'src/styles/global.css');
        const rawGlobalCss = fs.readFileSync(globalCssPath, 'utf8');
        const result = await postcss([tailwindcssPostcss()]).process(rawGlobalCss, {
            from: globalCssPath,
        });
        const compiledCss = result.css;

        detectSelfReferencingCssVars(compiledCss, 'compiled global.css output', errors);

        const expectedCompiledSnippets = [
            { label: '.rounded-badge utility', pattern: /\.rounded-badge\s*\{[^}]*border-radius:\s*var\(--tdy-radius-badge\)/ },
            { label: '.rounded-control utility', pattern: /\.rounded-control\s*\{[^}]*border-radius:\s*var\(--tdy-radius-control\)/ },
            { label: '.rounded-card utility', pattern: /\.rounded-card\s*\{[^}]*border-radius:\s*var\(--tdy-radius-card\)/ },
            { label: '.rounded-dialog utility', pattern: /\.rounded-dialog\s*\{[^}]*border-radius:\s*var\(--tdy-radius-dialog\)/ },
            { label: '.shadow-card utility', pattern: /\.shadow-card\s*\{[^}]*--tw-shadow:\s*var\(--tdy-shadow-card\)/ },
            { label: '.hover:shadow-card-hover utility', pattern: /\.hover\\:shadow-card-hover:hover\s*\{[^}]*--tw-shadow:\s*var\(--tdy-shadow-card-hover\)/ },
            { label: '.shadow-modal utility', pattern: /\.shadow-modal\s*\{[^}]*--tw-shadow:\s*var\(--tdy-shadow-modal\)/ },
            { label: '.bg-accent-action utility', pattern: /\.bg-accent-action\s*\{[^}]*background-color:\s*rgb\(var\(--accent-action-bg\)\)/ },
            { label: '.hover:bg-accent-action-hover utility', pattern: /\.hover\\:bg-accent-action-hover:hover\s*\{[^}]*background-color:\s*rgb\(var\(--accent-action-hover\)\)/ },
            { label: '.text-accent-on-action utility', pattern: /\.text-accent-on-action\s*\{[^}]*color:\s*rgb\(var\(--accent-on-action\)\)/ },
            { label: '.focus-visible:ring-accent-focus selector', pattern: /\.focus-visible\\:ring-accent-focus:focus-visible\s*\{[^}]*--tw-ring-color:\s*rgb\(var\(--accent-focus\)\)/ },
            { label: '.focus:ring-accent-focus selector', pattern: /\.focus\\:ring-accent-focus:focus\s*\{[^}]*--tw-ring-color:\s*rgb\(var\(--accent-focus\)\)/ },
        ];
        for (const { label, pattern } of expectedCompiledSnippets) {
            if (!pattern.test(compiledCss)) {
                errors.push(`Compiled CSS verification failed: ${label} did not compile to expected selector & token binding.`);
            }
        }
    } catch (compileErr) {
        errors.push(`Failed to compile src/styles/global.css via PostCSS: ${compileErr instanceof Error ? compileErr.message : String(compileErr)}`);
    }

    // 6. Verify Component Alignment (Button, Card, Badge, ConfirmModal)
    const buttonTsx = readFileSafe('src/ui/primitives/Button.tsx');
    if (buttonTsx) {
        if (!buttonTsx.includes('bg-accent-action')) {
            errors.push('src/ui/primitives/Button.tsx primary variant must use bg-accent-action for WCAG compliance.');
        }
        if (!buttonTsx.includes('focus-visible:ring-accent-focus')) {
            errors.push('src/ui/primitives/Button.tsx must use focus-visible:ring-accent-focus for WCAG 2.2 SC 1.4.11 focus ring contrast.');
        }
    }

    const cardTsx = readFileSafe('src/ui/primitives/Card.tsx');
    if (cardTsx && (!cardTsx.includes('shadow-card') || !cardTsx.includes('rounded-card'))) {
        errors.push('src/ui/primitives/Card.tsx must use wired shadow-card and rounded-card utilities.');
    }

    const badgeTsx = readFileSafe('src/ui/primitives/Badge.tsx');
    if (badgeTsx && !badgeTsx.includes('showDot ?? dot ?? Boolean(dotColors)')) {
        errors.push('src/ui/primitives/Badge.tsx must allow explicit dot={false} / showDot={false} override.');
    }

    const confirmModalTsx = readFileSafe('src/ui/primitives/ConfirmModal.tsx');
    if (confirmModalTsx && (!confirmModalTsx.includes('rounded-dialog') || !confirmModalTsx.includes('rounded-control'))) {
        errors.push('src/ui/primitives/ConfirmModal.tsx must use rounded-dialog on container and rounded-control on buttons.');
    }

    // 7. Walk `src/` for 3-Tier Semantic & Fixed-Color Contrast + Two-Way Manifest Verification
    function walkDirForContrast(dirPath) {
        for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                walkDirForContrast(fullPath);
            } else if (
                (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) &&
                !entry.name.endsWith('.test.tsx') &&
                !entry.name.endsWith('.test.ts')
            ) {
                const rel = path.relative(rootDir, fullPath).replace(/\\/g, '/');
                const sourceText = fs.readFileSync(fullPath, 'utf8');
                const { errors: fileErrors, discoveredExceptions } = scanFileContentForContrast(sourceText, rel);
                errors.push(...fileErrors);
                allDiscoveredExceptions.push(...discoveredExceptions);
            }
        }
    }
    walkDirForContrast(path.join(rootDir, 'src'));

    // Enforce two-way parity with SEMANTIC_COLOR_EXCEPTIONS manifest
    const manifestErrors = verifySemanticExceptionsManifest(allDiscoveredExceptions, SEMANTIC_COLOR_EXCEPTIONS);
    errors.push(...manifestErrors);

    // 8. Verify Critical Path No-Barrel Guardrail on main.tsx, App.tsx, router.tsx, AppLayout.tsx
    const criticalStartupFiles = [
        'src/main.tsx',
        'src/app/App.tsx',
        'src/app/router.tsx',
        'src/app/layout/AppLayout.tsx',
    ];
    for (const relPath of criticalStartupFiles) {
        const content = readFileSafe(relPath);
        if (content) {
            if (/from\s+['"]@\/ui['"]/.test(content) || /from\s+['"]\.\.\/ui['"]/.test(content)) {
                errors.push(`${relPath} imports from UI barrel file instead of direct module path.`);
            }
            if (/from\s+['"]@\/core\/stores['"]/.test(content) || /from\s+['"]\.\.\/core\/stores['"]/.test(content)) {
                errors.push(`${relPath} imports from stores barrel file instead of direct store module.`);
            }
        }
    }

    return {
        ok: errors.length === 0,
        errors,
        discoveredExceptions: allDiscoveredExceptions,
    };
}

// Run when invoked directly from CLI
const isCliEntry = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isCliEntry) {
    if (process.env.SKIP_DESIGN_SYSTEM_CHECK === '1') {
        console.log('⏭️  Skipping duplicate Design System check (SKIP_DESIGN_SYSTEM_CHECK=1 already verified in CI step).');
        process.exit(0);
    }

    const { ok, errors, discoveredExceptions } = await runDesignSystemAudit();
    if (!ok) {
        console.error(`❌ Design System & Runtime Integrity Check Failed (${errors.length} issue(s)):`);
        for (const err of errors) {
            console.error(`   - ${err}`);
        }
        process.exit(1);
    } else {
        console.log(
            `✅ Design System & Runtime Integrity Check Passed: ${CANONICAL_DOCS.length} canonical docs, :root + ${THEME_IDS.length} themes × 16 palette/action/focus tokens, 22 Tailwind color families, ${discoveredExceptions.length}/${SEMANTIC_COLOR_EXCEPTIONS.length} manifest-verified semantic fixed-color exceptions, compiled PostCSS selector rules, zero self-references, and component guardrails verified.`
        );
    }
}
