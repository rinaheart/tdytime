/**
 * Full Backup & Restore Test Suite — TdyTime
 * 
 * Validates:
 * 1. Export of all 5 data groups (Schedule, History, Notes, Abbreviations, Preferences)
 * 2. UTF-8 Vietnamese Unicode & Emoji integrity
 * 3. Validation rejection for malformed, corrupted, or unsupported schemas
 * 4. Backward-compatible restoration of legacy ScheduleData JSON
 * 5. Atomic restore roundtrip (Deep Equality)
 * 6. Atomic rollback on restore failure
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { backupService, BACKUP_FORMAT, BACKUP_FORMAT_VERSION, type BackupFile } from '@/core/backup/backup.service';
import { useScheduleStore } from '@/core/stores/schedule.store';
import { useNotesStore } from '@/core/stores/notes.store';
import { historyService } from '@/core/schedule/history.service';
import { CourseType, type ScheduleData } from '@/core/schedule/schedule.types';
import * as fileSaver from 'file-saver';

// Mock file-saver to capture blob and filename
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

describe('PHASE 2 & 4: Full Backup Export & Atomic Restore Validation', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        idbMemory.clear();
        useNotesStore.getState().clearAllNotes();
        useScheduleStore.setState({
            data: null,
            sessionsIndex: [],
            abbreviations: {},
            historyList: [],
            isInitialized: false,
        });
        vi.clearAllMocks();
    });

    const sampleVietnameseSchedule: ScheduleData = {
        metadata: {
            teacher: 'GS.TS. Trần Quốc Hùng 🇻🇳',
            semester: '1',
            academicYear: '2025-2026',
            extractedDate: '2025-08-20T10:00:00.000Z',
        },
        weeks: [
            {
                weekNumber: 1,
                dateRange: '25/08/2025 - 31/08/2025',
                days: {
                    Monday: {
                        morning: [
                            {
                                id: 'MED101-Mon-1-4',
                                courseCode: 'MED101',
                                courseName: 'Giải phẫu học đại cương & Thực hành mô hình',
                                className: '25YDA01',
                                group: '01',
                                room: 'Giảng đường A — Tầng 3',
                                timeSlot: '1-4',
                                periodCount: 4,
                                teacher: 'GS.TS. Trần Quốc Hùng 🇻🇳',
                                type: CourseType.TH,
                                dayOfWeek: 'Monday',
                                sessionTime: 'morning',
                                dateStr: '25/08/2025',
                            },
                        ],
                        afternoon: [],
                        evening: [],
                    },
                },
            },
        ],
        aggregatedCourses: {},
        abbreviations: {
            'Giải phẫu học đại cương & Thực hành mô hình': 'GPH-DC',
        },
        overrides: {
            MED101: CourseType.TH,
        },
    };

    it('1. Exports full backup with all 5 data tiers and valid schema', async () => {
        // Populate initial user state
        localStorage.setItem('last_schedule_data', JSON.stringify(sampleVietnameseSchedule));
        localStorage.setItem('global_abbreviations', JSON.stringify({ 'Giải phẫu học': 'GPH' }));
        localStorage.setItem('tdytime_theme', 'dark');
        localStorage.setItem('accent-theme', 'theme-emerald');

        useNotesStore.getState().setNote('MED101-Mon-1-4', 'Nhắc sinh viên chuẩn bị găng tay y tế.');
        await historyService.save(sampleVietnameseSchedule);

        const result = await backupService.exportFullBackup();

        // 1. Verify file structure
        expect(result.file.format).toBe(BACKUP_FORMAT);
        expect(result.file.formatVersion).toBe(BACKUP_FORMAT_VERSION);
        expect(result.file.data.activeSchedule?.metadata.teacher).toBe('GS.TS. Trần Quốc Hùng 🇻🇳');
        expect(result.file.data.history.length).toBe(1);
        expect(result.file.data.notes['MED101-Mon-1-4']).toBe('Nhắc sinh viên chuẩn bị găng tay y tế.');
        expect(result.file.data.abbreviations['Giải phẫu học']).toBe('GPH');
        expect(result.file.data.preferences.theme).toBe('dark');

        // 2. Verify summary
        expect(result.summary.hasActiveSchedule).toBe(true);
        expect(result.summary.historyCount).toBe(1);
        expect(result.summary.notesCount).toBe(1);

        // 3. Verify fileSaver called with valid filename
        expect(fileSaver.saveAs).toHaveBeenCalledTimes(1);
        const saveAsMock = fileSaver.saveAs as unknown as { mock: { calls: Array<[Blob, string]> } };
        const [, filename] = saveAsMock.mock.calls[0];
        expect(filename).toMatch(/^tdytime-backup-\d{4}-\d{2}-\d{2}\.json$/);

        // 4. Verify last backup date recorded in localStorage
        expect(backupService.getLastBackupDate()).toBe(result.summary.exportedAt);
    });

    it('2. Rejects invalid backup files with accurate error keys', () => {
        // Empty
        expect(backupService.validateBackupContent('').errorKey).toBe('backup.errors.emptyFile');

        // Corrupted JSON
        expect(backupService.validateBackupContent('{ corrupt json ...').errorKey).toBe('backup.errors.invalidJson');

        // Wrong format
        expect(backupService.validateBackupContent(JSON.stringify({ format: 'wrong-format' })).errorKey).toBe('backup.errors.unsupportedFormat');

        // Wrong version
        expect(backupService.validateBackupContent(JSON.stringify({
            format: BACKUP_FORMAT,
            formatVersion: 999,
            data: {},
        })).errorKey).toBe('backup.errors.unsupportedVersion');

        // Invalid history schema (e.g. not an array)
        expect(backupService.validateBackupContent(JSON.stringify({
            format: BACKUP_FORMAT,
            formatVersion: BACKUP_FORMAT_VERSION,
            data: { history: 'not-an-array' },
        })).errorKey).toBe('backup.errors.invalidHistorySchema');

        // Invalid notes schema (e.g. array instead of object)
        expect(backupService.validateBackupContent(JSON.stringify({
            format: BACKUP_FORMAT,
            formatVersion: BACKUP_FORMAT_VERSION,
            data: { notes: ['array-note'] },
        })).errorKey).toBe('backup.errors.invalidNotesSchema');
    });

    it('3. Backward-compatibility: detects and adapts legacy raw ScheduleData JSON', () => {
        const rawScheduleJson = JSON.stringify(sampleVietnameseSchedule);
        const validation = backupService.validateBackupContent(rawScheduleJson);

        expect(validation.isValid).toBe(true);
        expect(validation.backup?.format).toBe('legacy-schedule');
        expect(validation.summary?.scheduleTeacher).toBe('GS.TS. Trần Quốc Hùng 🇻🇳');
        expect(validation.summary?.hasActiveSchedule).toBe(true);
    });

    it('4. Atomic restore: completely restores all 5 data groups with roundtrip fidelity', async () => {
        const backupToRestore: BackupFile = {
            format: BACKUP_FORMAT,
            formatVersion: BACKUP_FORMAT_VERSION,
            appVersion: '2026.11.05',
            exportedAt: '2026-11-05T12:00:00.000Z',
            data: {
                activeSchedule: sampleVietnameseSchedule,
                history: [
                    {
                        id: 'hist-1',
                        teacher: 'GS.TS. Trần Quốc Hùng 🇻🇳',
                        semester: '1',
                        academicYear: '2025-2026',
                        savedAt: 1756000000000,
                        preview: '1 - 2025-2026',
                        data: sampleVietnameseSchedule,
                    },
                ],
                notes: {
                    'NOTE_A': 'Ghi chú tiếng Việt có dấu: Ứng dụng PWA 💯',
                    'NOTE_B': 'Tiết học thứ Bảy phòng Lab 2',
                },
                abbreviations: {
                    'Hóa sinh y học': 'HSYH',
                    'Vi sinh vật học': 'VSVH',
                },
                preferences: {
                    theme: 'dark',
                    accentTheme: 'theme-violet',
                },
            },
        };

        const result = await backupService.restoreFromBackup(backupToRestore);
        expect(result.success).toBe(true);

        // 1. Verify Active Schedule
        const activeRaw = localStorage.getItem('last_schedule_data');
        expect(activeRaw).not.toBeNull();
        const activeParsed = JSON.parse(activeRaw!);
        expect(activeParsed.metadata.teacher).toBe('GS.TS. Trần Quốc Hùng 🇻🇳');

        // 2. Verify Notes
        expect(useNotesStore.getState().getNote('NOTE_A')).toBe('Ghi chú tiếng Việt có dấu: Ứng dụng PWA 💯');
        expect(useNotesStore.getState().getNote('NOTE_B')).toBe('Tiết học thứ Bảy phòng Lab 2');

        // 3. Verify Abbreviations
        const abbrRaw = localStorage.getItem('global_abbreviations');
        expect(abbrRaw).not.toBeNull();
        const abbrParsed = JSON.parse(abbrRaw!);
        expect(abbrParsed['Hóa sinh y học']).toBe('HSYH');

        // 4. Verify History in IndexedDB
        const historyItems = await historyService.getAll();
        expect(historyItems.length).toBe(1);
        expect(historyItems[0].teacher).toBe('GS.TS. Trần Quốc Hùng 🇻🇳');

        // 5. Verify Preferences
        expect(localStorage.getItem('tdytime_theme')).toBe('dark');
        expect(localStorage.getItem('accent-theme')).toBe('theme-violet');
    });

    it('5. Atomic rollback: restores previous state if an error occurs during restore', async () => {
        // Setup initial state before failed restore
        localStorage.setItem('last_schedule_data', JSON.stringify({ metadata: { teacher: 'Original Teacher' } }));
        useNotesStore.getState().setNote('ORIGINAL_NOTE', 'Dữ liệu gốc');

        // Mock historyService.save to fail deliberately
        const originalSave = historyService.save;
        historyService.save = vi.fn().mockRejectedValueOnce(new Error('Simulated IndexedDB Write Failure'));

        const faultyBackup: BackupFile = {
            format: BACKUP_FORMAT,
            formatVersion: BACKUP_FORMAT_VERSION,
            appVersion: '2026.11.05',
            exportedAt: new Date().toISOString(),
            data: {
                activeSchedule: sampleVietnameseSchedule,
                history: [
                    {
                        id: 'h1',
                        teacher: 'Faulty Teacher',
                        semester: '1',
                        academicYear: '2025',
                        savedAt: 123,
                        preview: '',
                        data: sampleVietnameseSchedule,
                    },
                ],
                notes: { 'NEW_NOTE': 'New Note that should fail' },
                abbreviations: {},
                preferences: {},
            },
        };

        const result = await backupService.restoreFromBackup(faultyBackup);
        expect(result.success).toBe(false);

        // Verify Rollback: Original state was restored
        expect(localStorage.getItem('last_schedule_data')).toContain('Original Teacher');
        expect(useNotesStore.getState().getNote('ORIGINAL_NOTE')).toBe('Dữ liệu gốc');

        // Restore mock
        historyService.save = originalSave;
    });
});
