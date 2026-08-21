#!/usr/bin/env node
/**
 * i18n Key Parity Check — TdyTime
 *
 * Verifies that `src/i18n/locales/vi.json` and `src/i18n/locales/en.json`
 * expose the exact same set of (nested) translation keys.
 *
 * This does NOT check whether a key is actually referenced by the app code
 * (dead/orphaned keys are a separate concern) — it only guards against the
 * two locale files drifting apart, which was the root cause of B4.
 *
 * Usage: node scripts/check-i18n-parity.mjs
 * Exit code: 0 if in sync, 1 if any key is missing from either locale.
 */
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VI_PATH = resolve(__dirname, '../src/i18n/locales/vi.json');
const EN_PATH = resolve(__dirname, '../src/i18n/locales/en.json');

/** Flatten a nested translation object into dot-notation keys. */
function flatten(obj, prefix = '') {
    let keys = [];
    for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            keys = keys.concat(flatten(value, fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

function loadJson(path) {
    return JSON.parse(readFileSync(path, 'utf-8'));
}

const vi = loadJson(VI_PATH);
const en = loadJson(EN_PATH);

const viKeys = new Set(flatten(vi));
const enKeys = new Set(flatten(en));

const missingInEn = [...viKeys].filter((k) => !enKeys.has(k)).sort();
const missingInVi = [...enKeys].filter((k) => !viKeys.has(k)).sort();

console.log(`vi.json: ${viKeys.size} keys`);
console.log(`en.json: ${enKeys.size} keys`);
console.log(`Missing in vi: ${missingInVi.length}`);
console.log(`Missing in en: ${missingInEn.length}`);

if (missingInVi.length > 0) {
    console.log('\nKeys present in en.json but missing from vi.json:');
    for (const k of missingInVi) console.log(`  - ${k}`);
}

if (missingInEn.length > 0) {
    console.log('\nKeys present in vi.json but missing from en.json:');
    for (const k of missingInEn) console.log(`  - ${k}`);
}

if (missingInVi.length > 0 || missingInEn.length > 0) {
    console.error('\n✖ i18n key parity check FAILED — locales are out of sync.');
    process.exit(1);
}

console.log('\n✓ i18n key parity OK — vi.json and en.json are in sync.');
process.exit(0);
