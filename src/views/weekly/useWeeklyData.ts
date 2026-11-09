import { useMemo } from 'react';
import { useScheduleStore } from '@/core/stores/schedule.store';
import type { FlatSession } from '@/core/schedule/schedule.index';

export type ShiftType = 'morning' | 'afternoon' | 'evening' | 'night';

export interface WeeklyDataResult {
  grouped: Record<number, Record<ShiftType, FlatSession[]>>;
  rawSessions: FlatSession[];
  total: number;
  unfilteredTotal: number;
  hasSessions: boolean;
  weekRange: string;
}

/**
 * useWeeklyData — Optimized hook for Weekly View.
 * Groups FlatSession[] by dayIdx and session shift in a single pass.
 * Returns both filtered total and unfilteredTotal so callers do not need a second hook invocation.
 */
export const useWeeklyData = (
  targetWeekIdx: number, 
  filterFn?: (s: FlatSession) => boolean
): WeeklyDataResult => {
  const sessionsIndex = useScheduleStore((state) => state.sessionsIndex);
  
  return useMemo(() => {
    if (!sessionsIndex || sessionsIndex.length === 0) {
      return { grouped: {}, rawSessions: [], total: 0, unfilteredTotal: 0, hasSessions: false, weekRange: '' };
    }

    // Filter sessions for the target week (weekIdx is 1-based)
    const allWeekSessions = sessionsIndex.filter((s) => s.weekIdx === targetWeekIdx);
    const unfilteredTotal = allWeekSessions.length;
    const weekRange = unfilteredTotal > 0 ? allWeekSessions[0].weekRange : '';

    // Apply additional filtering if provided
    const weekSessions = filterFn ? allWeekSessions.filter(filterFn) : allWeekSessions;
    
    // Group by dayIdx → shift → sessions
    const grouped = weekSessions.reduce((acc, session) => {
      const { dayIdx, shift } = session;
      
      if (!acc[dayIdx]) {
        acc[dayIdx] = {
          morning: [],
          afternoon: [],
          evening: [],
          night: [],
        };
      }
      
      acc[dayIdx][shift].push(session);
      
      return acc;
    }, {} as Record<number, Record<ShiftType, FlatSession[]>>);
    
    return { 
      grouped, 
      rawSessions: weekSessions,
      total: weekSessions.length,
      unfilteredTotal,
      hasSessions: weekSessions.length > 0,
      weekRange
    };
  }, [sessionsIndex, targetWeekIdx, filterFn]);
};
