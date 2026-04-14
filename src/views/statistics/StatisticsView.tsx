/**
 * StatisticsView — Full stats dashboard.
 * Orchestrates all cards and charts. Reads from Zustand store.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Activity, Zap, Users, MapPin } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import { DAYS_OF_WEEK, getPeriodTimes } from '@/core/constants';
import type { CourseSession } from '@/core/schedule/schedule.types';
import { StatsHeader, ProgressCard, InsightCard, TeachingStructureCard, TopSubjectsCard, CoTeachersTable } from './cards';
import { HeatmapChart, WeeklyTrendChart, DailyBarChart } from './charts';
import { LayoutGrid, CalendarCheck, ChevronRight } from 'lucide-react';
import { useExamStore } from '@/core/stores/exam.store';
import { useNavigate } from 'react-router-dom';
import { getExamDateRange } from '@/core/exam/exam.utils';
import { useCalculatedTime } from '@/core/hooks/useCalculatedTime';

const COLORS = { primary: 'var(--color-accent-600)', secondary: 'var(--color-accent-400)' };

const StatisticsView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const data = useScheduleStore((s) => s.data);
    const metrics = useScheduleStore((s) => s.metrics);
    const hasExamData = useExamStore((s) => !!s.data);
    const examSessions = useExamStore((s) => s.data?.sessions ?? []);
    const examCount = examSessions.length;
    const examDateRange = useMemo(() => getExamDateRange(examSessions), [examSessions]);

    const now = useCalculatedTime(30000); // 30s tick for stats view

    if (!data || !metrics) return null;

    // Pre-normalize main teacher name for efficient comparison
    const normalizedMainTeacher = useMemo(() => {
        if (!data?.metadata.teacher) return '';
        return data.metadata.teacher.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/ths\.|ts\.|pgs\.|gs\.|gv\./g, '')
            .trim();
    }, [data?.metadata.teacher]);

    const isMainTeacher = useCallback((tName: string) => {
        if (!tName || tName === 'Chưa rõ' || tName === 'Unknown') return true;
        if (!normalizedMainTeacher) return false;
        
        const target = tName.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/ths\.|ts\.|pgs\.|gs\.|gv\./g, '')
            .trim();
            
        return target.includes(normalizedMainTeacher) || normalizedMainTeacher.includes(target);
    }, [normalizedMainTeacher]);

    const weeklyData = useMemo(() => Object.entries(metrics.hoursByWeek).map(([w, h]) => ({ name: `T${w}`, value: h })), [metrics.hoursByWeek]);
    const dailyData = useMemo(() => Object.entries(metrics.hoursByDay).map(([_d, h], i) => ({ name: t(`days.${i}`), value: h })), [metrics.hoursByDay, t]);

    const progress = useMemo(() => {
        const currentTotalMin = now.getHours() * 60 + now.getMinutes();
        const todayDate = new Date(now); todayDate.setHours(0, 0, 0, 0);

        const isSessionFinished = (s: CourseSession, sessionDate: Date) => {
            const d = new Date(sessionDate); d.setHours(0, 0, 0, 0);
            if (d < todayDate) return true;
            if (d > todayDate) return false;
            const endP = parseInt(s.timeSlot.split('-')[1] || s.timeSlot.split('-')[0]);
            const times = getPeriodTimes(s.type);
            const pData = times[endP];
            return pData ? (pData.end[0] * 60 + pData.end[1]) <= currentTotalMin : false;
        };

        let todayT = 0, todayD = 0, weekT = 0, weekD = 0, monthT = 0, monthD = 0, semT = 0, semD = 0;

        data.weeks.forEach((w) => {
            const matches = w.dateRange.match(/(\d{2})\/(\d{2})\/(\d{4})/g);
            if (!matches) return;
            const [ds, ms, ys] = matches[0].split('/').map(Number);
            const weekStart = new Date(ys, ms - 1, ds);
            const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
            const isCurrentWeek = now >= weekStart && now < weekEnd;

            DAYS_OF_WEEK.forEach((_, dIdx) => {
                const targetDate = new Date(weekStart); targetDate.setDate(weekStart.getDate() + dIdx);
                const isToday = targetDate.getTime() === todayDate.getTime();
                const dName = DAYS_OF_WEEK[dIdx];
                const sessions = [...w.days[dName].morning, ...w.days[dName].afternoon, ...w.days[dName].evening].filter((s) => isMainTeacher(s.teacher));

                sessions.forEach((s) => {
                    const finished = isSessionFinished(s, targetDate);
                    const p = s.periodCount;
                    semT += p; if (finished) semD += p;
                    if (isCurrentWeek) { weekT += p; if (finished) weekD += p; }
                    if (isToday) { todayT += p; if (finished) todayD += p; }
                    if (targetDate.getMonth() === now.getMonth() && targetDate.getFullYear() === now.getFullYear()) { monthT += p; if (finished) monthD += p; }
                });
            });
        });

        const getP = (d: number, total: number) => ({ percent: total > 0 ? Math.round((d / total) * 100) : 0, done: d, total });
        return { today: getP(todayD, todayT), week: getP(weekD, weekT), month: getP(monthD, monthT), semester: getP(semD, semT) };
    }, [data, now]);

    const avgLoad = metrics.totalWeeks > 0 ? (metrics.totalHours / metrics.totalWeeks) : 0;
    const intensityStatus = avgLoad > 20 ? t('stats.levels.high') : (avgLoad > 12 ? t('stats.levels.medium') : t('stats.levels.low'));

    const eveningSessions = metrics.shiftStats.evening.sessions;
    const eveningDisplay = eveningSessions > 0 ? `${eveningSessions} ${t('common.sessions')}` : '—';

    const weekendWarningItem = metrics.warnings.find((w) => w.key === 'stats.warningsList.weekend');
    const weekendSessionsCount = weekendWarningItem ? (weekendWarningItem.params?.count || 0) : 0;
    const weekendDisplay = weekendSessionsCount > 0 ? `${weekendSessionsCount} ${t('common.sessions')}` : '—';

    const avgLoadDisplay = avgLoad > 0 ? (
        <span>
            {avgLoad.toFixed(1)}
            <span className="text-[8px] md:text-[9px] opacity-60 ml-0.5 lowercase font-medium">{t('common.periods')}</span>
        </span>
    ) : '—';

    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="space-y-6 pt-1 pb-6 animate-in fade-in duration-300 font-sans">
            {/* 1. Header KPI */}
            <StatsHeader isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

            {/* 2. Progress + Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch transition-all duration-500">
                <div className={`transition-all duration-500 ${isCollapsed ? 'lg:col-span-3' : 'lg:col-span-2'} mb-2 lg:mb-0`}>
                    <ProgressCard progress={progress} currentDate={now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} />
                </div>
                {!isCollapsed && (
                    <div className="lg:col-span-1 animate-in fade-in zoom-in-95 duration-500">
                        <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 md:gap-4 h-full">
                            <InsightCard icon={Activity} title={t('stats.intensity')} value={intensityStatus} isAlert={avgLoad > 20} />
                            <InsightCard icon={Zap} title={t('stats.avgLoad')} value={avgLoadDisplay} isAlert={avgLoad > 20} />
                            <InsightCard icon={Clock} title={t('stats.eveningTeaching')} value={eveningDisplay} isAlert={eveningSessions > 0} />
                            <InsightCard icon={Calendar} title={t('stats.weekendTeaching')} value={weekendDisplay} isAlert={weekendSessionsCount > 0} />
                        </div>
                    </div>
                )}
            </div>

            {!isCollapsed && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* 3. Key distributions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-full min-h-[340px]">
                            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <LayoutGrid size={16} className="text-accent-600" /> {t('stats.heatmapTitle')}
                            </h3>
                            <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                                <HeatmapChart data={metrics.heatmapData} />
                            </div>
                        </div>
                        <TeachingStructureCard />
                        <TopSubjectsCard />
                    </div>

                    {/* 4. Trend charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <WeeklyTrendChart data={weeklyData} color={COLORS.primary} />
                        <DailyBarChart data={dailyData} color={COLORS.secondary} />
                    </div>

                    {/* 5. Infrastructure insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm relative overflow-hidden group transition-all hover:shadow-md flex flex-col h-full">
                            <h3 className="relative z-10 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Users size={14} className="text-accent-500" /> {t('stats.topClasses')}
                            </h3>
                            <div className="relative z-10 grid grid-cols-2 gap-4">
                                {metrics.classDistribution.slice(0, 6).map((c, i) => (
                                    <div key={`${c.className}-${i}`} className="px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-sm border border-slate-100/60 dark:border-slate-800/60 flex flex-col justify-center">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate pr-2">{c.className}</span>
                                            <span className="text-[9px] font-black text-accent-600 dark:text-accent-400">{c.periods}</span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-sm overflow-hidden">
                                            <div className="h-full bg-accent-500 rounded-sm" style={{ width: `${Math.min(100, (c.periods / metrics.totalHours) * 350)}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm relative overflow-hidden group transition-all hover:shadow-md flex flex-col h-full">
                            <h3 className="relative z-10 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <MapPin size={14} className="text-accent-400" /> {t('stats.topClassrooms')}
                            </h3>
                            <div className="relative z-10 grid grid-cols-2 gap-4">
                                {metrics.topRooms.slice(0, 6).map((r, i) => (
                                    <div key={`${r.room}-${i}`} className="px-3 py-2 bg-slate-50 dark:bg-slate-800/40 rounded-sm border border-slate-100/60 dark:border-slate-800/60 flex flex-col justify-center">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate pr-2">{r.room}</span>
                                            <span className="text-[9px] font-black text-accent-500 dark:text-accent-400">{r.periods}</span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-sm overflow-hidden">
                                            <div className="h-full bg-accent-400 rounded-sm" style={{ width: `${Math.min(100, (r.periods / metrics.totalHours) * 350)}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 6. Co-teachers */}
                    <CoTeachersTable />

                    {/* 7. Exam Schedule — Persistent Bottom Banner */}
                    {hasExamData && (
                        <button
                            onClick={() => navigate('/exam')}
                            className="w-full bg-gradient-to-r from-accent-50 to-transparent dark:from-accent-900/20 dark:to-transparent p-4 rounded-2xl border border-accent-200/60 dark:border-accent-800/40 cursor-pointer transition-all hover:shadow-sm hover:border-accent-300 dark:hover:border-accent-700 active:scale-[0.99] flex items-center justify-between group text-left"
                        >
                            <div className="flex items-center gap-3">
                                <CalendarCheck size={20} strokeWidth={1.5} className="text-accent-600 dark:text-accent-400 shrink-0" />
                                <div>
                                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{t('exam.statsCard', 'Lịch coi thi học kỳ này')}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {examCount} {t('common.sessions', 'buổi')} • {examDateRange}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-accent-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(StatisticsView);
