/**
 * export-csv.ts — Utility for exporting schedule data to CSV
 * Supports UTF-8 with BOM for Excel compatibility.
 */

import i18next from 'i18next';
import type { FlatSession } from '../core/schedule';
import { saveAs } from 'file-saver';

/**
 * Maps FlatSession data to CSV and triggers browser download.
 */
export const exportToCSV = (sessions: FlatSession[], filename: string = 'tdytime-export.csv') => {
    if (!sessions || sessions.length === 0) return;

    // Define CSV Headers from i18n (Sync with semester.csv.headers)
    const headers = [
        i18next.t('semester.csv.headers.date'),
        i18next.t('semester.csv.headers.subjectCode'),
        i18next.t('semester.csv.headers.subjectName'),
        i18next.t('semester.csv.headers.class'),
        i18next.t('semester.csv.headers.group'),
        i18next.t('semester.csv.headers.type'),
        i18next.t('semester.csv.headers.shift'),
        i18next.t('semester.csv.headers.periods'),
        i18next.t('semester.csv.headers.room'),
        i18next.t('semester.csv.headers.instructor')
    ];

    // Map sessions to rows
    const rows = sessions.map(s => [
        s.dateStr,
        s.courseCode,
        s.courseName,
        s.className,
        s.group,
        s.type || 'LT', // Default to LT if missing
        s.shift || '', // Sáng/Chiều/Tối
        s.timeSlot,
        s.room,
        s.teacher
    ]);

    // Construct CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Add UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Trigger download
    saveAs(blob, filename);
};
