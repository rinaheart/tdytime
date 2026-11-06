/**
 * Backup Service — TdyTime
 * Handles Full User Data Backup & Atomic Restore.
 * 
 * Backs up:
 * - Active timetable: localStorage['last_schedule_data']
 * - Timetable history: IndexedDB TdyTimeDB (timetable_history_v1)
 * - Session notes: localStorage['tdy_session_notes']
 * - Custom abbreviations: localStorage['global_abbreviations']
 * - User preferences: theme, accent color, font size
 */

import { APP_VERSION } from '@/core/constants';
import { historyService, type HistoryItem } from '@/core/schedule/history.service';
import { useNotesStore } from '@/core/stores/notes.store';
import { useScheduleStore } from '@/core/stores/schedule.store';
import type { ScheduleData } from '@/core/schedule/schedule.types';
import { saveAs } from 'file-saver';

export const BACKUP_FORMAT = 'tdytime-backup';
export const BACKUP_FORMAT_VERSION = 1;
export const LAST_BACKUP_STORAGE_KEY = 'tdytime_last_backup_date';

export interface BackupPreferences {
    theme?: string | null;
    accentTheme?: string | null;
    fontSize?: string | null;
}

export interface BackupDataPayload {
    activeSchedule: ScheduleData | null;
    history: HistoryItem[];
    notes: Record<string, string>;
    abbreviations: Record<string, string>;
    preferences: BackupPreferences;
}

export interface BackupFile {
    format: typeof BACKUP_FORMAT | 'legacy-schedule';
    formatVersion: number;
    appVersion: string;
    exportedAt: string;
    data: BackupDataPayload;
}

export interface BackupSummary {
    hasActiveSchedule: boolean;
    scheduleTeacher?: string;
    scheduleSemester?: string;
    scheduleYear?: string;
    historyCount: number;
    notesCount: number;
    abbreviationsCount: number;
    exportedAt: string;
}

export interface ValidationResult {
    isValid: boolean;
    errorKey?: string;
    errorMessage?: string;
    summary?: BackupSummary;
    backup?: BackupFile;
}

export class BackupService {
    /** Generate default backup filename with current date: tdytime-backup-YYYY-MM-DD.json */
    public generateFilename(): string {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `tdytime-backup-${yyyy}-${mm}-${dd}.json`;
    }

    /** Retrieve the timestamp of the last export */
    public getLastBackupDate(): string | null {
        if (typeof window === 'undefined' || !window.localStorage) return null;
        return window.localStorage.getItem(LAST_BACKUP_STORAGE_KEY);
    }

    /** Generate and download full user data backup */
    public async exportFullBackup(): Promise<{ file: BackupFile; filename: string; summary: BackupSummary }> {
        // 1. Collect Active Schedule
        let activeSchedule: ScheduleData | null = null;
        try {
            const rawSchedule = localStorage.getItem('last_schedule_data');
            if (rawSchedule) {
                activeSchedule = JSON.parse(rawSchedule) as ScheduleData;
            }
        } catch (e) {
            console.warn('Failed to parse active schedule from localStorage:', e);
        }

        // 2. Collect History from IndexedDB
        let history: HistoryItem[] = [];
        try {
            history = await historyService.getAll();
        } catch (e) {
            console.error('Failed to read history from IndexedDB:', e);
            throw new Error('backup.errors.historyReadFailed');
        }

        // 3. Collect Notes
        let notes: Record<string, string> = {};
        try {
            notes = useNotesStore.getState().notes || {};
        } catch (e) {
            console.warn('Failed to read notes from store:', e);
        }

        // 4. Collect Global Abbreviations
        let abbreviations: Record<string, string> = {};
        try {
            const rawAbbr = localStorage.getItem('global_abbreviations');
            if (rawAbbr) abbreviations = JSON.parse(rawAbbr);
        } catch (e) {
            console.warn('Failed to parse abbreviations from localStorage:', e);
        }

        // 5. Collect Preferences
        const preferences: BackupPreferences = {
            theme: localStorage.getItem('tdytime_theme') || localStorage.getItem('theme'),
            accentTheme: localStorage.getItem('accent-theme') || localStorage.getItem('color-theme'),
            fontSize: localStorage.getItem('tdytime_font_size'),
        };

        const exportedAt = new Date().toISOString();

        const backupFile: BackupFile = {
            format: BACKUP_FORMAT,
            formatVersion: BACKUP_FORMAT_VERSION,
            appVersion: APP_VERSION,
            exportedAt,
            data: {
                activeSchedule,
                history,
                notes,
                abbreviations,
                preferences,
            },
        };

        const summary: BackupSummary = {
            hasActiveSchedule: !!activeSchedule,
            scheduleTeacher: activeSchedule?.metadata?.teacher,
            scheduleSemester: activeSchedule?.metadata?.semester,
            scheduleYear: activeSchedule?.metadata?.academicYear,
            historyCount: history.length,
            notesCount: Object.keys(notes).length,
            abbreviationsCount: Object.keys(abbreviations).length,
            exportedAt,
        };

        // Record last backup date in localStorage
        try {
            localStorage.setItem(LAST_BACKUP_STORAGE_KEY, exportedAt);
        } catch {
            // Ignore storage failure
        }

        // Trigger browser download
        const filename = this.generateFilename();
        const jsonBlob = new Blob([JSON.stringify(backupFile, null, 2)], {
            type: 'application/json;charset=utf-8;',
        });
        saveAs(jsonBlob, filename);

        return { file: backupFile, filename, summary };
    }

    /** Validate uploaded backup file content and structure */
    public validateBackupContent(content: string): ValidationResult {
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return { isValid: false, errorKey: 'backup.errors.emptyFile', errorMessage: 'File sao lưu trống' };
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(content);
        } catch {
            return { isValid: false, errorKey: 'backup.errors.invalidJson', errorMessage: 'Định dạng JSON không hợp lệ' };
        }

        if (!parsed || typeof parsed !== 'object') {
            return { isValid: false, errorKey: 'backup.errors.invalidStructure', errorMessage: 'Cấu trúc dữ liệu không hợp lệ' };
        }

        // Backward-compatibility: Check if user uploaded a raw ScheduleData JSON file
        const candidate = parsed as Record<string, unknown>;
        if (candidate.weeks && candidate.metadata && Array.isArray(candidate.weeks)) {
            const rawSchedule = candidate as unknown as ScheduleData;
            const syntheticBackup: BackupFile = {
                format: 'legacy-schedule',
                formatVersion: 1,
                appVersion: 'legacy',
                exportedAt: new Date().toISOString(),
                data: {
                    activeSchedule: rawSchedule,
                    history: [],
                    notes: {},
                    abbreviations: rawSchedule.abbreviations || {},
                    preferences: {},
                },
            };

            return {
                isValid: true,
                backup: syntheticBackup,
                summary: {
                    hasActiveSchedule: true,
                    scheduleTeacher: rawSchedule.metadata?.teacher,
                    scheduleSemester: rawSchedule.metadata?.semester,
                    scheduleYear: rawSchedule.metadata?.academicYear,
                    historyCount: 0,
                    notesCount: 0,
                    abbreviationsCount: Object.keys(rawSchedule.abbreviations || {}).length,
                    exportedAt: syntheticBackup.exportedAt,
                },
            };
        }

        // Validate Standard TdyTime Backup
        if (candidate.format !== BACKUP_FORMAT) {
            return {
                isValid: false,
                errorKey: 'backup.errors.unsupportedFormat',
                errorMessage: `Định dạng tệp không được hỗ trợ (cần '${BACKUP_FORMAT}')`,
            };
        }

        const formatVersion = Number(candidate.formatVersion);
        if (Number.isNaN(formatVersion) || formatVersion > BACKUP_FORMAT_VERSION || formatVersion < 1) {
            return {
                isValid: false,
                errorKey: 'backup.errors.unsupportedVersion',
                errorMessage: `Phiên bản định dạng sao lưu (${candidate.formatVersion}) không được hỗ trợ`,
            };
        }

        if (!candidate.data || typeof candidate.data !== 'object') {
            return { isValid: false, errorKey: 'backup.errors.missingDataPayload', errorMessage: 'Thiếu trường data payload' };
        }

        const dataPayload = candidate.data as Record<string, unknown>;

        // Schema validation for sub-fields
        if (dataPayload.history && !Array.isArray(dataPayload.history)) {
            return { isValid: false, errorKey: 'backup.errors.invalidHistorySchema', errorMessage: 'Dữ liệu lịch sử không phải dạng mảng' };
        }

        if (dataPayload.notes && (typeof dataPayload.notes !== 'object' || Array.isArray(dataPayload.notes))) {
            return { isValid: false, errorKey: 'backup.errors.invalidNotesSchema', errorMessage: 'Dữ liệu ghi chú không hợp lệ' };
        }

        if (dataPayload.abbreviations && (typeof dataPayload.abbreviations !== 'object' || Array.isArray(dataPayload.abbreviations))) {
            return { isValid: false, errorKey: 'backup.errors.invalidAbbreviationsSchema', errorMessage: 'Dữ liệu viết tắt không hợp lệ' };
        }

        const backup = parsed as BackupFile;
        const activeSchedule = backup.data.activeSchedule;

        const summary: BackupSummary = {
            hasActiveSchedule: !!activeSchedule,
            scheduleTeacher: activeSchedule?.metadata?.teacher,
            scheduleSemester: activeSchedule?.metadata?.semester,
            scheduleYear: activeSchedule?.metadata?.academicYear,
            historyCount: Array.isArray(backup.data.history) ? backup.data.history.length : 0,
            notesCount: backup.data.notes ? Object.keys(backup.data.notes).length : 0,
            abbreviationsCount: backup.data.abbreviations ? Object.keys(backup.data.abbreviations).length : 0,
            exportedAt: backup.exportedAt || new Date().toISOString(),
        };

        return {
            isValid: true,
            backup,
            summary,
        };
    }

    /** Restore all user data atomically with automatic rollback on error */
    public async restoreFromBackup(
        backup: BackupFile,
    ): Promise<{ success: boolean; summary: BackupSummary; error?: string }> {
        // Step 1: Create a safety rollback snapshot of current state
        const rollbackSnapshot = {
            activeScheduleRaw: localStorage.getItem('last_schedule_data'),
            notesRaw: localStorage.getItem('tdy_session_notes'),
            abbrRaw: localStorage.getItem('global_abbreviations'),
            historyItems: await historyService.getAll(),
        };

        try {
            // 1. Restore Abbreviations
            const abbreviations = backup.data.abbreviations || {};
            localStorage.setItem('global_abbreviations', JSON.stringify(abbreviations));

            // 2. Restore Notes
            const notes = backup.data.notes || {};
            useNotesStore.setState({ notes });
            localStorage.setItem(
                'tdy_session_notes',
                JSON.stringify({
                    state: { notes },
                    version: 0,
                }),
            );

            // 3. Restore History in IndexedDB
            await historyService.clear();
            if (Array.isArray(backup.data.history)) {
                // Restore in reverse order so unshift preserves chronological ordering
                const reversedHistory = [...backup.data.history].reverse();
                for (const item of reversedHistory) {
                    if (item && item.data) {
                        await historyService.save(item.data);
                    }
                }
            }

            // 4. Restore Active Schedule & Reload in ScheduleStore
            const activeSchedule = backup.data.activeSchedule;
            if (activeSchedule) {
                localStorage.setItem('last_schedule_data', JSON.stringify(activeSchedule));
                await useScheduleStore.getState().initFromStorage();
            } else {
                localStorage.removeItem('last_schedule_data');
                useScheduleStore.setState({
                    data: null,
                    metrics: null,
                    sessionsIndex: [],
                    semesterBounds: null,
                    maxWeekIdx: -1,
                    historyList: await historyService.getAll(),
                });
            }

            // 5. Restore Preferences if available
            if (backup.data.preferences) {
                if (backup.data.preferences.theme) {
                    localStorage.setItem('tdytime_theme', backup.data.preferences.theme);
                }
                if (backup.data.preferences.accentTheme) {
                    localStorage.setItem('accent-theme', backup.data.preferences.accentTheme);
                }
            }

            const summary: BackupSummary = {
                hasActiveSchedule: !!activeSchedule,
                scheduleTeacher: activeSchedule?.metadata?.teacher,
                scheduleSemester: activeSchedule?.metadata?.semester,
                scheduleYear: activeSchedule?.metadata?.academicYear,
                historyCount: backup.data.history ? backup.data.history.length : 0,
                notesCount: Object.keys(notes).length,
                abbreviationsCount: Object.keys(abbreviations).length,
                exportedAt: backup.exportedAt,
            };

            return { success: true, summary };
        } catch (err: unknown) {
            console.error('Failed to restore backup, performing atomic rollback:', err);

            // Rollback everything
            try {
                if (rollbackSnapshot.activeScheduleRaw) {
                    localStorage.setItem('last_schedule_data', rollbackSnapshot.activeScheduleRaw);
                } else {
                    localStorage.removeItem('last_schedule_data');
                }

                if (rollbackSnapshot.notesRaw) {
                    localStorage.setItem('tdy_session_notes', rollbackSnapshot.notesRaw);
                    const parsedNotes = JSON.parse(rollbackSnapshot.notesRaw);
                    useNotesStore.setState({ notes: parsedNotes?.state?.notes || {} });
                }

                if (rollbackSnapshot.abbrRaw) {
                    localStorage.setItem('global_abbreviations', rollbackSnapshot.abbrRaw);
                }

                await historyService.clear();
                for (const item of rollbackSnapshot.historyItems.reverse()) {
                    await historyService.save(item.data);
                }

                await useScheduleStore.getState().initFromStorage();
            } catch (rollbackErr) {
                console.error('Fatal: Rollback failed:', rollbackErr);
            }

            const msg = err instanceof Error ? err.message : 'Unknown restore error';
            return {
                success: false,
                summary: {
                    hasActiveSchedule: false,
                    historyCount: 0,
                    notesCount: 0,
                    abbreviationsCount: 0,
                    exportedAt: '',
                },
                error: msg,
            };
        }
    }
}

export const backupService = new BackupService();
