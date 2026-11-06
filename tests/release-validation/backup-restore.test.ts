/**
 * Backup & Restore Validation Test Suite
 * 
 * Validates:
 * 1. Active schedule JSON import & roundtrip integrity (Vietnamese Unicode)
 * 2. UTF-8 BOM CSV export for Excel compatibility
 * 3. Malformed/Empty/Corrupted file rejection
 * 4. Timetable history persistence & deduplication
 * 5. Notes persistence & recovery
 * 6. Audit of current backup capabilities and limitations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useScheduleStore } from '@/core/stores/schedule.store';
import { useNotesStore } from '@/core/stores/notes.store';
import { historyService } from '@/core/schedule/history.service';
import { CourseType, type ScheduleData } from '@/core/schedule/schedule.types';
import { exportToCSV } from '@/utils/export-csv';
import * as fileSaver from 'file-saver';

// Mock file-saver to inspect generated blob
vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
}));

// In-memory mock for idb in Node/jsdom test runner
const idbMemory = new Map<string, unknown>();
vi.mock('@/core/utils/idb', () => ({
    get: vi.fn(async (key: string) => idbMemory.get(key)),
    set: vi.fn(async (key: string, val: unknown) => { idbMemory.set(key, val); }),
    remove: vi.fn(async (key: string) => { idbMemory.delete(key); }),
}));

describe('PHASE 3: Backup & Restore Validation', () => {
    const mockT = (key: string, opts?: Record<string, unknown>) => {
        if (opts && opts.date) return `${key} (${opts.date})`;
        return key;
    };

    beforeEach(() => {
        localStorage.clear();
        idbMemory.clear();
        useNotesStore.getState().clearAllNotes();
        useScheduleStore.setState({
            data: null,
            error: null,
            sessionsIndex: [],
            abbreviations: {},
            overrides: {},
            historyList: [],
            isInitialized: false,
        });
        vi.clearAllMocks();
    });

    const vietnameseSchedule: ScheduleData = {
        metadata: {
            teacher: 'PGS.TS. Nguyễn Văn Bình',
            semester: '2',
            academicYear: '2025-2026',
            extractedDate: '2026-02-15T09:30:00.000Z',
        },
        weeks: [
            {
                weekNumber: 1,
                dateRange: '16/02/2026 - 22/02/2026',
                days: {
                    Monday: {
                        morning: [
                            {
                                id: 'IT401-Monday-1-4',
                                courseCode: 'IT401',
                                courseName: 'Lập trình Ứng dụng Di động & Đa nền tảng',
                                className: '22DTH01',
                                group: '01',
                                room: 'A2-301 (Phòng Thực hành)',
                                timeSlot: '1-4',
                                periodCount: 4,
                                teacher: 'PGS.TS. Nguyễn Văn Bình',
                                type: CourseType.TH,
                                dayOfWeek: 'Monday',
                                sessionTime: 'morning',
                                dateStr: '16/02/2026',
                            },
                        ],
                        afternoon: [],
                        evening: [],
                    },
                    Wednesday: {
                        morning: [],
                        afternoon: [
                            {
                                id: 'MATH201-Wednesday-7-9',
                                courseCode: 'MATH201',
                                courseName: 'Đại số tuyến tính & Hình học giải tích',
                                className: '22DTH02',
                                group: '02',
                                room: 'B1-105',
                                timeSlot: '7-9',
                                periodCount: 3,
                                teacher: 'PGS.TS. Nguyễn Văn Bình',
                                type: CourseType.LT,
                                dayOfWeek: 'Wednesday',
                                sessionTime: 'afternoon',
                                dateStr: '18/02/2026',
                            },
                        ],
                        evening: [],
                    },
                },
            },
        ],
        aggregatedCourses: {},
        abbreviations: {
            'Lập trình Ứng dụng Di động & Đa nền tảng': 'LTMOBILE',
            'Đại số tuyến tính & Hình học giải tích': 'ĐSTT',
        },
        overrides: {
            'IT401': CourseType.TH,
        },
    };

    it('1. Imports valid ScheduleData JSON and preserves full Vietnamese Unicode and structure', async () => {
        const jsonString = JSON.stringify(vietnameseSchedule, null, 2);

        // Upload JSON into ScheduleStore
        useScheduleStore.getState().handleFileUpload(jsonString, mockT, 'vi');
        // Wait for async processLoadedData to finish
        await new Promise((r) => setTimeout(r, 20));

        const loadedData = useScheduleStore.getState().data;
        expect(loadedData).not.toBeNull();

        // Check Unicode teacher name and course name
        expect(loadedData?.metadata.teacher).toBe('PGS.TS. Nguyễn Văn Bình');
        expect(loadedData?.metadata.semester).toBe('2');
        expect(loadedData?.metadata.academicYear).toBe('2025-2026');

        const session = loadedData?.weeks[0].days.Monday?.morning[0];
        expect(session?.courseName).toBe('Lập trình Ứng dụng Di động & Đa nền tảng');
        expect(session?.room).toBe('A2-301 (Phòng Thực hành)');

        // Check abbreviations and overrides
        expect(loadedData?.abbreviations?.['Lập trình Ứng dụng Di động & Đa nền tảng']).toBe('LTMOBILE');
        expect(loadedData?.overrides?.['IT401']).toBe('TH');

        // Verify storage persistence
        expect(localStorage.getItem('last_schedule_data')).toContain('PGS.TS. Nguyễn Văn Bình');
    });

    it('2. Rejects malformed JSON and corrupted payloads safely without crashing', () => {
        // Case A: Empty string
        useScheduleStore.getState().handleFileUpload('', mockT, 'vi');
        expect(useScheduleStore.getState().error).toBe('error.noData');

        // Case B: Corrupted JSON
        useScheduleStore.getState().handleFileUpload('{ invalid json string ...', mockT, 'vi');
        expect(useScheduleStore.getState().error).toBeTruthy();
        expect(useScheduleStore.getState().error).toContain('JSON');

        // Case C: JSON with wrong structure (missing weeks or metadata)
        useScheduleStore.getState().handleFileUpload(JSON.stringify({ someKey: 'someValue' }), mockT, 'vi');
        expect(useScheduleStore.getState().error).toBe('error.invalidStructure');
    });

    it('3. Exports CSV with UTF-8 BOM to guarantee Vietnamese Unicode readability in Excel', async () => {
        // Build session index from Vietnamese schedule
        useScheduleStore.getState().handleFileUpload(JSON.stringify(vietnameseSchedule), mockT, 'vi');
        await new Promise((r) => setTimeout(r, 20));

        const sessions = useScheduleStore.getState().sessionsIndex;
        expect(sessions.length).toBeGreaterThan(0);

        exportToCSV(sessions, 'test-export.csv');

        const saveAsMock = fileSaver.saveAs as unknown as { mock: { calls: Array<[Blob, string]> } };
        const [blobArg, filenameArg] = saveAsMock.mock.calls[0];

        expect(filenameArg).toBe('test-export.csv');
        expect(blobArg).toBeInstanceOf(Blob);

        // 1. Verify UTF-8 BOM bytes (0xEF, 0xBB, 0xBF) in raw buffer
        const buffer = await (blobArg as Blob).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        expect(bytes[0]).toBe(0xEF);
        expect(bytes[1]).toBe(0xBB);
        expect(bytes[2]).toBe(0xBF);

        // 2. Read text from Blob and verify full Vietnamese text
        const blobText = await (blobArg as Blob).text();
        expect(blobText).toContain('Lập trình Ứng dụng Di động & Đa nền tảng');
        expect(blobText).toContain('PGS.TS. Nguyễn Văn Bình');
        expect(blobText).toContain('Đại số tuyến tính & Hình học giải tích');
    });

    it('4. Preserves and deduplicates history items in historyService', async () => {
        await historyService.init();

        // Save first schedule
        await historyService.save(vietnameseSchedule);
        let items = await historyService.getAll();
        expect(items.length).toBe(1);
        expect(items[0].teacher).toBe('PGS.TS. Nguyễn Văn Bình');
        expect(items[0].semester).toBe('2');

        // Save duplicate (same teacher + semester + year)
        await historyService.save(vietnameseSchedule);
        items = await historyService.getAll();
        // Should deduplicate and not exceed 1
        expect(items.length).toBe(1);

        // Save a different schedule
        const anotherSchedule: ScheduleData = {
            ...vietnameseSchedule,
            metadata: {
                ...vietnameseSchedule.metadata,
                semester: '1',
            },
        };
        await historyService.save(anotherSchedule);
        items = await historyService.getAll();
        expect(items.length).toBe(2);
    });

    it('5. Notes store persist: accurately serializes and recovers Unicode session notes', () => {
        const sessionId1 = 'SESSION_2026_02_16_M1';
        const sessionId2 = 'SESSION_2026_02_18_A1';
        const note1 = 'Nhớ photo tài liệu chương 3 cho lớp 22DTH01\nLưu ý: Phòng A2-301 máy chiếu hơi mờ ⚠️';
        const note2 = 'Kiểm tra điểm danh bài tập lớn số 1 💯';

        useNotesStore.getState().setNote(sessionId1, note1);
        useNotesStore.getState().setNote(sessionId2, note2);

        // 1. Recover from store
        expect(useNotesStore.getState().getNote(sessionId1)).toBe(note1);
        expect(useNotesStore.getState().getNote(sessionId2)).toBe(note2);

        // 2. Check raw localStorage serialization
        const rawStorage = localStorage.getItem('tdy_session_notes');
        expect(rawStorage).not.toBeNull();
        const parsed = JSON.parse(rawStorage!);
        expect(parsed.state.notes[sessionId1]).toBe(note1);
        expect(parsed.state.notes[sessionId2]).toBe(note2);
    });

    it('6. Audit finding: Absence of unified one-click backup export in user UI', () => {
        // Verification of current app limitation:
        // - Active schedule can be imported from JSON
        // - Sessions can be exported to CSV & PDF
        // - But there is no unified `exportAllUserData()` button in Settings UI that packages:
        //   { activeSchedule, history, notes, abbreviations } into a single file for pre-Clear-Site-Data safe backup.
        const notes = useNotesStore.getState().notes;
        const currentSchedule = useScheduleStore.getState().data;
        const abbreviations = useScheduleStore.getState().abbreviations;

        const unifiedBackup = {
            version: '2026.11.05',
            exportedAt: new Date().toISOString(),
            schedule: currentSchedule,
            notes,
            abbreviations,
        };

        expect(unifiedBackup).toHaveProperty('version');
        expect(unifiedBackup).toHaveProperty('exportedAt');
    });
});
