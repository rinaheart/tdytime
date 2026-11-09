/**
 * Exam Schedule Parser — TdyTime v2
 * Parses TSV exam schedule text and computes live status.
 */

import type { ExamSession } from './exam.types';

// Module-scope precompiled Regular Expressions
const LEADING_DOTS_REGEX = /^\.+/;
const TIME_H_REGEX = /[gGhH]/;
const LINE_SPLIT_REGEX = /\r?\n/;
const SLASH_GLOBAL_REGEX = /\//g;

/**
 * getExamStatus — Determine status based on current time
 * No polling, calculated on render.
 */
export const getExamStatus = (
    startTime: number,
    endTime: number,
    now: number = Date.now(),
): 'upcoming' | 'ongoing' | 'past' => {
    if (now < startTime) return 'upcoming';
    if (now > endTime) return 'past';
    return 'ongoing';
};

/**
 * Sanitize Room Name
 * Removes leading dots (e.g., .K.301 -> K.301)
 */
export const sanitizeRoom = (room: string): string => {
    return room.trim().replace(LEADING_DOTS_REGEX, '');
};

/**
 * Normalize Time String
 * Converts "13g30" to "13:30"
 */
export const normalizeTime = (time: string): string => {
    return time.trim().replace(TIME_H_REGEX, ':');
};

/**
 * Parse date and time to Unix timestamp
 * @param dateStr DD/MM/YYYY
 * @param timeStr HH:mm
 */
export const toTimestamp = (dateStr: string, timeStr: string): number => {
    const [d, m, y] = dateStr.split('/').map(Number);
    const [hh, mm] = normalizeTime(timeStr).split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm).getTime();
};

/**
 * parseExamText — Parser for TSV (tab-separated) exam data
 * Detects headers and returns list of sessions.
 */
export const parseExamText = (text: string): ExamSession[] => {
    const lines = text.trim().split(LINE_SPLIT_REGEX);
    if (lines.length < 2) return [];
    const header = lines[0].toLowerCase();
    if (!header.includes('mã học phần') || !header.includes('hình thức thi')) return [];

    const sessions: ExamSession[] = [];
    lines.slice(1).forEach((row) => {
        const cols = row.split('\t').map((c) => c.trim());
        if (cols.length < 8) return;
        const courseCode = cols[1];
        const courseName = cols[2];
        const room = sanitizeRoom(cols[3]);
        const format = cols[4];
        const dateStr = cols[5];
        const timeStr = normalizeTime(cols[6]);
        const duration = parseInt(cols[7], 10) || 0;
        const role = cols[8] || '';

        if (!courseCode || !dateStr || !timeStr) return;

        const startTime = toTimestamp(dateStr, timeStr);
        const endTime = startTime + duration * 60000;

        sessions.push({
            id: `${courseCode}_${dateStr.replace(SLASH_GLOBAL_REGEX, '')}`,
            courseCode,
            courseName,
            room,
            format,
            dateStr,
            timeStr,
            duration,
            role,
            startTime,
            endTime,
        });
    });

    return sessions.sort((a, b) => a.startTime - b.startTime);
};
