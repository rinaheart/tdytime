import React, { useState, useCallback } from 'react';
import { Clock, StickyNote } from 'lucide-react';
import { getPeriodTimes } from '@/core/constants';
import { formatRoom, formatClassDisplay } from '@/core/schedule/schedule.utils';
import type { CourseSession } from '@/core/schedule/schedule.types';
import type { FlatSession } from '@/core/schedule/schedule.index';
import { Badge } from '@/ui/primitives';
import { TypeBadge, NoteModal } from '@/ui/composites';
import { useNotesStore } from '@/core/stores/notes.store';

export type SessionCardData = CourseSession | FlatSession;

export interface SessionCardProps {
    session: SessionCardData;
    status?: 'LIVE' | 'UPCOMING' | 'PENDING' | 'COMPLETED';
    variant?: 'today' | 'weekly';
    abbreviations?: Record<string, string>;
    showTeacher?: boolean;
    className?: string;
    startTimeStr?: string;
    endTimeStr?: string;
}

/** Legacy logic: Compute human-readable start/end time from period range if strings missing */
const getTimeStrings = (session: SessionCardData) => {
    const startP = parseInt(session.timeSlot.split('-')[0], 10);
    const endP = parseInt(session.timeSlot.split('-')[1] || String(startP), 10);
    const times = getPeriodTimes(session.type);
    const periodStart = times[startP];
    const periodEnd = times[endP] || periodStart;
    const fmt = (t: [number, number]) =>
        `${String(t[0]).padStart(2, '0')}:${String(t[1]).padStart(2, '0')}`;
    return {
        startTime: periodStart ? fmt(periodStart.start) : '07:00',
        endTime: periodEnd ? fmt(periodEnd.end) : '09:00',
    };
};

/** Shared helper to extract time strings from hybrid session types */
const resolveTimes = (
    session: SessionCardData,
    props: { startTimeStr?: string; endTimeStr?: string },
) => {
    if (props.startTimeStr && props.endTimeStr) {
        return {
            start: props.startTimeStr,
            end: props.endTimeStr,
        };
    }
    if ('startTimeStr' in session && 'endTimeStr' in session && session.startTimeStr && session.endTimeStr) {
        return {
            start: session.startTimeStr,
            end: session.endTimeStr,
        };
    }
    const legacyTimes = getTimeStrings(session);
    return {
        start: legacyTimes.startTime,
        end: legacyTimes.endTime,
    };
};

const WeeklyCard: React.FC<{
    session: SessionCardData;
    displayName: string;
    showTeacher: boolean;
    className?: string;
    startTimeStr?: string;
    endTimeStr?: string;
}> = ({ session, displayName, showTeacher, className = '', startTimeStr, endTimeStr }) => {
    const { start: startTime, end: endTime } = resolveTimes(session, {
        startTimeStr,
        endTimeStr,
    });
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const handleCloseNote = useCallback(() => setIsNoteOpen(false), []);
    const hasNote = useNotesStore((s) => Boolean(s.notes[session.id]));

    return (
        <div
            className={`p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-[1px] hover:border-slate-300 dark:hover:border-slate-600 group flex flex-col min-w-0 w-full overflow-hidden ${className}`}
        >
            <div className="flex items-center justify-between text-[11px] mb-1 min-w-0">
                <div className="flex items-center font-bold shrink-0 font-num">
                    <span className="text-slate-700 dark:text-slate-200">{startTime}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-light mx-0.5">-</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{endTime}</span>
                </div>
                <span
                    className="text-slate-600 dark:text-slate-400 font-black truncate ml-2 text-right flex-1 min-w-0"
                    title={session.room}
                >
                    {session.room}
                </span>
            </div>
            <h3 className="text-[12px] font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1.5 line-clamp-2 min-h-[2.4em] overflow-hidden min-w-0">
                {displayName}
            </h3>
            <div className="mt-auto text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center justify-between gap-1 overflow-hidden min-w-0">
                <div className="flex-1 min-w-0 truncate">{formatClassDisplay(session)}</div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsNoteOpen(true);
                        }}
                        aria-label={
                            hasNote
                                ? `Ghi chú đã có cho ${displayName}`
                                : `Thêm ghi chú cho ${displayName}`
                        }
                        title={hasNote ? 'Xem/Sửa ghi chú' : 'Thêm ghi chú'}
                        className={`min-w-[26px] min-h-[26px] p-1 flex items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                            hasNote
                                ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <StickyNote
                            size={13}
                            fill={hasNote ? 'currentColor' : 'none'}
                            strokeWidth={hasNote ? 2.5 : 1.75}
                        />
                    </button>
                    <TypeBadge type={session.type} compact={true} />
                </div>
            </div>
            {isNoteOpen && (
                <NoteModal
                    isOpen={isNoteOpen}
                    sessionId={session.id}
                    sessionTitle={displayName}
                    onClose={handleCloseNote}
                    date={'dateStr' in session ? session.dateStr : undefined}
                    room={formatRoom(session.room)}
                    className={formatClassDisplay(session)}
                    time={`${startTime} - ${endTime}`}
                />
            )}
            {showTeacher && (
                <div className="mt-2.5 -mx-2.5 -mb-2.5 px-2.5 py-1.5 bg-accent-50 dark:bg-accent-900/40 rounded-b-md text-[11px] font-bold border-t border-accent-100/50 dark:border-accent-800/30">
                    <span className="text-slate-900 dark:text-accent-100">{session.teacher}</span>
                </div>
            )}
        </div>
    );
};

const CompletedCard: React.FC<{
    session: SessionCardData;
    displayName: string;
    className?: string;
    startTimeStr?: string;
    endTimeStr?: string;
}> = ({ session, displayName, className = '', startTimeStr, endTimeStr }) => {
    const { start: startTime, end: endTime } = resolveTimes(session, {
        startTimeStr,
        endTimeStr,
    });
    return (
        <div
            className={`bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 opacity-75 transition-all ${className}`}
        >
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 font-num">
                    <Clock size={12} strokeWidth={1.75} />
                    <span>{startTime}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-light mx-px">-</span>
                    <span>{endTime}</span>
                </div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {displayName} — {session.className}
                </div>
            </div>
        </div>
    );
};

const TodayCard: React.FC<{
    session: SessionCardData;
    displayName: string;
    isLive: boolean;
    className?: string;
    startTimeStr?: string;
    endTimeStr?: string;
}> = ({ session, displayName, isLive, className = '', startTimeStr, endTimeStr }) => {
    const { start: startTime, end: endTime } = resolveTimes(session, {
        startTimeStr,
        endTimeStr,
    });
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const hasNote = useNotesStore((s) => Boolean(s.notes[session.id]));

    return (
        <div
            className={`p-3.5 bg-white dark:bg-slate-900 border ${
                isLive
                    ? 'border-accent-500 shadow-sm ring-1 ring-accent-500/20'
                    : 'border-slate-200 dark:border-slate-700 shadow-sm'
            } rounded-2xl transition-all mb-3 ${className}`}
        >
            <div className="flex justify-between items-center mb-1">
                <div
                    className={`text-sm font-black font-num ${
                        isLive
                            ? 'text-accent-600 dark:text-accent-400'
                            : 'text-slate-800 dark:text-slate-100'
                    }`}
                >
                    {startTime} - {endTime}
                </div>
                {isLive && (
                    <Badge variant="live" dot={true} className="scale-90 origin-right">
                        Live
                    </Badge>
                )}
            </div>
            <h3
                className={`text-[14px] font-bold leading-snug mb-2 ${
                    isLive ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'
                }`}
            >
                {displayName}
            </h3>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold">{formatRoom(session.room)}</span>
                    <span>•</span>
                    <span className="truncate">{formatClassDisplay(session)}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsNoteOpen(true);
                        }}
                        aria-label={
                            hasNote
                                ? `Ghi chú đã có cho ${displayName}`
                                : `Thêm ghi chú cho ${displayName}`
                        }
                        title={hasNote ? 'Xem/Sửa ghi chú' : 'Thêm ghi chú'}
                        className={`min-w-[28px] min-h-[28px] p-1.5 flex items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                            hasNote
                                ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <StickyNote
                            size={13}
                            fill={hasNote ? 'currentColor' : 'none'}
                            strokeWidth={hasNote ? 2.5 : 1.75}
                        />
                    </button>
                    <TypeBadge type={session.type} compact={true} />
                </div>
            </div>
            {isNoteOpen && (
                <NoteModal
                    isOpen={isNoteOpen}
                    sessionId={session.id}
                    sessionTitle={displayName}
                    onClose={() => setIsNoteOpen(false)}
                    time={`${startTime} - ${endTime}`}
                    room={formatRoom(session.room)}
                    className={formatClassDisplay(session)}
                    date={'dateStr' in session ? session.dateStr : undefined}
                />
            )}
        </div>
    );
};

/**
 * SessionCard — Core UI Composite
 * Refactored to support FlatSession index precomputed strings.
 */
const SessionCard: React.FC<SessionCardProps> = ({
    session,
    status = 'PENDING',
    variant = 'today',
    abbreviations = {},
    showTeacher = false,
    className = '',
    startTimeStr,
    endTimeStr,
}) => {
    const displayName = abbreviations[session.courseName] || session.courseName;

    if (variant === 'weekly') {
        return (
            <WeeklyCard
                session={session}
                displayName={displayName}
                showTeacher={showTeacher}
                className={className}
                startTimeStr={startTimeStr}
                endTimeStr={endTimeStr}
            />
        );
    }

    if (status === 'COMPLETED') {
        return (
            <CompletedCard
                session={session}
                displayName={displayName}
                className={className}
                startTimeStr={startTimeStr}
                endTimeStr={endTimeStr}
            />
        );
    }

    return (
        <TodayCard
            session={session}
            displayName={displayName}
            isLive={status === 'LIVE'}
            className={className}
            startTimeStr={startTimeStr}
            endTimeStr={endTimeStr}
        />
    );
};

export default React.memo(SessionCard);
