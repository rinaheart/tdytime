/**
 * Automated Design System Runtime Integrity & WCAG 2.2 Contrast Auditor — TdyTime
 *
 * Enforces:
 * 1. Canonical 7-document Design System structure in `docs/design-system/`.
 * 2. Zero external project branding (`TdyTripZ`) in active code, CSS, docs, or i18n locales.
 * 3. Single Source of Palette Parity: parses `THEME_PALETTES` directly from `src/core/config/constants.ts`
 *    (no duplicate hardcoded RGB tables) and verifies 100% 1:1 parity across all 7 themes × 16 tokens
 *    (11 `--accent-50..950` shades + 3 `--accent-action-*` tokens + 2 `--accent-focus-*` tokens) in `tokens.css`.
 * 4. Fail-closed RGB validation & WCAG 2.2 (0.04045 relative luminance threshold) contrast verification:
 *    - `--accent-action-bg` & `--accent-action-hover` vs `--accent-on-action` >= 4.5:1 (WCAG 2.2 AA).
 *    - `--accent-focus-light` vs Light Mode surfaces (`#FFFFFF` & `slate-50` `#F8FAFC`) >= 3.0:1 (WCAG 2.2 SC 1.4.11).
 *    - `--accent-focus-dark` vs Dark Mode surfaces (`slate-900` `#0F172A` & `slate-950` `#020617`) >= 3.0:1 (WCAG 2.2 SC 1.4.11).
 * 5. Zero CSS Variable Self-Reference (`--x: var(--x)`) and `@theme inline` wiring of `--tdy-radius-*` and `--tdy-shadow-*`.
 * 6. Compiled CSS Runtime Utility Verification via PostCSS + `@tailwindcss/postcss` on `src/styles/global.css`.
 * 7. Component & Critical-Path Guardrails (`Button`, `Card`, `Badge`, `ConfirmModal`, and no raw accent focus/text-white).
 *
 * Usage:
 *   node scripts/check-design-system.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import tailwindcssPostcss from '@tailwindcss/postcss';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const CANONICAL_DOCS = [
    'README.md',
    'DESIGN_DNA.md',
    'DESIGN_TOKENS.md',
    'COMPONENT_GUIDELINES.md',
    'LAYOUT_AND_RESPONSIVE.md',
    'INTERACTION_AND_ACCESSIBILITY.md',
    'DESIGN_AUDIT_REPORT.md',
];

const DEPRECATED_SPLIT_DOCS = [
    'DESIGN_PRINCIPLES.md',
    'COLOR_SYSTEM.md',
    'TYPOGRAPHY.md',
    'SPACING_AND_LAYOUT.md',
    'RESPONSIVE_GUIDELINES.md',
    'INTERACTION_AND_MOTION.md',
    'ACCESSIBILITY.md',
    'DO_AND_DONT.md',
];

const ACCENT_SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const ACTION_TOKENS = ['--accent-action-bg', '--accent-action-hover', '--accent-on-action'];
const FOCUS_TOKENS = ['--accent-focus-light', '--accent-focus-dark'];
const THEME_IDS = [
    'themeBlue',
    'themeGreen',
    'themePink',
    'themeViolet',
    'themeRed',
    'themeYellow',
    'themeGrey',
];

/** Adjacent surface colors in RGB for WCAG 2.2 SC 1.4.11 Non-text Focus Contrast (>= 3.0:1) */
const LIGHT_SURFACE_WHITE = [255, 255, 255]; // #FFFFFF
const LIGHT_SURFACE_SLATE_50 = [248, 250, 252]; // #F8FAFC
const DARK_SURFACE_SLATE_900 = [15, 23, 42]; // #0F172A
const DARK_SURFACE_SLATE_950 = [2, 6, 23]; // #020617

const errors = [];

function readFileSafe(relPath) {
    const full = path.join(rootDir, relPath);
    if (!fs.existsSync(full)) {
        errors.push(`Missing required file: ${relPath}`);
        return null;
    }
    return fs.readFileSync(full, 'utf8');
}

/**
 * Parse a 3-channel "R G B" string (e.g. "37 99 235"). Returns null if malformed or out of [0, 255].
 */
function parseRgbChannels(rgbStr) {
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
 * Compute W3C WCAG 2.2 relative luminance using the canonical 0.04045 sRGB threshold.
 */
function getRelativeLuminance([r, g, b]) {
    const toLinear = (c) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const [R, G, B] = [toLinear(r), toLinear(g), toLinear(b)];
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function getContrastRatio(rgbA, rgbB) {
    const lumA = getRelativeLuminance(rgbA);
    const lumB = getRelativeLuminance(rgbB);
    const brightest = Math.max(lumA, lumB);
    const darkest = Math.min(lumA, lumB);
    return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Extract canonical THEME_PALETTES from `src/core/config/constants.ts` so there is
 * only ONE source of palette truth across TypeScript and CSS.
 */
function parseThemePalettesFromConstants(constantsSource) {
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

function detectSelfReferencingCssVars(cssText, fileName) {
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
    detectSelfReferencingCssVars(tokensCss, 'src/styles/tokens.css');
    detectSelfReferencingCssVars(globalCss, 'src/styles/global.css');

    const canonicalPalettes = parseThemePalettesFromConstants(constantsTs);

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

        // Check all 11 accent shades inside this theme block and verify 1:1 parity with THEME_PALETTES
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

        // Fail-closed validation for all 3 action tokens
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

        // Parity check for action tokens against THEME_PALETTES in constants.ts
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

        // WCAG 2.2 AA Contrast check (>= 4.5:1) for action tokens
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

        // Fail-closed validation & WCAG 2.2 SC 1.4.11 (>= 3.0:1) contrast check for Focus Ring tokens
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

        // Ensure Status & Domain semantic tokens are NOT mutated inside theme block
        for (const varName of Object.keys(themeVars)) {
            if (varName.startsWith('--semantic-')) {
                errors.push(
                    `[data-accent="${themeId}"] mutates fixed semantic/domain token ${varName}. Status and Domain colors must remain stable across themes.`
                );
            }
        }
    }

    // 4. Verify global.css @theme inline wiring (Zero self-referencing radii or shadows)
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

// 5. Compiled CSS Runtime Utility Check via PostCSS + @tailwindcss/postcss
try {
    const globalCssPath = path.join(rootDir, 'src/styles/global.css');
    const rawGlobalCss = fs.readFileSync(globalCssPath, 'utf8');
    const result = await postcss([tailwindcssPostcss()]).process(rawGlobalCss, {
        from: globalCssPath,
    });
    const compiledCss = result.css;

    // Ensure compiled CSS has zero self-referencing variables
    detectSelfReferencingCssVars(compiledCss, 'compiled global.css output');

    const expectedCompiledSnippets = [
        { label: '.rounded-badge utility', pattern: /\.rounded-badge\s*\{[^}]*border-radius:\s*var\(--tdy-radius-badge\)/ },
        { label: '.rounded-control utility', pattern: /\.rounded-control\s*\{[^}]*border-radius:\s*var\(--tdy-radius-control\)/ },
        { label: '.rounded-card utility', pattern: /\.rounded-card\s*\{[^}]*border-radius:\s*var\(--tdy-radius-card\)/ },
        { label: '.rounded-dialog utility', pattern: /\.rounded-dialog\s*\{[^}]*border-radius:\s*var\(--tdy-radius-dialog\)/ },
        { label: '.shadow-card utility', pattern: /\.shadow-card\s*\{[^}]*--tw-shadow:\s*var\(--tdy-shadow-card\)/ },
        { label: '.shadow-modal utility', pattern: /\.shadow-modal\s*\{[^}]*--tw-shadow:\s*var\(--tdy-shadow-modal\)/ },
        { label: '.bg-accent-action utility', pattern: /\.bg-accent-action\s*\{[^}]*background-color:\s*rgb\(var\(--accent-action-bg\)\)/ },
        { label: '.text-accent-on-action utility', pattern: /\.text-accent-on-action\s*\{[^}]*color:\s*rgb\(var\(--accent-on-action\)\)/ },
        { label: '.focus-visible:ring-accent-focus utility', pattern: /--tw-ring-color:\s*rgb\(var\(--accent-focus\)\)/ },
    ];
    for (const { label, pattern } of expectedCompiledSnippets) {
        if (!pattern.test(compiledCss)) {
            errors.push(`Compiled CSS verification failed: ${label} did not compile to expected token binding.`);
        }
    }
} catch (compileErr) {
    errors.push(`Failed to compile src/styles/global.css via PostCSS: ${compileErr instanceof Error ? compileErr.message : String(compileErr)}`);
}

// 6. Verify Component Alignment (Button, Card, Badge, ConfirmModal) & Scan TSX files for unsafe contrast or raw focus rings
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

function scanTsxForUnsafeAccentPatterns(dirPath) {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            scanTsxForUnsafeAccentPatterns(fullPath);
        } else if (entry.name.endsWith('.tsx')) {
            const rel = path.relative(rootDir, fullPath);
            const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
            lines.forEach((line, idx) => {
                if (/bg-accent-(400|500|600)\b/.test(line) && /\btext-white\b/.test(line)) {
                    errors.push(
                        `${rel}:${idx + 1} pairs bg-accent-400/500/600 directly with text-white (fails 3:1 in themeYellow). Use bg-accent-action and text-accent-on-action instead.`
                    );
                }
                if (/(?:focus|focus-visible):ring-accent-(400|500|600)\b/.test(line)) {
                    errors.push(
                        `${rel}:${idx + 1} uses raw focus ring accent shade (fails 3:1 in themeYellow/themeGreen). Use focus-visible:ring-accent-focus instead.`
                    );
                }
            });
        }
    }
}
scanTsxForUnsafeAccentPatterns(path.join(rootDir, 'src'));

// 7. Verify Critical Path No-Barrel Guardrail on main.tsx, App.tsx, router.tsx, AppLayout.tsx
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

if (errors.length > 0) {
    console.error(`❌ Design System & Runtime Integrity Check Failed (${errors.length} issue(s)):`);
    for (const err of errors) {
        console.error(`   - ${err}`);
    }
    process.exit(1);
} else {
    console.log(
        `✅ Design System & Runtime Integrity Check Passed: ${CANONICAL_DOCS.length} canonical docs, ${THEME_IDS.length} themes × 16 palette/action/focus tokens (WCAG 2.2 AA >= 4.5:1 & Focus SC 1.4.11 >= 3.0:1), compiled PostCSS utilities, zero self-references, and component guardrails verified.`
    );
}
