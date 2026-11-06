/**
 * StatisticsView — Mobile-First "Segmented Focus" Analytics Dashboard (Option 1).
 * Orchestrates core progress cards at the top and lazy-mounts analytical tabs below.
 * Uses precomputed sessionsIndex (O(N) single pass) via calculateScheduleProgress.
 */

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Calendar,
    Clock,
    Activity,
    Zap,
    Users,
    MapPin,
    LayoutGrid,
    CalendarCheck,
    ChevronRight,
    TrendingUp,
    Layers,
} from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import {
    StatsHeader,
    ProgressCard,
    GroupProgressCard,
    InsightCard,
    TeachingStructureCard,
    TopSubjectsCard,
    CoTeachersTable,
} from './cards';
import { HeatmapChart, WeeklyTrendChart, DailyBarChart } from './charts';
import { calculateScheduleProgress } from './stats.utils';
import { EmptyState } from '@/ui';
import { useExamStore } from '@/core/stores/exam.store';
import { useNavigate } from 'react-router-dom';
import { getExamDateRange } from '@/core/exam/exam.utils';
import { useCalculatedTime } from '@/core/hooks/useCalculatedTime';

const COLORS = { primary: 'var(--color-accent-600)', secondary: 'var(--color-accent-400)' };
const EMPTY_ARRAY: never[] = [];

type StatsTab = 'overview' | 'trends' | 'details';
const TAB_ORDER: StatsTab[] = ['overview', 'trends', 'details'];

const StatisticsView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const data = useScheduleStore((s) => s.data);
    const metrics = useScheduleStore((s) => s.metrics);
    const sessionsIndex = useScheduleStore((s) => s.sessionsIndex);
    const hasExamData = useExamStore((s) => !!s.data);
    const examSessions = useExamStore((s) => s.data?.sessions ?? EMPTY_ARRAY);
    const examCount = examSessions.length;
    const examDateRange = useMemo(() => getExamDateRange(examSessions), [examSessions]);

    const now = useCalculatedTime(30000); // 30s tick for stats view

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<StatsTab>('overview');
    const tabRefs = useRef<Record<StatsTab, HTMLButtonElement | null>>({
        overview: null,
        trends: null,
        details: null,
    });

    const teacherName = data?.metadata.teacher || '';

    const weeklyData = useMemo(() => {
        if (!metrics) return EMPTY_ARRAY;
        return Object.entries(metrics.hoursByWeek).map(([w, h]) => ({ name: `T${w}`, value: h }));
    }, [metrics]);

    const dailyData = useMemo(() => {
        if (!metrics) return EMPTY_ARRAY;
        return Object.entries(metrics.hoursByDay).map(([, h], i) => ({ name: t(`days.${i}`), value: h }));
    }, [metrics, t]);

    const { progress, groupProgress } = useMemo(
        () => calculateScheduleProgress(data, sessionsIndex, now, teacherName),
        [data, sessionsIndex, now, teacherName]
    );

    const handleTabKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            const currentIndex = TAB_ORDER.indexOf(activeTab);
            if (currentIndex === -1) return;

            let nextIndex = -1;
            if (e.key === 'ArrowRight') {
                nextIndex = (currentIndex + 1) % TAB_ORDER.length;
            } else if (e.key === 'ArrowLeft') {
                nextIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
            } else if (e.key === 'Home') {
                nextIndex = 0;
            } else if (e.key === 'End') {
                nextIndex = TAB_ORDER.length - 1;
            }

            if (nextIndex !== -1) {
                e.preventDefault();
                const nextTab = TAB_ORDER[nextIndex];
                setActiveTab(nextTab);
                tabRefs.current[nextTab]?.focus();
            }
        },
        [activeTab]
    );

    if (!data || !metrics) {
        return <EmptyState type="NO_DATA" variant="today" />;
    }

    const avgLoad = metrics.totalWeeks > 0 ? metrics.totalHours / metrics.totalWeeks : 0;
    const intensityStatus =
        avgLoad > 20 ? t('stats.levels.high') : avgLoad > 12 ? t('stats.levels.medium') : t('stats.levels.low');

    const eveningSessions = metrics.shiftStats.evening.sessions;
    const eveningDisplay = eveningSessions > 0 ? `${eveningSessions} ${t('common.sessions')}` : '—';

    const weekendWarningItem = metrics.warnings.find((w) => w.key === 'stats.warningsList.weekend');
    const weekendSessionsCount = weekendWarningItem ? Number(weekendWarningItem.params?.count) || 0 : 0;
    const weekendDisplay = weekendSessionsCount > 0 ? `${weekendSessionsCount} ${t('common.sessions')}` : '—';

    const avgLoadDisplay =
        avgLoad > 0 ? (
            <span>
                {avgLoad.toFixed(1)}
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1 lowercase">
                    {t('common.periods')}
                </span>
            </span>
        ) : (
            '—'
        );

    const maxClassPeriods = metrics.classDistribution[0]?.periods || 1;
    const maxRoomPeriods = metrics.topRooms[0]?.periods || 1;

    const tabs: { id: StatsTab; label: string; icon: typeof LayoutGrid }[] = [
        { id: 'overview', label: t('stats.tabs.overview', 'Tổng quan'), icon: LayoutGrid },
        { id: 'trends', label: t('stats.tabs.trends', 'Xu hướng'), icon: TrendingUp },
        { id: 'details', label: t('stats.tabs.details', 'Lớp & Phòng'), icon: Layers },
    ];

    return (
        <div className="space-y-4 md:space-y-5 pt-1 pb-6 animate-in fade-in duration-300 font-sans">
            {/* 1. Header KPI */}
            <StatsHeader isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

            {/* 2. General Progress Card */}
            <ProgressCard
                progress={progress}
                currentDate={now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            />

            {/* 3. Progress by Group/Class (Always visible alongside General Progress Card; table rows lazy-mounted) */}
            <GroupProgressCard groups={groupProgress} />

            {!isCollapsed && (
                <div className="space-y-4 md:space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* 4. Mobile-First Segmented Tab Control (min 44x44px touch target, WAI-ARIA tablist) */}
                    <div
                        role="tablist"
                        aria-label={t('stats.overview', 'Tổng quan hoạt động')}
                        onKeyDown={handleTabKeyDown}
                        className="bg-slate-200/75 dark:bg-slate-800/90 p-1 rounded-xl grid grid-cols-3 gap-1 border border-slate-200/80 dark:border-slate-800"
                    >
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    ref={(el) => {
                                        tabRefs.current[tab.id] = el;
                                    }}
                                    id={`stats-tab-${tab.id}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls={isActive ? `stats-panel-${tab.id}` : undefined}
                                    tabIndex={isActive ? 0 : -1}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`min-h-[44px] px-1.5 sm:px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap min-w-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                                        isActive
                                            ? 'bg-white dark:bg-slate-900 text-accent-600 dark:text-accent-400 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700/80'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <Icon size={14} className="shrink-0" />
                                    <span className="truncate">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* 5. Lazy-Mounted Tab Panels */}
                    {activeTab === 'overview' && (
                        <div
                            id="stats-panel-overview"
                            role="tabpanel"
                            aria-labelledby="stats-tab-overview"
                            tabIndex={0}
                            className="space-y-4 md:space-y-5 animate-in fade-in duration-200 focus-visible:outline-none"
                        >
                            {/* Teaching Structure */}
                            <TeachingStructureCard />

                            {/* Flat Metric Group: 4 Activity Insights (2x2 on mobile, 4-col on desktop) */}
                            <div
                                role="region"
                                aria-label={t('stats.overview', 'Chỉ số hoạt động')}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-slate-100 dark:divide-slate-800"
                            >
                                <InsightCard
                                    icon={Activity}
                                    title={t('stats.intensity')}
                                    value={intensityStatus}
                                    isAlert={avgLoad > 20}
                                />
                                <InsightCard
                                    icon={Zap}
                                    title={t('stats.avgLoad')}
                                    value={avgLoadDisplay}
                                    isAlert={avgLoad > 20}
                                />
                                <InsightCard
                                    icon={Clock}
                                    title={t('stats.eveningTeaching')}
                                    value={eveningDisplay}
                                    isAlert={eveningSessions > 0}
                                />
                                <InsightCard
                                    icon={Calendar}
                                    title={t('stats.weekendTeaching')}
                                    value={weekendDisplay}
                                    isAlert={weekendSessionsCount > 0}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'trends' && (
                        <div
                            id="stats-panel-trends"
                            role="tabpanel"
                            aria-labelledby="stats-tab-trends"
                            tabIndex={0}
                            className="space-y-4 md:space-y-5 animate-in fade-in duration-200 focus-visible:outline-none"
                        >
                            {/* Heatmap Distribution */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-5 flex flex-col justify-between">
                                <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <LayoutGrid size={16} className="text-accent-600 shrink-0" />{' '}
                                    {t('stats.heatmapTitle')}
                                </h2>
                                <div className="flex-1 w-full min-w-0">
                                    <HeatmapChart data={metrics.heatmapData} />
                                </div>
                            </div>

                            {/* Weekly & Daily Trend Charts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                <WeeklyTrendChart data={weeklyData} color={COLORS.primary} />
                                <DailyBarChart data={dailyData} color={COLORS.secondary} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'details' && (
                        <div
                            id="stats-panel-details"
                            role="tabpanel"
                            aria-labelledby="stats-tab-details"
                            tabIndex={0}
                            className="space-y-4 md:space-y-5 animate-in fade-in duration-200 focus-visible:outline-none"
                        >
                            {/* Top Subjects + Classes + Classrooms */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 items-stretch">
                                <TopSubjectsCard />

                                {/* Top Student Classes — Flat Single-Elevation List */}
                                <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
                                    <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                        <Users size={15} className="text-accent-500 shrink-0" /> {t('stats.topClasses')}
                                    </h2>
                                    {metrics.classDistribution.length === 0 ? (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                                            {t('common.noData', 'Không có dữ liệu')}
                                        </p>
                                    ) : (
                                        <div className="flex-1 flex flex-col justify-between divide-y divide-slate-100 dark:divide-slate-800/70">
                                            {metrics.classDistribution.slice(0, 6).map((c, i) => {
                                                const pct = Math.min(
                                                    100,
                                                    Math.max(0, Math.round((c.periods / maxClassPeriods) * 100))
                                                );
                                                return (
                                                    <div
                                                        key={`${c.className}-${i}`}
                                                        className="py-2.5 first:pt-0 last:pb-0 space-y-1.5"
                                                    >
                                                        <div className="flex justify-between items-center gap-2 text-xs">
                                                            <span
                                                                className="font-bold text-slate-700 dark:text-slate-200 truncate min-w-0"
                                                                title={c.className || t('common.unknown', 'Chưa rõ')}
                                                            >
                                                                {c.className || t('common.unknown', 'Chưa rõ')}
                                                            </span>
                                                            <span className="font-num tabular-nums font-black text-accent-700 dark:text-accent-400 shrink-0">
                                                                {c.periods}
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-accent-500 rounded-full transition-all duration-500"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Top Classrooms — Flat Single-Elevation List */}
                                <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
                                    <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                        <MapPin size={15} className="text-accent-400 shrink-0" />{' '}
                                        {t('stats.topClassrooms')}
                                    </h2>
                                    {metrics.topRooms.length === 0 ? (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                                            {t('common.noData', 'Không có dữ liệu')}
                                        </p>
                                    ) : (
                                        <div className="flex-1 flex flex-col justify-between divide-y divide-slate-100 dark:divide-slate-800/70">
                                            {metrics.topRooms.slice(0, 6).map((r, i) => {
                                                const pct = Math.min(
                                                    100,
                                                    Math.max(0, Math.round((r.periods / maxRoomPeriods) * 100))
                                                );
                                                const roomLabel = r.room?.trim() || t('common.unknown', 'Chưa rõ');
                                                return (
                                                    <div
                                                        key={`${roomLabel}-${i}`}
                                                        className="py-2.5 first:pt-0 last:pb-0 space-y-1.5"
                                                    >
                                                        <div className="flex justify-between items-center gap-2 text-xs">
                                                            <span
                                                                className="font-bold text-slate-700 dark:text-slate-200 truncate min-w-0"
                                                                title={roomLabel}
                                                            >
                                                                {roomLabel}
                                                            </span>
                                                            <span className="font-num tabular-nums font-black text-accent-700 dark:text-accent-400 shrink-0">
                                                                {r.periods}
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-accent-400 rounded-full transition-all duration-500"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Co-teachers */}
                            <CoTeachersTable />
                        </div>
                    )}

                    {/* 6. Exam Schedule — Persistent Bottom Banner */}
                    {hasExamData && (
                        <button
                            type="button"
                            onClick={() => navigate('/exam')}
                            className="w-full min-h-[44px] bg-gradient-to-r from-accent-50 to-transparent dark:from-accent-900/20 dark:to-transparent p-4 rounded-2xl border border-accent-200/60 dark:border-accent-800/40 cursor-pointer transition-all hover:shadow-sm hover:border-accent-300 dark:hover:border-accent-700 active:scale-[0.99] flex items-center justify-between group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <CalendarCheck
                                    size={20}
                                    strokeWidth={1.5}
                                    className="text-accent-600 dark:text-accent-400 shrink-0"
                                />
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                                        {t('exam.statsCard', 'Lịch coi thi học kỳ này')}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {examCount} {t('common.sessions', 'buổi')} • {examDateRange}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight
                                size={16}
                                className="text-slate-400 dark:text-slate-500 group-hover:text-accent-500 group-hover:translate-x-0.5 transition-all shrink-0"
                            />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(StatisticsView);
