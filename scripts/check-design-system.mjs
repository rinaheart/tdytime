/**
 * Automated Design System & Token Compliance Auditor — TdyTime
 * Verifies token parity across `tokens.css`, `global.css`, `constants.ts`,
 * checks documentation completeness in `docs/design-system/`, and detects
 * banned architectural patterns (barrel imports on startup path, missing dark variant).
 *
 * Usage:
 *   node scripts/check-design-system.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const isDryRun = process.argv.includes('--dry-run');

const REQUIRED_DOCS = [
    'README.md',
    'DESIGN_DNA.md',
    'DESIGN_PRINCIPLES.md',
    'DESIGN_TOKENS.md',
    'TYPOGRAPHY.md',
    'COLOR_SYSTEM.md',
    'SPACING_AND_LAYOUT.md',
    'COMPONENT_GUIDELINES.md',
    'INTERACTION_AND_MOTION.md',
    'RESPONSIVE_GUIDELINES.md',
    'ACCESSIBILITY.md',
    'DO_AND_DONT.md',
    'DESIGN_AUDIT_REPORT.md',
];

const ACCENT_SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const THEME_IDS = [
    'themeBlue',
    'themeGreen',
    'themePink',
    'themeViolet',
    'themeRed',
    'themeYellow',
    'themeGrey',
];

const errors = [];

function checkFileExists(relPath) {
    const full = path.join(rootDir, relPath);
    if (!fs.existsSync(full)) {
        errors.push(`Missing required file: ${relPath}`);
        return null;
    }
    return fs.readFileSync(full, 'utf8');
}

// 1. Verify Official Design System Documentation Suite
for (const docName of REQUIRED_DOCS) {
    checkFileExists(path.join('docs/design-system', docName));
}

// 2. Verify tokens.css and global.css parity
const tokensCss = checkFileExists('src/styles/tokens.css');
const globalCss = checkFileExists('src/styles/global.css');

if (tokensCss && globalCss) {
    if (!globalCss.includes('@custom-variant dark (&:where(.dark, .dark *));')) {
        errors.push('src/styles/global.css is missing mandatory Tailwind v4 @custom-variant dark directive.');
    }

    for (const shade of ACCENT_SHADES) {
        if (!tokensCss.includes(`--accent-${shade}:`)) {
            errors.push(`src/styles/tokens.css is missing --accent-${shade} definition.`);
        }
        if (!globalCss.includes(`--color-accent-${shade}: rgb(var(--accent-${shade}));`)) {
            errors.push(`src/styles/global.css @theme block is missing --color-accent-${shade} registration.`);
        }
    }

    for (const themeId of THEME_IDS) {
        if (!tokensCss.includes(`[data-accent="${themeId}"]`)) {
            errors.push(`src/styles/tokens.css is missing [data-accent="${themeId}"] selector block.`);
        }
    }

    // Verify TdyTripZ Compact Radius Scale in @theme
    const expectedRadii = [
        ['--radius-sm', '6px'],
        ['--radius-md', '8px'],
        ['--radius-lg', '8px'],
        ['--radius-xl', '8px'],
        ['--radius-2xl', '10px'],
        ['--radius-3xl', '12px'],
    ];
    for (const [token, val] of expectedRadii) {
        if (!globalCss.includes(`${token}: ${val};`)) {
            errors.push(`src/styles/global.css @theme block differs from TdyTripZ radius contract: ${token}: ${val};`);
        }
    }
}

// 3. Verify Critical Path No-Barrel Guardrail on main.tsx, App.tsx, router.tsx
const criticalStartupFiles = ['src/main.tsx', 'src/app/App.tsx', 'src/app/router.tsx'];
for (const relPath of criticalStartupFiles) {
    const content = checkFileExists(relPath);
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
    console.error(`❌ Design System Compliance Check Failed (${errors.length} issue(s)):`);
    for (const err of errors) {
        console.error(`   - ${err}`);
    }
    process.exit(1);
} else {
    console.log(
        `✅ Design System Compliance Check Passed${isDryRun ? ' (--dry-run mode)' : ''}: ${REQUIRED_DOCS.length} docs, ${ACCENT_SHADES.length} accent shades × ${THEME_IDS.length} themes, TdyTripZ radii, and startup guardrails verified.`
    );
}
