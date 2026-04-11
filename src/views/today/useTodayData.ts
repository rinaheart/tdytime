/**
 * useTodayData — Feature Hook (Refined Performance v1.7.2)
 * Optimized for minimal TBT and zero unnecessary re-renders.
 * Uses event-based timers instead of polling.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useScheduleStore } from '@/core/stores';
import { parseDateFromRange, isCurrentWeek, getCurrentWeekRange } from '@/core/schedule/schedule.utils';
import type { SessionWithStatus, NextTeachingInfo, DisplayState } from './today.types';

// Re-export type since it was moved from the original file to a shared definition or kept here
// For consistency with existing components, we'll keep the types here or ensure they match.

const formatDateVN = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return { day, month, year, full: `${day}/${month}/${year}` };
};

export const useTodayData = () => {
    const { t } = useTranslation();
    
    // Select specific slices to avoid unnecessary re-renders
    const sessionsIndex = useScheduleStore(s => s.sessionsIndex);
    const mockState = useScheduleStore(s => s.mockState);
    const teacherName = useScheduleStore(s => s.data?.metadata?.teacher || '');
    const weekData = useScheduleStore(s => s.data?.weeks || []);

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
            const todayStart = new Date(currentNow);
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date(currentNow);
            todayEnd.setHours(23, 59, 59, 999);

            const upcomingEvents = sessionsIndex
                .flatMap(s => [s.absoluteStart, s.absoluteEnd])
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

        // Sync on visibility change
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
    const dayOfWeekIdx = currentJsDay === 0 ? 6 : currentJsDay - 1;
    const dateInfo = useMemo(() => formatDateVN(now), [now.getDate(), now.getMonth(), now.getFullYear()]);

    const semesterBounds = useMemo(() => {
        if (weekData.length === 0) return null;
        return {
            start: parseDateFromRange(weekData[0].dateRange, 'start'),
            end: parseDateFromRange(weekData[weekData.length - 1].dateRange, 'end'),
        };
    }, [weekData]);

    const currentWeek = useMemo(() => {
        const idx = weekData.findIndex((w) => isCurrentWeek(w.dateRange, now));
        return idx !== -1 ? weekData[idx] : null;
    }, [weekData, now.getDate(), now.getMonth()]); // Use specific date parts

    // Performance P0: Precompute today's sessions from index
    const todaySessions: SessionWithStatus[] = useMemo(() => {
        const todayStr = dateInfo.full;
        const result = sessionsIndex
            .filter(s => s.dateStr === todayStr)
            .map(s => {
                let status: 'PENDING' | 'LIVE' | 'COMPLETED' = 'PENDING';
                const t = now.getTime();
                if (t >= s.absoluteEnd) status = 'COMPLETED';
                else if (t >= s.absoluteStart) status = 'LIVE';
                
                return { ...s, status };
            });

        // Grouping/Sorting logic
        return result.sort((a, b) => {
            const priority = { LIVE: 0, PENDING: 1, COMPLETED: 2 };
            if (priority[a.status] !== priority[b.status]) return priority[a.status] - priority[b.status];
            return a.absoluteStart - b.absoluteStart;
        });
    }, [sessionsIndex, now.getTime(), dateInfo.full]);

    const isWeekEmpty = useMemo(() => {
        if (!currentWeek) return true;
        // Optimization: Use precomputed index to check week empty? 
        // For now, keep it simple but stable.
        return !Object.values(currentWeek.days).some(dayData => {
            const all = [...dayData.morning, ...dayData.afternoon, ...dayData.evening];
            // Note: teacherName is stable here
            return all.some(s => s.teacher.toLowerCase().includes(teacherName.toLowerCase()));
        });
    }, [currentWeek, teacherName]);

    const nextTeaching: NextTeachingInfo | null = useMemo(() => {
        const t = now.getTime();
        const next = sessionsIndex.find(s => s.absoluteStart > t);
        if (!next) return null;

        const nextDate = new Date(next.absoluteStart);
        const wIdx = weekData.findIndex(w => isCurrentWeek(w.dateRange, nextDate));
        const dJsIdx = nextDate.getDay();

        // Get all sessions for that day for the preview
        const daySessions = sessionsIndex.filter(s => s.dateStr === next.dateStr);

        return {
            date: nextDate,
            sessions: daySessions,
            weekIdx: wIdx,
            dayIdx: dJsIdx === 0 ? 6 : dJsIdx - 1
        };
    }, [sessionsIndex, now.getTime(), weekData]);

    const displayState: DisplayState = useMemo(() => {
        if (weekData.length === 0) return 'NO_DATA';
        const today = new Date(now); today.setHours(0, 0, 0, 0);
        if (semesterBounds?.start && today < semesterBounds.start) return 'BEFORE_SEMESTER';
        if (semesterBounds?.end && today > semesterBounds.end) return 'AFTER_SEMESTER';
        if (todaySessions.length === 0) return 'NO_SESSIONS';
        return 'HAS_SESSIONS';
    }, [weekData.length, semesterBounds, todaySessions.length, now.getDate()]);

    const currentWeekRange = useMemo(() => {
        if (currentWeek) return currentWeek.dateRange;
        return getCurrentWeekRange(now);
    }, [currentWeek, now.getDate()]);

    const greeting = useMemo(() => {
        const hour = now.getHours();
        const name = teacherName.split(' ').pop() || '';
        if (hour < 12) return t('stats.today.greeting.morning', { name });
        if (hour < 18) return t('stats.today.greeting.afternoon', { name });
        return t('stats.today.greeting.evening', { name });
    }, [now.getHours(), teacherName, t]); // Hour level stability

    const totalPeriods = useMemo(() => 
        todaySessions.reduce((acc, s) => acc + s.periodCount, 0), 
    [todaySessions]);

    const daysUntilSemester = useMemo(() => {
        if (!semesterBounds?.start) return null;
        return Math.ceil((semesterBounds.start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }, [semesterBounds, now.getDate()]);

    const isAfterSemester = displayState === 'AFTER_SEMESTER';
    const isBeforeSemester = displayState === 'BEFORE_SEMESTER';

    return { 
        now, 
        dateInfo, 
        dayOfWeekIdx, 
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
        isBeforeSemester 
    };
};
