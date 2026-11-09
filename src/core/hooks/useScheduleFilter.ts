import { useState, useMemo, useDeferredValue } from 'react';
import { useScheduleStore } from '../stores/schedule.store';
import { createSessionFilter, type FilterState } from '../schedule/schedule.utils';

/**
 * useScheduleFilter — Core hook for managing schedule search and filtering.
 *
 * @deprecated v2.0: Hook now consumes sessionsIndex internally via atomic selector.
 *
 * @param _deprecatedWeeks - (Deprecated) Previously used to derive unique data.
 * @param initialTeacher - Optional default teacher filter.
 */
export function useScheduleFilter(_deprecatedWeeks?: unknown, initialTeacher = '') {
    const sessionsIndex = useScheduleStore((s) => s.sessionsIndex);
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        className: '',
        room: '',
        teacher: initialTeacher,
        sessionTime: '',
    });
    const deferredFilters = useDeferredValue(filters);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const toggleFilter = () => setIsFilterOpen((v) => !v);
    const now = useMemo(() => new Date(), []);

    const filterFn = useMemo(() => createSessionFilter(deferredFilters), [deferredFilters]);

    const hasActiveFilters = useMemo(
        () =>
            filters.search !== '' ||
            filters.className !== '' ||
            filters.room !== '' ||
            (filters.teacher !== '' && filters.teacher !== initialTeacher),
        [filters, initialTeacher],
    );

    const uniqueData = useMemo(() => {
        const rooms = new Set<string>();
        const teachers = new Set<string>();
        const classes = new Set<string>();
        sessionsIndex.forEach((s) => {
            if (s.room) rooms.add(s.room);
            if (s.teacher) teachers.add(s.teacher);
            if (s.className) classes.add(s.className);
        });
        return {
            rooms: Array.from(rooms).sort(),
            teachers: Array.from(teachers).sort(),
            classes: Array.from(classes).sort(),
        };
    }, [sessionsIndex]);

    const semesterBounds = useScheduleStore((s) => s.semesterBounds);

    return {
        filters,
        setFilters,
        isFilterOpen,
        toggleFilter,
        filterFn,
        hasActiveFilters,
        uniqueData,
        isAfterSemester: useMemo(() => {
            if (!semesterBounds) return false;
            const endOfDay = new Date(semesterBounds.end);
            endOfDay.setUTCHours(23, 59, 59, 999);
            return now.getTime() > endOfDay.getTime();
        }, [semesterBounds, now]),
        isBeforeSemester: useMemo(() => {
            if (!semesterBounds) return false;
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            const semesterStartDay = new Date(semesterBounds.start);
            semesterStartDay.setHours(0, 0, 0, 0);
            return today.getTime() < semesterStartDay.getTime();
        }, [semesterBounds, now]),
        now,
    };
}
