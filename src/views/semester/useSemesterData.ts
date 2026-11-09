import { useMemo } from 'react';
import { useScheduleStore } from '@/core/stores/schedule.store';
import type { FlatSession } from '@/core/schedule/schedule.index';

export interface SemesterDataResult {
  byWeek: Record<number, FlatSession[]>;
  rawSessions: FlatSession[];
  total: number;
}

/**
 * useSemesterData — Optimized hook for Semester View.
 * Groups entire sessionsIndex by weekIdx for efficient accordion rendering.
 * Supports integrated filtering for performance.
 */
export const useSemesterData = (
  filterFn?: (s: FlatSession) => boolean
): SemesterDataResult => {
  const sessionsIndex = useScheduleStore((state) => state.sessionsIndex);
  
  return useMemo(() => {
    if (!sessionsIndex || sessionsIndex.length === 0) {
      return { byWeek: {}, rawSessions: [], total: 0 };
    }

    const filtered = filterFn ? sessionsIndex.filter(filterFn) : sessionsIndex;
    
    const byWeek = filtered.reduce((acc, session) => {
      const { weekIdx } = session;
      if (!acc[weekIdx]) {
        acc[weekIdx] = [];
      }
      acc[weekIdx].push(session);
      return acc;
    }, {} as Record<number, FlatSession[]>);
    
    return { byWeek, rawSessions: filtered, total: filtered.length };
  }, [sessionsIndex, filterFn]);
};
