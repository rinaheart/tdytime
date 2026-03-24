/**
 * useTodayData — Feature Hook
 * Computes today's schedule state, session statuses, greeting, and next teaching info.
 * Reads from Zustand schedule store.
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useScheduleStore } from '@/core/stores';
import type { CourseSession } from '@/core/schedule/schedule.types';
import { DAYS_OF_WEEK, getPeriodTimes } from '@/core/constants';
import { parseDateFromRange, isCurrentWeek, getCurrentWeekRange, isMainTeacher } from '@/core/schedule/schedule.utils';

export type DisplayState = 'NO_DATA' | 'BEFORE_SEMESTER' | 'AFTER_SEMESTER' | 'NO_SESSIONS' | 'HAS_SESSIONS';
type SessionStatus = 'PENDING' | 'LIVE' | 'COMPLETED';

export interface SessionWithStatus extends CourseSession {
    status: SessionStatus;
    startTimeStr: string;
    endTimeStr: string;
}

export interface NextTeachingInfo {
    date: Date;
    sessions: CourseSession[];
    weekIdx: number;
    dayIdx: number;
}

const getSessionStatus = (session: CourseSession, now: Date): SessionStatus => {
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const startP = parseInt(session.timeSlot.split('-')[0]);
    const endP = parseInt(session.timeSlot.split('-')[1] || String(startP));
    const times = getPeriodTimes(session.type);
    const startPeriod = times[startP];
    const endPeriod = times[endP] || startPeriod;
    if (!startPeriod || !endPeriod) return 'PENDING';
    const startMin = startPeriod.start[0] * 60 + startPeriod.start[1];
    const endMin = endPeriod.end[0] * 60 + endPeriod.end[1];
    if (currentMin < startMin) return 'PENDING';
    if (currentMin < endMin) return 'LIVE';
    return 'COMPLETED';
};

const getTimeStrings = (session: CourseSession) => {
    const startP = parseInt(session.timeSlot.split('-')[0]);
    const endP = parseInt(session.timeSlot.split('-')[1] || String(startP));
    const times = getPeriodTimes(session.type);
    const periodStart = times[startP];
    const periodEnd = times[endP] || periodStart;
    const fmt = (t: [number, number]) => `${String(t[0]).padStart(2, '0')}:${String(t[1]).padStart(2, '0')}`;
    return {
        startTimeStr: periodStart ? fmt(periodStart.start) : '07:00',
        endTimeStr: periodEnd ? fmt(periodEnd.end) : '09:00',
    };
};

const formatDateVN = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return { day, month, year, full: `${day}/${month}/${year}` };
};

export const useTodayData = () => {
    const { t } = useTranslation();
    const data = useScheduleStore((s) => s.data);
    const mockState = useScheduleStore((s) => s.mockState);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const updateTime = () => {
            if (mockState) {
                const elapsedReal = Date.now() - mockState.startTimeLocal;
                setCurrentTime(new Date(mockState.startTimeMock + elapsedReal * mockState.multiplier));
            } else {
                setCurrentTime(new Date());
            }
        };

        updateTime();

        const delay = (mockState && mockState.multiplier > 1) ? 1000 : 60000;
        const timer = setInterval(updateTime, delay);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                updateTime();
            }
        };
        const handleFocus = () => updateTime();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [mockState]);

    const now = currentTime;
    const currentJsDay = now.getDay();
    const dayOfWeekIdx = currentJsDay === 0 ? 6 : currentJsDay - 1;
    const dayName = DAYS_OF_WEEK[dayOfWeekIdx];
    const dateInfo = formatDateVN(now);

    const weeks = data?.weeks || [];
    const teacherName = data?.metadata?.teacher || '';

    const checkIsMain = (tName: string) => isMainTeacher(tName, teacherName);

    const semesterBounds = useMemo(() => {
        if (weeks.length === 0) return null;
        return {
            start: parseDateFromRange(weeks[0].dateRange, 'start'),
            end: parseDateFromRange(weeks[weeks.length - 1].dateRange, 'end'),
        };
    }, [weeks]);

    const currentWeek = useMemo(() => {
        const idx = weeks.findIndex((w) => isCurrentWeek(w.dateRange, now));
        return idx !== -1 ? weeks[idx] : null;
    }, [weeks, now]);

    const todaySessionsRaw = useMemo(() => {
        if (!currentWeek) return [];
        const dayData = currentWeek.days[dayName];
        if (!dayData) return [];
        return [...dayData.morning, ...dayData.afternoon, ...dayData.evening].filter((s) => checkIsMain(s.teacher));
    }, [currentWeek, dayName, checkIsMain]);

    const isWeekEmpty = useMemo(() => {
        if (!currentWeek) return true;
        return !Object.values(currentWeek.days).some(dayData => {
            return [...dayData.morning, ...dayData.afternoon, ...dayData.evening].some(s => checkIsMain(s.teacher));
        });
    }, [currentWeek]);

    const todaySessions: SessionWithStatus[] = useMemo(() => {
        return todaySessionsRaw
            .map((s) => ({ ...s, status: getSessionStatus(s, now), ...getTimeStrings(s) }))
            .sort((a, b) => {
                const priority = { LIVE: 0, PENDING: 1, COMPLETED: 2 };
                if (priority[a.status] !== priority[b.status]) return priority[a.status] - priority[b.status];
                return parseInt(a.timeSlot.split('-')[0]) - parseInt(b.timeSlot.split('-')[0]);
            });
    }, [todaySessionsRaw, now]);

    const nextTeaching: NextTeachingInfo | null = useMemo(() => {
        const searchDate = new Date(now);
        searchDate.setDate(searchDate.getDate() + 1);
        for (let i = 0; i < 60; i++) {
            const dJsIdx = searchDate.getDay();
            const dIdx = dJsIdx === 0 ? 6 : dJsIdx - 1;
            const dName = DAYS_OF_WEEK[dIdx];
            const wIdx = weeks.findIndex((w) => isCurrentWeek(w.dateRange, searchDate));
            if (wIdx !== -1) {
                const week = weeks[wIdx];
                const dayData = week.days[dName];
                if (dayData) {
                    const sessions = [...dayData.morning, ...dayData.afternoon, ...dayData.evening]
                        .filter((s) => checkIsMain(s.teacher))
                        .sort((a, b) => parseInt(a.timeSlot.split('-')[0]) - parseInt(b.timeSlot.split('-')[0]));
                    if (sessions.length > 0) return { date: new Date(searchDate), sessions, weekIdx: wIdx, dayIdx: dIdx };
                }
            }
            searchDate.setDate(searchDate.getDate() + 1);
        }
        return null;
    }, [weeks, now]);

    const displayState: DisplayState = useMemo(() => {
        if (weeks.length === 0) return 'NO_DATA';
        if (semesterBounds?.start) {
            const today = new Date(now); today.setHours(0, 0, 0, 0);
            if (today < semesterBounds.start) return 'BEFORE_SEMESTER';
        }
        if (semesterBounds?.end) {
            const today = new Date(now); today.setHours(0, 0, 0, 0);
            if (today > semesterBounds.end) return 'AFTER_SEMESTER';
        }
        if (todaySessions.length === 0) return 'NO_SESSIONS';
        return 'HAS_SESSIONS';
    }, [weeks.length, semesterBounds, todaySessions.length, now]);

    const isAfterSemester = displayState === 'AFTER_SEMESTER';
    const isBeforeSemester = displayState === 'BEFORE_SEMESTER';

    const currentWeekRange = useMemo(() => {
        if (currentWeek) return currentWeek.dateRange;
        return getCurrentWeekRange(now);
    }, [currentWeek, now]);

    const greeting = useMemo(() => {
        const hour = now.getHours();
        const name = teacherName.split(' ').pop() || '';
        if (hour < 12) return t('stats.today.greeting.morning', { name });
        if (hour < 18) return t('stats.today.greeting.afternoon', { name });
        return t('stats.today.greeting.evening', { name });
    }, [now, teacherName, t]);

    const totalPeriods = todaySessions.reduce((acc, s) => acc + s.periodCount, 0);

    const daysUntilSemester = useMemo(() => {
        if (!semesterBounds?.start) return null;
        return Math.ceil((semesterBounds.start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }, [semesterBounds, now]);

    return { now, dateInfo, dayOfWeekIdx, displayState, todaySessions, nextTeaching, totalPeriods, daysUntilSemester, greeting, isWeekEmpty, currentWeek, currentWeekRange, isAfterSemester, isBeforeSemester };
};
