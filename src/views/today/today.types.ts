import { FlatSession } from '@/core/schedule/schedule.index';

/** Session with dynamic status for the Today dashboard */
export interface SessionWithStatus extends FlatSession {
    status: 'PENDING' | 'LIVE' | 'COMPLETED';
}

/** Grouped next teaching information */
export interface NextTeachingInfo {
    date: Date;
    sessions: FlatSession[];
    weekIdx: number;
    dayIdx: number;
}

/** Dashboard display state */
export type DisplayState = 'NO_DATA' | 'BEFORE_SEMESTER' | 'AFTER_SEMESTER' | 'NO_SESSIONS' | 'HAS_SESSIONS';
