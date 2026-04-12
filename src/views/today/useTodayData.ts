import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useScheduleStore } from '@/core/stores/schedule.store';
import { isCurrentWeek } from '@/core/schedule';
import type { SessionWithStatus, NextTeachingInfo, DisplayState } from './today.types';

const formatDateVN = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return { day, month, year, full: `${day}/${month}/${year}` };
};

const EMPTY_ARRAY: any[] = [];
/**
 * useTodayData — Feature Hook (Adapter Refactor v2.0)
 * Refactored to leverage FlatSession index for O(1) queries.
 * Maintains event-based timers for zero-jank updates.
 */
export const useTodayData = () => {
    const { t } = useTranslation();
    
    // Select specific slices to avoid unnecessary re-renders
    const sessionsIndex = useScheduleStore(useShallow(s => s.sessionsIndex));
    const semesterBounds = useScheduleStore(useShallow(s => s.semesterBounds));
    const mockState = useScheduleStore(s => s.mockState);
    const teacherName = useScheduleStore(s => s.data?.metadata?.teacher || '');
    const weekData = useScheduleStore(useShallow(s => s.data?.weeks)) || EMPTY_ARRAY;

    const [now, setNow] = useState(new Date());

    /**
     * Logic to compute current time based on MockState if active.
     */
    const getCalculatedTime = useCallback(() => {
        if (mockState) {
            const elapsedReal = Date.now() - mockState.startTimeLocal;
            return new Date(mockState.startTimeMock + elapsedReal * mockState.multiplier);
        }
        return new Date();
    }, [mockState]);

    /**
     * Event-based Timer: Reschedules itself only when a state change is expected.
     */
    useEffect(() => {
        let timerId: ReturnType<typeof setTimeout>;

        const scheduleUpdate = () => {
            const currentNow = getCalculatedTime();
            setNow(currentNow);

            const currentTimeMs = currentNow.getTime();
            
            // 1. Find the next relevant event today (start or end of a session)
            const todayEnd = new Date(currentNow);
            todayEnd.setHours(23, 59, 59, 999);

            const upcomingEvents = sessionsIndex
                .flatMap(s => [s.startTs, s.endTs]) 
                .filter(time => time > currentTimeMs && time <= todayEnd.getTime())
                .sort((a, b) => a - b);

            let nextEventTime = upcomingEvents[0];

            // 2. If no more events today, schedule for next midnight
            if (!nextEventTime) {
                const tomorrow = new Date(currentNow);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 500); // Slight buffer after midnight
                nextEventTime = tomorrow.getTime();
            }

            // 3. Calculate delay (accounting for mock multiplier)
            let delay = nextEventTime - currentTimeMs;
            if (mockState && mockState.multiplier > 1) {
                delay = delay / mockState.multiplier;
            }

            // Cap delay to 1 hour to prevent extreme drifts, but > 1 minute
            const safeDelay = Math.max(1000, Math.min(delay, 3600000));
            timerId = setTimeout(scheduleUpdate, safeDelay);
        };

        scheduleUpdate();

        const handleSync = () => {
            if (document.visibilityState === 'visible') {
                clearTimeout(timerId);
                scheduleUpdate();
            }
        };

        document.addEventListener('visibilitychange', handleSync);
        window.addEventListener('focus', handleSync);

        return () => {
            clearTimeout(timerId);
            document.removeEventListener('visibilitychange', handleSync);
            window.removeEventListener('focus', handleSync);
        };
    }, [sessionsIndex, getCalculatedTime, mockState]);

    // Calendar Day Level derived state (Memoized)
    const currentJsDay = now.getDay();
    const todayDayIdx = currentJsDay === 0 ? 6 : currentJsDay - 1; // 0=Mon, 6=Sun
    const dateInfo = useMemo(() => formatDateVN(now), [now.getDate(), now.getMonth(), now.getFullYear()]);

    // Derive current week index (1-based) from weekData if available, matching buildScheduleIndex logic
    const currentWeekIdx = useMemo(() => {
        if (!weekData.length) return -1;
        const index = weekData.findIndex(w => isCurrentWeek(w.dateRange, now));
        return index !== -1 ? index + 1 : -1;
    }, [weekData, now.getDate(), now.getMonth(), now.getFullYear()]);


    // Performance P0: Precompute today's sessions from index
    const todaySessions: SessionWithStatus[] = useMemo(() => {
        const result = sessionsIndex
            .filter(s => s.weekIdx === currentWeekIdx && s.dayIdx === todayDayIdx)
            .map(s => {
                let status: 'PENDING' | 'LIVE' | 'COMPLETED' = 'PENDING';
                const t = now.getTime();
                if (t >= s.endTs) status = 'COMPLETED';
                else if (t >= s.startTs) status = 'LIVE';
                
                return { ...s, status } as SessionWithStatus;
            });

        // Grouping/Sorting logic
        return result.sort((a, b) => {
            const priority = { LIVE: 0, PENDING: 1, COMPLETED: 2 };
            if (priority[a.status] !== priority[b.status]) return priority[a.status] - priority[b.status];
            return a.startTs - b.startTs;
        });
    }, [sessionsIndex, currentWeekIdx, todayDayIdx, now.getTime()]);

    const isWeekEmpty = useMemo(() => {
        if (currentWeekIdx === -1) return true;
        const weekSessions = sessionsIndex.filter(s => s.weekIdx === currentWeekIdx);
        return !weekSessions.some(s => s.teacher.toLowerCase().includes(teacherName.toLowerCase()));
    }, [sessionsIndex, currentWeekIdx, teacherName]);

    const nextTeaching: NextTeachingInfo | null = useMemo(() => {
        const t = now.getTime();
        const next = sessionsIndex.find(s => s.startTs > t);
        if (!next) return null;

        const nextSessions = sessionsIndex.filter(s => s.weekIdx === next.weekIdx && s.dayIdx === next.dayIdx);

        return {
            date: new Date(next.startTs),
            sessions: nextSessions as any,
            weekIdx: next.weekIdx - 1, // Store expects 0-based for some reason or we keep it 1-based?
                                       // Actually the original code said "wIdx" which was 0-based index.
            dayIdx: next.dayIdx
        };
    }, [sessionsIndex, now.getTime()]);

    const displayState: DisplayState = useMemo(() => {
        if (sessionsIndex.length === 0) return 'NO_DATA';
        
        const nowTs = now.getTime();
        const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
        
        // 1. Semester End Priority (Day-gated transition)
        // Only trigger AFTER_SEMESTER once the entire day of the last session has passed.
        if (semesterBounds?.end) {
            const endOfDay = new Date(semesterBounds.end);
            endOfDay.setUTCHours(23, 59, 59, 999);
            if (nowTs > endOfDay.getTime()) {
                return 'AFTER_SEMESTER';
            }
        }

        // 2. Before Semester (Day-based comparison for "Not started yet")
        if (semesterBounds?.start && startOfDay.getTime() < new Date(semesterBounds.start).setHours(0, 0, 0, 0)) {
            return 'BEFORE_SEMESTER';
        }

        // 3. Daily Content
        if (todaySessions.length === 0) return 'NO_SESSIONS';
        
        return 'HAS_SESSIONS';
    }, [sessionsIndex.length, semesterBounds, todaySessions.length, now.getTime()]);

    const currentWeek = useMemo(() => {
        if (currentWeekIdx === -1) return null;
        return weekData[currentWeekIdx - 1] || null;
    }, [weekData, currentWeekIdx]);

    const currentWeekRange = useMemo(() => {
        if (currentWeek) return currentWeek.dateRange;
        // Fallback calculation
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        const diff = d.getDate() - (day === 0 ? 6 : day - 1);
        const mon = new Date(d.setDate(diff));
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
        const fmt = (dt: Date) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
        return `${fmt(mon)} - ${fmt(sun)}`;
    }, [currentWeek, now.getDate()]);

    const greeting = useMemo(() => {
        const hour = now.getHours();
        const name = teacherName.split(' ').pop() || '';
        if (hour < 12) return t('stats.today.greeting.morning', { name });
        if (hour < 18) return t('stats.today.greeting.afternoon', { name });
        return t('stats.today.greeting.evening', { name });
    }, [now.getHours(), teacherName, t]);

    const totalPeriods = useMemo(() => 
        todaySessions.reduce((acc, s) => acc + s.periodCount, 0), 
    [todaySessions]);

    const daysUntilSemester = useMemo(() => {
        if (!semesterBounds?.start) return null;
        return Math.ceil((semesterBounds.start - now.getTime()) / (1000 * 60 * 60 * 24));
    }, [semesterBounds, now.getTime()]);

    const isSemesterOver = useMemo(() => {
        if (!semesterBounds?.end) return false;
        return now.getTime() >= semesterBounds.end;
    }, [semesterBounds, now]);

    const isAfterSemester = displayState === 'AFTER_SEMESTER';
    const isBeforeSemester = displayState === 'BEFORE_SEMESTER';

    return { 
        now, 
        dateInfo, 
        dayOfWeekIdx: todayDayIdx, 
        displayState, 
        todaySessions, 
        nextTeaching, 
        totalPeriods, 
        daysUntilSemester, 
        greeting, 
        isWeekEmpty, 
        currentWeek, 
        currentWeekRange, 
        isAfterSemester, 
        isBeforeSemester,
        isSemesterOver
    };
};
