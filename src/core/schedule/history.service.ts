/**
 * History Service — TdyTime v2
 * Manages upload history in localStorage with deduplication.
 */

import { ScheduleData } from './schedule.types';
import { get, set, remove } from '../utils/idb';

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
    /** Initialize and migrate history from localStorage if present */
    init: async (): Promise<void> => {
        try {
            const oldData = localStorage.getItem(STORAGE_KEY);
            if (oldData) {
                const history: HistoryItem[] = JSON.parse(oldData);
                await set(STORAGE_KEY, history);
                localStorage.removeItem(STORAGE_KEY);
                console.log('Migrated history to IndexedDB');
            }
        } catch (e) {
            console.error('Migration failed', e);
        }
    },

    /** Save schedule to history (deduplicates by teacher + semester + year) */
    save: async (data: ScheduleData): Promise<void> => {
        try {
            let history: HistoryItem[] = (await get<HistoryItem[]>(STORAGE_KEY)) || [];

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

            await set(STORAGE_KEY, history);
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    },

    /** Get all history items */
    getAll: async (): Promise<HistoryItem[]> => {
        try {
            const history = await get<HistoryItem[]>(STORAGE_KEY);
            return history || [];
        } catch {
            return [];
        }
    },

    /** Remove a specific item by ID */
    removeItem: async (id: string): Promise<void> => {
        try {
            let history: HistoryItem[] = (await get<HistoryItem[]>(STORAGE_KEY)) || [];
            history = history.filter((item) => item.id !== id);
            await set(STORAGE_KEY, history);
        } catch (error) {
            console.error('Failed to remove history item:', error);
        }
    },

    /** Clear all history */
    clear: async (): Promise<void> => {
        try {
            await remove(STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    },
};
