/**
 * Exam Types — TdyTime v2
 * Domain types for exam supervision data.
 */

export type ExamStatus = 'upcoming' | 'ongoing' | 'past';

export interface ExamSession {
    /** Unique ID: `${courseCode}_${dateStr}` */
    id: string;
    courseCode: string;
    courseName: string;
    room: string;
    format: string; // Trắc nghiệm / Tự luận...
    dateStr: string; // DD/MM/YYYY
    timeStr: string; // HH:mm
    duration: number; // minutes
    role: string; // Cán bộ 1...
    startTime: number; // Unix timestamp for sorting
    endTime: number; // Unix timestamp
}

export interface ExamData {
    teacherName: string;
    sessions: ExamSession[];
    updatedAt: number;
}
