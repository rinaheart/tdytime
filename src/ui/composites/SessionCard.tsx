/**
 * SessionCard — Core UI Composite
 * Renders a single teaching session.
 * Two variants: 'today' (detailed) and 'weekly' (compact 3-line).
 */

import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { Badge } from '@/ui/primitives';
import type { CourseSession } from '@/core/schedule/schedule.types';
import { CourseType } from '@/core/schedule/schedule.types';
import { getPeriodTimes } from '@/core/constants';

type SessionStatus = 'PENDING' | 'LIVE' | 'COMPLETED';
type SessionVariant = 'today' | 'weekly';

interface SessionCardProps {
    session: CourseSession;
    status?: SessionStatus;
    variant?: SessionVariant;
    overrides?: Record<string, CourseType>;
    abbreviations?: Record<string, string>;
    showTeacher?: boolean;
}

/** Compute human-readable start/end time from period range */
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

// ─── WEEKLY VARIANT (Compact 3-Line) ─────────────────────────
const WeeklyCard: React.FC<{ session: CourseSession; displayName: string; currentType: CourseType; showTeacher: boolean }> = ({
    session, displayName, currentType, showTeacher,
}) => {
    const { startTime, endTime } = getTimeStrings(session);
    return (
        <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-[1px] hover:border-slate-300 dark:hover:border-slate-600 group">
            {/* Row 1: Time + Room */}
            <div className="flex items-center justify-between text-[10px] mb-1">
                <div className="flex items-center font-bold">
                    <span className="text-slate-700 dark:text-slate-200">{startTime}</span>
                    <span className="text-slate-300 dark:text-slate-600 font-light mx-px">-</span>
                    <span className="text-slate-400 dark:text-slate-500 font-medium">{endTime}</span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 font-black">{session.room}</span>
            </div>

            {/* Row 2: Subject */}
            <h3 className="text-[12px] font-bold text-slate-800 dark:text-slate-200 leading-tight mb-1.5 line-clamp-2">
                {displayName}
            </h3>

            {/* Row 3: Class (Group) [Type] */}
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between gap-2">
                <div className="truncate flex items-center gap-1">
                    <span className="truncate">{session.className}</span>
                    <span className="shrink-0 opacity-70">({session.group})</span>
                </div>
                <Badge variant={currentType === CourseType.LT ? 'theory' : 'practice'}>
                    [{currentType}]
                </Badge>
            </div>

            {/* Optional Teacher Footer Strip */}
            {showTeacher && (
                <div className="mt-2.5 -mx-2.5 -mb-2.5 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/40 rounded-b-lg text-[10px] font-bold border-t border-blue-100/50 dark:border-blue-800/30">
                    <span className="text-slate-900 dark:text-blue-100">{session.teacher}</span>
                </div>
            )}
        </div>
    );
};

// ─── TODAY COMPLETED (Collapsed row) ─────────────────────────
const CompletedCard: React.FC<{ session: CourseSession; displayName: string }> = ({ session, displayName }) => {
    const { startTime, endTime } = getTimeStrings(session);
    return (
        <div className="bg-slate-100 dark:bg-slate-800/80 rounded-lg p-3 border border-slate-200 dark:border-slate-700 opacity-70 transition-all">
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <Clock size={12} />
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

// ─── TODAY FULL CARD (LIVE / PENDING) ────────────────────────
const TodayCard: React.FC<{ session: CourseSession; displayName: string; currentType: CourseType; isLive: boolean; showTeacher: boolean }> = ({
    session, displayName, currentType, isLive, showTeacher,
}) => {
    const { startTime, endTime } = getTimeStrings(session);
    return (
        <div className={`relative rounded-xl p-5 transition-all duration-200 ${isLive
            ? 'bg-white dark:bg-slate-900 border border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-sm hover:shadow-lg'
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
            }`}>
            {/* Live Indicator */}
            {isLive && (
                <div className="absolute top-5 right-5">
                    <Badge variant="live" dot>Live</Badge>
                </div>
            )}

            {/* Time — Primary Focus */}
            <div className="flex items-center gap-2 mb-3 font-num">
                <Clock size={16} className="text-slate-400" />
                <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{startTime}</span>
                <span className="text-slate-300 dark:text-slate-600">—</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{endTime}</span>
            </div>

            {/* Subject Name */}
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 leading-snug mb-3 text-pretty">
                {displayName}
            </h3>

            {/* Meta Row */}
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    <span className="font-medium">{session.room}</span>
                </div>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>{session.className}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className={`font-semibold ${currentType === CourseType.LT ? 'text-blue-500' : 'text-emerald-500'}`}>
                    {currentType}
                </span>
            </div>

            {/* Optional Teacher Footer Strip */}
            {showTeacher && (
                <div className="mt-5 -mx-5 -mb-5 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-b-xl border-t border-blue-100 dark:border-blue-800/50 text-[13px] font-black">
                    <span className="text-slate-900 dark:text-blue-50">{session.teacher}</span>
                </div>
            )}
        </div>
    );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────
const SessionCard: React.FC<SessionCardProps> = ({
    session,
    status = 'PENDING',
    variant = 'today',
    overrides = {},
    abbreviations = {},
    showTeacher = false,
}) => {
    const currentType = overrides[session.courseCode] || session.type;
    const displayName = abbreviations[session.courseName] || session.courseName;

    if (variant === 'weekly') {
        return <WeeklyCard session={session} displayName={displayName} currentType={currentType} showTeacher={showTeacher} />;
    }

    if (status === 'COMPLETED') {
        return <CompletedCard session={session} displayName={displayName} />;
    }

    return (
        <TodayCard
            session={session}
            displayName={displayName}
            currentType={currentType}
            isLive={status === 'LIVE'}
            showTeacher={showTeacher}
        />
    );
};

export default React.memo(SessionCard);
