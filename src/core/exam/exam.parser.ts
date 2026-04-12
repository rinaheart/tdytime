import { ExamSession, ExamStatus } from './exam.types';

/** 
 * getExamStatus — Determine status based on current time 
 * No polling, calculated on render.
 */
export const getExamStatus = (startTime: number, endTime: number): ExamStatus => {
    const now = Date.now();
    if (now < startTime) return 'upcoming';
    if (now > endTime) return 'past';
    return 'ongoing';
};

/**
 * Sanitize Room Name
 * Removes leading dots (e.g., .K.301 -> K.301)
 */
const sanitizeRoom = (room: string): string => {
    return room.trim().replace(/^\.+/, '');
};

/**
 * Normalize Time String
 * Converts "13g30" to "13:30"
 */
const normalizeTime = (time: string): string => {
    return time.trim().replace(/[gGhH]/, ':');
};

/**
 * Parse date and time to Unix timestamp
 * @param dateStr DD/MM/YYYY
 * @param timeStr HH:mm
 */
const toTimestamp = (dateStr: string, timeStr: string): number => {
    const [d, m, y] = dateStr.split('/').map(Number);
    const [hh, mm] = normalizeTime(timeStr).split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm).getTime();
};

/**
 * parseExamText — Parser for TSV (tab-separated) exam data
 * Detects headers and returns list of sessions.
 */
export const parseExamText = (text: string): ExamSession[] => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase();
    // Required columns check
    if (!header.includes('mã học phần') || !header.includes('hình thức thi')) return [];

    const sessions: ExamSession[] = [];
    const rows = lines.slice(1);

    rows.forEach(row => {
        const cols = row.split('\t').map(c => c.trim());
        if (cols.length < 8) return;

        // Pattern mapping based on:
        // STT(0) MãHP(1) TênHP(2) Phòng(3) HìnhThức(4) Ngày(5) Giờ(6) ThờiGian(7) VaiTrò(8)
        const courseCode = cols[1];
        const courseName = cols[2];
        const room = sanitizeRoom(cols[3]);
        const format = cols[4];
        const dateStr = cols[5];
        const timeStr = normalizeTime(cols[6]);
        const duration = parseInt(cols[7]) || 0;
        const role = cols[8] || '';

        if (!courseCode || !dateStr || !timeStr) return;

        const startTime = toTimestamp(dateStr, timeStr);
        const endTime = startTime + duration * 60000;

        sessions.push({
            id: `${courseCode}_${dateStr.replace(/\//g, '')}`,
            courseCode,
            courseName,
            room,
            format,
            dateStr,
            timeStr,
            duration,
            role,
            startTime,
            endTime
        });
    });

    // Sort by time ascending
    return sessions.sort((a, b) => a.startTime - b.startTime);
};
