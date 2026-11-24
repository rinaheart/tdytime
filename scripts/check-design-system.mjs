/**
 * Automated Design System Integrity & WCAG 2.2 AA Contrast Auditor — TdyTime
 *
 * Enforces:
 * 1. Canonical 7-document Design System structure in `docs/design-system/`.
 * 2. Zero external project branding (`TdyTripZ`) in active code, CSS, docs, or i18n locales.
 * 3. Per-theme token completeness: every `[data-accent="theme..."]` block in `tokens.css`
 *    must define all 11 `--accent-50..950` shades + `--accent-action-bg`, `--accent-action-hover`, `--accent-on-action`.
 * 4. Cross-file parity between `THEMES` in `src/core/config/constants.ts` and `src/styles/tokens.css`.
 * 5. WCAG 2.2 AA contrast ratio (>= 4.5:1) for `--accent-action-bg` and `--accent-action-hover`
 *    against `--accent-on-action` across all 7 themes.
 * 6. Semantic color stability: Status and Domain tokens must not be mutated inside `[data-accent]` blocks.
 * 7. Zero Token Debt: Typography (`--font-*`), Semantic Radius (`--radius-*`), and Shadow (`--shadow-*`)
 *    tokens declared in `tokens.css` must be wired via `var(--...)` in `global.css`.
 * 8. Component & Critical-Path Guardrails (`Button`, `Card`, `Badge`, and no-barrel startup imports).
 *
 * Usage:
 *   node scripts/check-design-system.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
const THEME_IDS = [
    'themeBlue',
    'themeGreen',
    'themePink',
    'themeViolet',
    'themeRed',
    'themeYellow',
    'themeGrey',
];

/** Canonical RGB values for each theme's 500 shade to verify CSS <-> constants.ts alignment */
const EXPECTED_THEME_500_RGB = {
    themeBlue: '59 130 246',
    themeGreen: '16 185 129',
    themePink: '236 72 153',
    themeViolet: '139 92 246',
    themeRed: '239 68 68',
    themeYellow: '234 179 8',
    themeGrey: '100 116 139',
};

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
 * Compute WCAG 2.1 / 2.2 relative luminance from an "R G B" string (e.g., "37 99 235")
 */
function parseRgbChannels(rgbStr) {
    const parts = rgbStr.trim().split(/\s+/).map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
        return null;
    }
    return parts;
}

function getRelativeLuminance([r, g, b]) {
    const toLinear = (c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
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

// 3. Parse tokens.css blocks and verify per-theme completeness, WCAG AA contrast, and semantic stability
const tokensCss = readFileSafe('src/styles/tokens.css');
const globalCss = readFileSafe('src/styles/global.css');
const constantsTs = readFileSafe('src/core/config/constants.ts');

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

if (tokensCss && globalCss && constantsTs) {
    const rootBlock = extractCssBlock(tokensCss, ':root');
    if (!rootBlock) {
        errors.push('src/styles/tokens.css is missing :root block.');
    } else {
        const rootVars = parseCssVars(rootBlock);

        // Verify typography, semantic radius, shadow, status, and domain tokens in :root
        const requiredRootTokens = [
            '--font-heading',
            '--font-body',
            '--font-num',
            '--radius-badge',
            '--radius-control',
            '--radius-card',
            '--radius-dialog',
            '--shadow-card',
            '--shadow-card-hover',
            '--shadow-modal',
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

    // Verify each of the 7 themes individually
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

        // Check all 11 accent shades inside this specific theme block
        for (const shade of ACCENT_SHADES) {
            const varName = `--accent-${shade}`;
            if (!themeVars[varName]) {
                errors.push(`[data-accent="${themeId}"] is missing ${varName}.`);
            } else if (!parseRgbChannels(themeVars[varName])) {
                errors.push(`[data-accent="${themeId}"] ${varName}="${themeVars[varName]}" is not a valid 3-channel RGB string.`);
            }
        }

        // Verify 500 shade matches expected canonical palette for constants.ts alignment
        if (themeVars['--accent-500'] !== EXPECTED_THEME_500_RGB[themeId]) {
            errors.push(
                `[data-accent="${themeId}"] --accent-500 (${themeVars['--accent-500']}) does not match canonical palette (${EXPECTED_THEME_500_RGB[themeId]}).`
            );
        }

        // Check action tokens and WCAG 2.2 AA contrast (>= 4.5:1)
        for (const actionToken of ACTION_TOKENS) {
            if (!themeVars[actionToken]) {
                errors.push(`[data-accent="${themeId}"] is missing ${actionToken}.`);
            }
        }

        const bgRgb = themeVars['--accent-action-bg'] ? parseRgbChannels(themeVars['--accent-action-bg']) : null;
        const hoverRgb = themeVars['--accent-action-hover'] ? parseRgbChannels(themeVars['--accent-action-hover']) : null;
        const onRgb = themeVars['--accent-on-action'] ? parseRgbChannels(themeVars['--accent-on-action']) : null;

        if (bgRgb && onRgb) {
            const ratio = getContrastRatio(bgRgb, onRgb);
            if (ratio < 3.0) {
                errors.push(
                    `WCAG 3:1 Contrast Failure in ${themeId}: --accent-action-bg vs --accent-on-action is ${ratio.toFixed(2)}:1 (< 3.0:1).`
                );
            } else if (ratio < 4.5) {
                errors.push(
                    `WCAG AA Contrast Failure in ${themeId}: --accent-action-bg vs --accent-on-action is ${ratio.toFixed(2)}:1 (< 4.5:1).`
                );
            }
        }
        if (hoverRgb && onRgb) {
            const hoverRatio = getContrastRatio(hoverRgb, onRgb);
            if (hoverRatio < 4.5) {
                errors.push(
                    `WCAG AA Contrast Failure in ${themeId}: --accent-action-hover vs --accent-on-action is ${hoverRatio.toFixed(2)}:1 (< 4.5:1).`
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

    // 4. Verify global.css wiring (Zero duplicate hardcoded radii, wired fonts & shadows)
    if (!globalCss.includes('@custom-variant dark (&:where(.dark, .dark *));')) {
        errors.push('src/styles/global.css is missing mandatory Tailwind v4 @custom-variant dark directive.');
    }

    for (const shade of ACCENT_SHADES) {
        if (!globalCss.includes(`--color-accent-${shade}: rgb(var(--accent-${shade}));`)) {
            errors.push(`src/styles/global.css @theme block is missing --color-accent-${shade} registration.`);
        }
    }

    const requiredGlobalWiring = [
        '--color-accent-action: rgb(var(--accent-action-bg));',
        '--color-accent-action-hover: rgb(var(--accent-action-hover));',
        '--color-accent-on-action: rgb(var(--accent-on-action));',
        '--radius-badge: var(--radius-badge);',
        '--radius-control: var(--radius-control);',
        '--radius-card: var(--radius-card);',
        '--radius-dialog: var(--radius-dialog);',
        '--radius-sm: var(--radius-badge);',
        '--radius-md: var(--radius-control);',
        '--radius-lg: var(--radius-control);',
        '--radius-xl: var(--radius-control);',
        '--radius-2xl: var(--radius-card);',
        '--radius-3xl: var(--radius-dialog);',
        '--shadow-card: var(--shadow-card);',
        '--shadow-card-hover: var(--shadow-card-hover);',
        '--shadow-modal: var(--shadow-modal);',
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

// 5. Verify Component Alignment (Button, Card, Badge) & Scan TSX files for unoverridden bg-accent-500/600 + text-white
const buttonTsx = readFileSafe('src/ui/primitives/Button.tsx');
if (buttonTsx && !buttonTsx.includes('bg-accent-action')) {
    errors.push('src/ui/primitives/Button.tsx primary variant must use bg-accent-action for WCAG compliance.');
}

const cardTsx = readFileSafe('src/ui/primitives/Card.tsx');
if (cardTsx && (!cardTsx.includes('shadow-card') || !cardTsx.includes('rounded-card'))) {
    errors.push('src/ui/primitives/Card.tsx must use wired shadow-card and rounded-card utilities.');
}

const badgeTsx = readFileSafe('src/ui/primitives/Badge.tsx');
if (badgeTsx && !badgeTsx.includes('showDot ?? dot ?? Boolean(dotColors)')) {
    errors.push('src/ui/primitives/Badge.tsx must allow explicit dot={false} / showDot={false} override.');
}

function scanTsxForUnsafeAccentContrast(dirPath) {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            scanTsxForUnsafeAccentContrast(fullPath);
        } else if (entry.name.endsWith('.tsx')) {
            const rel = path.relative(rootDir, fullPath);
            const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
            lines.forEach((line, idx) => {
                if (
                    /bg-accent-(400|500|600)\b/.test(line) &&
                    /\btext-white\b/.test(line)
                ) {
                    errors.push(
                        `${rel}:${idx + 1} pairs bg-accent-400/500/600 directly with text-white (fails 3:1 in themeYellow). Use bg-accent-action and text-accent-on-action instead.`
                    );
                }
            });
        }
    }
}
scanTsxForUnsafeAccentContrast(path.join(rootDir, 'src'));

// 6. Verify Critical Path No-Barrel Guardrail on main.tsx, App.tsx, router.tsx, AppLayout.tsx
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
    console.error(`❌ Design System & Contrast Check Failed (${errors.length} issue(s)):`);
    for (const err of errors) {
        console.error(`   - ${err}`);
    }
    process.exit(1);
} else {
    console.log(
        `✅ Design System & WCAG Contrast Check Passed: ${CANONICAL_DOCS.length} canonical docs, ${THEME_IDS.length} themes × (${ACCENT_SHADES.length} shades + 3 WCAG contrast-verified action tokens >= 4.5:1), wired font/radius/shadow tokens, and component guardrails verified.`
    );
}
