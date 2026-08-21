/**
 * History Service — TdyTime v2
 * Manages upload history in localStorage with deduplication.
 */

import { ScheduleData } from './schedule.types';

const STORAGE_KEY = 'timetable_history_v1';
const MAX_ITEMS = 10;

export interface HistoryMetadata {
    id: string;
    teacher: string;
    semester: string;
    academicYear: string;
    savedAt: number;
    preview: string;
}

export interface HistoryItem extends HistoryMetadata {
    data: ScheduleData;
}

export const historyService = {
    /** Save schedule to history (deduplicates by teacher + semester + year) */
    save: (data: ScheduleData): void => {
        try {
            const existingJson = localStorage.getItem(STORAGE_KEY);
            let history: HistoryItem[] = existingJson ? JSON.parse(existingJson) : [];

            const newItem: HistoryItem = {
                id: crypto.randomUUID(),
                teacher: data.metadata.teacher,
                semester: data.metadata.semester,
                academicYear: data.metadata.academicYear,
                savedAt: Date.now(),
                preview: `${data.metadata.semester} - ${data.metadata.academicYear}`,
                data,
            };

            // Remove duplicate if exists
            const duplicateIndex = history.findIndex(
                (item) =>
                    item.teacher === newItem.teacher &&
                    item.semester === newItem.semester &&
                    item.academicYear === newItem.academicYear,
            );
            if (duplicateIndex !== -1) history.splice(duplicateIndex, 1);

            history.unshift(newItem);
            if (history.length > MAX_ITEMS) history = history.slice(0, MAX_ITEMS);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    },

    /** Get all history items */
    getAll: (): HistoryItem[] => {
        try {
            const json = localStorage.getItem(STORAGE_KEY);
            return json ? JSON.parse(json) : [];
        } catch {
            return [];
        }
    },

    /** Delete a history item by ID, returns updated list */
    delete: (id: string): HistoryItem[] => {
        try {
            const json = localStorage.getItem(STORAGE_KEY);
            if (!json) return [];

            let history: HistoryItem[] = JSON.parse(json);
            history = history.filter((item) => item.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            return history;
        } catch {
            return [];
        }
    },

    /** Clear all history */
    clear: (): void => {
        localStorage.removeItem(STORAGE_KEY);
    },
};
