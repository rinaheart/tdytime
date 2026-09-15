import React, { useState, useCallback } from 'react';
import { Clock, StickyNote } from 'lucide-react';
import Badge from '@/ui/primitives/Badge';
import TypeBadge from '@/ui/composites/TypeBadge';
import NoteModal from '@/ui/composites/NoteModal';
import type { CourseSession } from '@/core/schedule/schedule.types';
import type { FlatSession } from '@/core/schedule/schedule.index';
import { getPeriodTimes } from '@/core/constants';
import { formatRoom, formatClassDisplay } from '@/core/schedule/schedule.utils';
import { useNotesStore } from '@/core/stores/notes.store';

type SessionStatus = 'PENDING' | 'LIVE' | 'COMPLETED';
type SessionVariant = 'today' | 'weekly';

interface SessionCardProps {
    session: FlatSession | CourseSession;
    status?: SessionStatus;
    variant?: SessionVariant;
    abbreviations?: Record<string, string>;
    showTeacher?: boolean;
    className?: string;
    // Precomputed strings can now be passed or read from session if it's FlatSession
    startTimeStr?: string; 
    endTimeStr?: string;
}

/** Legacy logic: Compute human-readable start/end time from period range if strings missing */
const getTimeStrings = (session: CourseSession) => {
    const startP = parseInt(session.timeSlot.split('-')[0]);
    const endP = parseInt(session.timeSlot.split('-')[1] || String(startP));
    const times = getPeriodTimes(session.type);
    const periodStart = times[startP];
    const periodEnd = times[endP] || periodStart;

    const fmt = (t: [number, number]) => `${String(t[0]).padStart(2, '0')}:${String(t[1]).padStart(2, '0')}`;
    return {
        startTime: periodStart ? fmt(periodStart.start) : '07:00',
        endTime: periodEnd ? fmt(periodEnd.end) : '09:00',
    };
};

/** Shared helper to extract time strings from hybrid session types */
const resolveTimes = (session: FlatSession | CourseSession, props: { startTimeStr?: string, endTimeStr?: string }) => {
    // Priority 1: Direct Props
    if (props.startTimeStr && props.endTimeStr) {
        return { start: props.startTimeStr, end: props.endTimeStr };
    }
    
    // Priority 2: FlatSession Precomputed
    if ('startTimeStr' in session && 'endTimeStr' in session) {
        return { start: session.startTimeStr, end: session.endTimeStr };
    }
    
    // Priority 3: Legacy Calculation
    const legacyTimes = getTimeStrings(session as CourseSession);
    return { start: legacyTimes.startTime, end: legacyTimes.endTime };
};

// ─── WEEKLY VARIANT (Compact 3-Line) ─────────────────────────
const WeeklyCard: React.FC<{ session: FlatSession | CourseSession; displayName: string; showTeacher: boolean; className?: string; startTimeStr?: string; endTimeStr?: string }> = ({
    session, displayName, showTeacher, className = '', startTimeStr, endTimeStr,
}) => {
    const { start: startTime, end: endTime } = resolveTimes(session, { startTimeStr, endTimeStr });
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const handleCloseNote = useCallback(() => setIsNoteOpen(false), [setIsNoteOpen]);
    const getNote = useNotesStore(s => s.getNote);
    const hasNote = !!getNote(session.id);
    
    return (
        <div className={`p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-[1px] hover:border-slate-300 dark:hover:border-slate-600 group flex flex-col min-w-0 w-full overflow-hidden ${className}`}>
            {/* Row 1: Time + Room */}
            <div className="flex items-center justify-between text-[10px] mb-1 min-w-0">
                <div className="flex items-center font-bold shrink-0">
                    <span className="text-slate-700 dark:text-slate-200">{startTime}</span>
                    <span className="text-slate-300 dark:text-slate-600 font-light mx-px">-</span>
                    <span className="text-slate-400 dark:text-slate-500 font-medium">{endTime}</span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 font-black truncate ml-2 text-right flex-1 min-w-0" title={session.room}>
                    {session.room}
                </span>
            </div>

            {/* Row 2: Subject (Strictly 2 lines) */}
            <h3 className="text-[12px] font-bold text-slate-800 dark:text-slate-200 leading-tight mb-1.5 line-clamp-2 min-h-[2.4em] overflow-hidden min-w-0">
                {displayName}
            </h3>

            {/* Row 3: Class (Group) [Type] */}
            <div className="mt-auto text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between gap-1 overflow-hidden min-w-0">
                <div className="flex-1 min-w-0 truncate">
                    {formatClassDisplay(session)}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsNoteOpen(true);
                        }}
                        className={`p-1 rounded transition-colors ${hasNote 
                            ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500'}`}
                    >
                        <StickyNote size={12} fill={hasNote ? "currentColor" : "none"} strokeWidth={hasNote ? 2.5 : 1.5} />
                    </button>
                    <TypeBadge type={session.type} compact />
                </div>
            </div>

            {/* Note Modal */}
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

            {/* Optional Teacher Footer Strip */}
            {showTeacher && (
                <div className="mt-2.5 -mx-2.5 -mb-2.5 px-2.5 py-1.5 bg-accent-50 dark:bg-accent-900/40 rounded-b-md text-[10px] font-bold border-t border-accent-100/50 dark:border-accent-800/30">
                    <span className="text-slate-900 dark:text-accent-100">{session.teacher}</span>
                </div>
            )}
        </div>
    );
};

// ─── TODAY COMPLETED (Collapsed row) ─────────────────────────
const CompletedCard: React.FC<{ session: FlatSession | CourseSession; displayName: string; className?: string; startTimeStr?: string; endTimeStr?: string }> = ({ session, displayName, className = '', startTimeStr, endTimeStr }) => {
    const { start: startTime, end: endTime } = resolveTimes(session, { startTimeStr, endTimeStr });

    return (
        <div className={`bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 opacity-70 transition-all ${className}`}>
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                    < Clock size={12} strokeWidth={1.5} />
                    <span>{startTime}</span>
                    <span className="text-slate-300 dark:text-slate-600 font-light mx-px">-</span>
                    <span>{endTime}</span>
                </div>
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 truncate">
                    {displayName} — {session.className}
                </div>
            </div>
        </div>
    );
};

// ─── TODAY LIVE & PENDING (Option 1: Minimalist Stack) ────────────────────────
const TodayCard: React.FC<{ session: FlatSession | CourseSession; displayName: string; isLive: boolean; className?: string; startTimeStr?: string; endTimeStr?: string }> = ({
    session, displayName, isLive, className = '', startTimeStr, endTimeStr,
}) => {
    const { start: startTime, end: endTime } = resolveTimes(session, { startTimeStr, endTimeStr });
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const getNote = useNotesStore(s => s.getNote);
    const hasNote = !!getNote(session.id);

    return (
        <div className={`p-3 bg-white dark:bg-slate-900 border ${isLive ? 'border-accent-500 shadow-md ring-1 ring-accent-500/20' : 'border-slate-200 dark:border-slate-700 shadow-sm'} rounded-2xl transition-all mb-3 ${className}`}>
            <div className="flex justify-between items-center mb-1">
                <div className={`text-sm font-black ${isLive ? 'text-accent-600 dark:text-accent-400' : 'text-slate-800 dark:text-slate-100'}`}>
                    {startTime} - {endTime}
                </div>
                {isLive && <Badge variant="live" dot className="scale-90 origin-right">Live</Badge>}
            </div>
            
            <h3 className={`text-[14px] font-bold leading-tight mb-2 ${isLive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                {displayName}
            </h3>
            
            <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold">{formatRoom(session.room)}</span>
                    <span>•</span>
                    <span className="truncate">{formatClassDisplay(session)}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {hasNote && <StickyNote size={12} className="text-accent-500" fill="currentColor" />}
                    <TypeBadge type={session.type} compact />
                </div>
            </div>
            
            <NoteModal isOpen={isNoteOpen} sessionId={session.id} sessionTitle={displayName} onClose={() => setIsNoteOpen(false)} time={`${startTime} - ${endTime}`} room={formatRoom(session.room)} className={formatClassDisplay(session)} date={'dateStr' in session ? session.dateStr : undefined} />
        </div>
    );
};

/**
 * SessionCard — Core UI Composite
 * Refactored to support FlatSession index precomputed strings.
 * Fallbacks available for CourseSession (deprecated in Phase 3).
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
        return <WeeklyCard session={session} displayName={displayName} showTeacher={showTeacher} className={className} startTimeStr={startTimeStr} endTimeStr={endTimeStr} />;
    }

    if (status === 'COMPLETED') {
        return <CompletedCard session={session} displayName={displayName} className={className} startTimeStr={startTimeStr} endTimeStr={endTimeStr} />;
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
