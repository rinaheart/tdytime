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
import { historyService } from '@/core/schedule/history.service';
import { CourseType, type ScheduleData } from '@/core/schedule/schedule.types';

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
        useScheduleStore.setState({
            data: null,
            sessionsIndex: [],
            abbreviations: {},
            historyList: [],
            isInitialized: false,
        });
        vi.restoreAllMocks();
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

    it('1. Exports full backup with all data tiers and valid schema', async () => {
        const downloadSpy = vi.spyOn(backupService, 'triggerDownload').mockImplementation(() => {});

        localStorage.setItem('last_schedule_data', JSON.stringify(sampleVietnameseSchedule));
        localStorage.setItem('global_abbreviations', JSON.stringify({ 'Giải phẫu học': 'GPH' }));
        localStorage.setItem('tdytime_theme', 'dark');
        localStorage.setItem('accent-theme', 'theme-emerald');
        localStorage.setItem(
            'tdy_session_notes',
            JSON.stringify({
                state: { notes: { 'MED101-Mon-1-4': 'Nhắc sinh viên chuẩn bị găng tay y tế.' } },
                version: 0,
            }),
        );

        await historyService.save(sampleVietnameseSchedule);

        const result = await backupService.exportFullBackup();

        expect(result.file.format).toBe(BACKUP_FORMAT);
        expect(result.file.formatVersion).toBe(BACKUP_FORMAT_VERSION);
        expect(result.file.data.activeSchedule?.metadata.teacher).toBe('GS.TS. Trần Quốc Hùng 🇻🇳');
        expect(result.file.data.history.length).toBe(1);
        expect(result.file.data.notes?.['MED101-Mon-1-4']).toBe('Nhắc sinh viên chuẩn bị găng tay y tế.');
        expect(result.file.data.abbreviations['Giải phẫu học']).toBe('GPH');
        expect(result.file.data.preferences.theme).toBe('dark');

        expect(result.summary.hasActiveSchedule).toBe(true);
        expect(result.summary.historyCount).toBe(1);
        expect(result.summary.notesCount).toBe(1);

        expect(downloadSpy).toHaveBeenCalledTimes(1);
        const [, filename] = downloadSpy.mock.calls[0];
        expect(filename).toMatch(/^tdytime-backup-\d{4}-\d{2}-\d{2}\.json$/);

        expect(backupService.getLastBackupDate()).toBe(result.summary.exportedAt);
    });

    it('2. Rejects invalid backup files with accurate error keys', () => {
        expect(backupService.validateBackupContent('').errorKey).toBe('backup.errors.emptyFile');
        expect(backupService.validateBackupContent('{ corrupt json ...').errorKey).toBe('backup.errors.invalidJson');
        expect(backupService.validateBackupContent(JSON.stringify({ format: 'wrong-format' })).errorKey).toBe('backup.errors.unsupportedFormat');
        expect(backupService.validateBackupContent(JSON.stringify({
            format: BACKUP_FORMAT,
            formatVersion: 999,
            data: {},
        })).errorKey).toBe('backup.errors.unsupportedVersion');
        expect(backupService.validateBackupContent(JSON.stringify({
            format: BACKUP_FORMAT,
            formatVersion: BACKUP_FORMAT_VERSION,
            data: { history: 'not-an-array' },
        })).errorKey).toBe('backup.errors.invalidHistorySchema');
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

    it('4. Atomic restore: completely restores all data groups with roundtrip fidelity', async () => {
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

        const activeRaw = localStorage.getItem('last_schedule_data');
        expect(activeRaw).not.toBeNull();
        const activeParsed = JSON.parse(activeRaw!);
        expect(activeParsed.metadata.teacher).toBe('GS.TS. Trần Quốc Hùng 🇻🇳');

        const notesRaw = JSON.parse(localStorage.getItem('tdy_session_notes') || '{}');
        expect(notesRaw.state.notes['NOTE_A']).toBe('Ghi chú tiếng Việt có dấu: Ứng dụng PWA 💯');
        expect(notesRaw.state.notes['NOTE_B']).toBe('Tiết học thứ Bảy phòng Lab 2');

        const abbrRaw = localStorage.getItem('global_abbreviations');
        expect(abbrRaw).not.toBeNull();
        const abbrParsed = JSON.parse(abbrRaw!);
        expect(abbrParsed['Hóa sinh y học']).toBe('HSYH');

        const historyItems = await historyService.getAll();
        expect(historyItems.length).toBe(1);
        expect(historyItems[0].teacher).toBe('GS.TS. Trần Quốc Hùng 🇻🇳');

        expect(localStorage.getItem('tdytime_theme')).toBe('dark');
        expect(localStorage.getItem('accent-theme')).toBe('theme-violet');
    });

    it('5. Atomic rollback: restores previous state if an error occurs during restore', async () => {
        localStorage.setItem('last_schedule_data', JSON.stringify({ metadata: { teacher: 'Original Teacher' } }));
        localStorage.setItem(
            'tdy_session_notes',
            JSON.stringify({ state: { notes: { ORIGINAL_NOTE: 'Dữ liệu gốc' } }, version: 0 }),
        );

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

        expect(localStorage.getItem('last_schedule_data')).toContain('Original Teacher');
        const rolledBackNotes = JSON.parse(localStorage.getItem('tdy_session_notes') || '{}');
        expect(rolledBackNotes.state.notes.ORIGINAL_NOTE).toBe('Dữ liệu gốc');

        historyService.save = originalSave;
    });
});
