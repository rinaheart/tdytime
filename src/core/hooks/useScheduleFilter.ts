import { useState, useMemo } from 'react';
import type { DaySchedule, WeekSchedule } from '@/core/schedule/schedule.types';
import { createSessionFilter, parseDateFromRange } from '@/core/schedule/schedule.utils';
import type { FilterState } from '@/core/schedule/schedule.utils';

export function useScheduleFilter(weeks: WeekSchedule[], initialTeacher: string = '') {
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        className: '',
        room: '',
        teacher: initialTeacher,
        sessionTime: '',
    });
    
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const toggleFilter = () => setIsFilterOpen((v) => !v);

    const now = useMemo(() => new Date(), []);
    const filterFn = useMemo(() => createSessionFilter(filters), [filters]);

    const hasActiveFilters = useMemo(
        () => filters.search !== '' || filters.className !== '' || filters.room !== '' || (filters.teacher !== '' && filters.teacher !== initialTeacher),
        [filters, initialTeacher]
    );

    const uniqueData = useMemo(() => {
        const rooms = new Set<string>();
        const teachers = new Set<string>();
        const classes = new Set<string>();
        
        weeks.forEach((w) => {
            Object.values(w.days).forEach((d) => {
                const day = d as DaySchedule;
                [...day.morning, ...day.afternoon, ...day.evening].forEach((s) => {
                    rooms.add(s.room);
                    teachers.add(s.teacher);
                    if (s.className) classes.add(s.className);
                });
            });
        });
        
        return {
            rooms: Array.from(rooms).sort(),
            teachers: Array.from(teachers).sort(),
            classes: Array.from(classes).sort()
        };
    }, [weeks]);

    const isAfterSemester = useMemo(() => {
        if (weeks.length === 0) return false;
        const endDate = parseDateFromRange(weeks[weeks.length - 1].dateRange, 'end');
        if (!endDate) return false;
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        return today > endDate;
    }, [weeks, now]);

    const isBeforeSemester = useMemo(() => {
        if (weeks.length === 0) return false;
        const startDate = parseDateFromRange(weeks[0].dateRange, 'start');
        if (!startDate) return false;
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        return today < startDate;
    }, [weeks, now]);

    return {
        filters,
        setFilters,
        isFilterOpen,
        toggleFilter,
        filterFn,
        hasActiveFilters,
        uniqueData,
        isAfterSemester,
        isBeforeSemester,
        now
    };
}
