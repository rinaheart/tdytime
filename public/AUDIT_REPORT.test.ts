import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = resolve(__dirname, 'AUDIT_REPORT.md');

let content: string;

beforeAll(() => {
    content = readFileSync(REPORT_PATH, 'utf-8');
});

describe('AUDIT_REPORT.md - Document structure', () => {
    it('exists and is non-empty', () => {
        expect(content).toBeTruthy();
        expect(content.length).toBeGreaterThan(0);
    });

    it('has the correct report title', () => {
        expect(content).toContain('Báo cáo Audit & Phát hiện Bug - TdyTime v2');
    });

    it('contains all four severity sections', () => {
        expect(content).toContain('Critical');
        expect(content).toContain('High');
        expect(content).toContain('Medium');
        // Architecture review section
        expect(content).toContain('Architecture Review');
    });

    it('contains the four top-level section headings with numbering', () => {
        // Section 1: Critical
        expect(content).toMatch(/##.*1\./);
        // Section 2: High
        expect(content).toMatch(/##.*2\./);
        // Section 3: Medium
        expect(content).toMatch(/##.*3\./);
        // Section 4: Architecture
        expect(content).toMatch(/##.*4\./);
    });

    it('has at least six sub-sections (1.1 through 3.2)', () => {
        expect(content).toContain('1.1');
        expect(content).toContain('1.2');
        expect(content).toContain('2.1');
        expect(content).toContain('2.2');
        expect(content).toContain('3.1');
        expect(content).toContain('3.2');
    });
});

describe('AUDIT_REPORT.md - Critical issues (Section 1)', () => {
    it('documents the unsafe JSON.parse crash bug (1.1)', () => {
        expect(content).toContain('JSON.parse');
        expect(content).toContain('localStorage');
        expect(content).toContain('try');
        expect(content).toContain('catch');
    });

    it('references the affected source files for bug 1.1', () => {
        expect(content).toContain('schedule.store.ts');
        expect(content).toContain('history.service.ts');
    });

    it('provides a fix recommendation for bug 1.1 involving empty array fallback', () => {
        expect(content).toContain('[]');
    });

    it('documents the timezone calculation bug (1.2)', () => {
        expect(content).toContain('Timezone');
        // Should mention the problematic pattern
        expect(content).toContain('new Date(y, m - 1, d)');
        expect(content).toContain('setHours');
    });

    it('references the affected source files for bug 1.2', () => {
        expect(content).toContain('schedule.index.ts');
        expect(content).toContain('schedule.utils.ts');
    });

    it('recommends a fix strategy for the timezone bug', () => {
        // Should mention using a timezone-aware library or UTC approach
        expect(content).toMatch(/date-fns-tz|Temporal API|UTC/);
    });
});

describe('AUDIT_REPORT.md - High risk issues (Section 2)', () => {
    it('documents the React Hooks dependency bug (2.1)', () => {
        expect(content).toContain('useMemo');
        expect(content).toContain('useEffect');
    });

    it('identifies the stale closure and cascade render problem (2.1)', () => {
        expect(content).toContain('useTodayData.ts');
        expect(content).toContain('setTimeout');
    });

    it('recommends passing primitive values to dependency arrays (2.1)', () => {
        expect(content).toContain('nowTs');
        expect(content).toContain('useCallback');
    });

    it('documents the history ID collision bug (2.2)', () => {
        expect(content).toContain('Date.now()');
        expect(content).toContain('history.service.ts');
    });

    it('recommends crypto.randomUUID() to replace Date.now() ID generation (2.2)', () => {
        expect(content).toContain('crypto.randomUUID()');
    });

    it('recommends immutable array operations over splice (2.2)', () => {
        expect(content).toContain('filter');
        expect(content).toContain('splice');
        // The report should contrast immutable (filter) vs mutable (splice)
        const spliceIdx = content.indexOf('splice');
        const filterIdx = content.indexOf('filter');
        expect(spliceIdx).toBeGreaterThan(-1);
        expect(filterIdx).toBeGreaterThan(-1);
    });
});

describe('AUDIT_REPORT.md - Medium issues (Section 3)', () => {
    it('documents the course type classification edge case (3.1)', () => {
        expect(content).toContain('parser.ts');
        expect(content).toContain('processSlotRow');
        expect(content).toContain('sanitizeScheduleData');
    });

    it('mentions the current regex and its shortcoming (3.1)', () => {
        expect(content).toContain('COURSE_TYPE_TH_REGEX');
        expect(content).toContain('TT ');
    });

    it('proposes an improved regex pattern for course type detection (3.1)', () => {
        expect(content).toContain('-TH');
        expect(content).toContain('Thực hành');
    });

    it('documents the PWA update notification loop bug (3.2)', () => {
        expect(content).toContain('PWAUpdateHandler.tsx');
        expect(content).toContain('tdytime_install_prompt_dismissed');
    });

    it('mentions the dismiss duration logic flaw (3.2)', () => {
        expect(content).toContain('DISMISS_DURATION');
        expect(content).toContain('needUpdate');
    });

    it('recommends using sessionStorage to prevent repeated update prompts (3.2)', () => {
        expect(content).toContain('sessionStorage');
    });
});

describe('AUDIT_REPORT.md - Architecture review (Section 4)', () => {
    it('includes a pros section', () => {
        expect(content).toMatch(/Pros|Điểm Sáng/);
    });

    it('includes a cons section', () => {
        expect(content).toMatch(/Cons|Điểm Cần Cải Thiện/);
    });

    it('mentions Zustand and flat session index as a positive design choice', () => {
        expect(content).toContain('Zustand');
        expect(content).toContain('Flat Sessions Index');
    });

    it('mentions Offline-First PWA and vite-plugin-pwa as a positive design choice', () => {
        expect(content).toContain('Offline-First PWA');
        expect(content).toContain('vite-plugin-pwa');
    });

    it('identifies lack of a validation layer as a weakness', () => {
        expect(content).toContain('Validation Layer');
        expect(content).toContain('Zod');
    });

    it('identifies the God Store anti-pattern as a weakness', () => {
        expect(content).toContain('God Store');
        expect(content).toContain('schedule.store.ts');
    });
});

describe('AUDIT_REPORT.md - Document metadata', () => {
    it('includes an auditor attribution line', () => {
        expect(content).toContain('TdyTime Auto-Audit System');
    });

    it('includes a timestamp placeholder line', () => {
        expect(content).toContain('Report Generated on');
    });

    it('has the [CURRENT_TIMESTAMP] placeholder unfilled (regression: placeholder must not be empty string)', () => {
        // The placeholder should still be present as-is, not replaced with empty string
        expect(content).toContain('[CURRENT_TIMESTAMP]');
    });

    it('does not exceed 200 lines (document size sanity check)', () => {
        const lines = content.split('\n');
        expect(lines.length).toBeLessThanOrEqual(200);
    });

    it('contains horizontal rules separating major sections', () => {
        const hrCount = (content.match(/^---$/gm) ?? []).length;
        expect(hrCount).toBeGreaterThanOrEqual(3);
    });
});

describe('AUDIT_REPORT.md - Source file references integrity', () => {
    it('references only valid-looking TypeScript source file paths', () => {
        // Extract backtick-quoted file references
        const fileRefs = content.match(/`src\/[^`]+\.(?:ts|tsx)`/g) ?? [];
        expect(fileRefs.length).toBeGreaterThan(0);
        for (const ref of fileRefs) {
            // Each reference should look like a valid relative TS/TSX path
            expect(ref).toMatch(/^`src\/[\w/.-]+\.(?:ts|tsx)`$/);
        }
    });

    it('covers files from at least three different source directories', () => {
        const dirs = new Set<string>();
        const matches = content.matchAll(/`(src\/[^/`]+\/)/g);
        for (const m of matches) {
            dirs.add(m[1]);
        }
        expect(dirs.size).toBeGreaterThanOrEqual(3);
    });
});
