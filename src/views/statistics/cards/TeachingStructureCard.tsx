/**
 * TeachingStructureCard — Compact mobile-first stacked bars for LT/TH and Shift distribution.
 * Replaces the heavy 320px SVG donut chart with lightweight horizontal stacked bars & tabular metrics.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import { CourseType } from '@/core/schedule/schedule.types';

const SHIFT_COLORS = [
    'bg-accent-400',
    'bg-accent-600',
    'bg-accent-800 dark:bg-accent-300',
];

const SHIFT_DOT_COLORS = [
    'var(--color-accent-400)',
    'var(--color-accent-600)',
    'var(--color-accent-800)',
];

const TeachingStructureCard: React.FC = () => {
    const { t } = useTranslation();
    const metrics = useScheduleStore((s) => s.metrics);
    if (!metrics) return null;

    const ltHours = metrics.typeDistribution[CourseType.LT] || 0;
    const thHours = metrics.typeDistribution[CourseType.TH] || 0;
    const rawLt = metrics.totalHours > 0 ? (ltHours / metrics.totalHours) * 100 : 0;
    const ltPercentLabel = rawLt.toFixed(1);
    const thPercentLabel = metrics.totalHours > 0 ? (100 - parseFloat(ltPercentLabel)).toFixed(1) : '0.0';

    const shiftData = [
        { name: t('common.morning'), value: metrics.shiftStats.morning.sessions, hours: metrics.shiftStats.morning.hours },
        { name: t('common.afternoon'), value: metrics.shiftStats.afternoon.sessions, hours: metrics.shiftStats.afternoon.hours },
        { name: t('common.evening'), value: metrics.shiftStats.evening.sessions, hours: metrics.shiftStats.evening.hours },
    ];

    const totalSessions = shiftData.reduce((acc, d) => acc + d.value, 0);

    const shiftPercentages = (() => {
        if (totalSessions <= 0) return shiftData.map(() => '0.0');
        const percs = shiftData.map((d) => (d.value / totalSessions) * 100);
        const formatted = percs.map((p) => parseFloat(p.toFixed(1)));
        const currentSum = formatted.reduce((a, b) => a + b, 0);
        const diff = 100 - currentSum;
        if (diff !== 0) {
            formatted[formatted.length - 1] = parseFloat((formatted[formatted.length - 1] + diff).toFixed(1));
        }
        return formatted.map((p) => p.toFixed(1));
    })();

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-5 flex flex-col justify-between gap-5 h-full">
            <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <PieChartIcon size={16} className="text-accent-600 shrink-0" /> {t('stats.structure.title')}
            </h2>

            {/* 1. LT / TH Stacked Bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-baseline gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span className="truncate">{t('stats.structure.typeLabel')}</span>
                    <span className="font-num text-xs font-black text-accent-600 dark:text-accent-400 shrink-0">
                        {ltPercentLabel}% / {thPercentLabel}%
                    </span>
                </div>
                <div className="h-2.5 w-full flex rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 gap-0.5">
                    {parseFloat(ltPercentLabel) > 0 && (
                        <div
                            className="bg-accent-600 transition-all duration-500"
                            style={{ width: `${ltPercentLabel}%` }}
                            title={`${t('stats.theory')}: ${ltHours} (${ltPercentLabel}%)`}
                        />
                    )}
                    {parseFloat(thPercentLabel) > 0 && (
                        <div
                            className="bg-accent-300 dark:bg-accent-700 transition-all duration-500"
                            style={{ width: `${thPercentLabel}%` }}
                            title={`${t('stats.practice')}: ${thHours} (${thPercentLabel}%)`}
                        />
                    )}
                </div>
                <div className="flex justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 font-num pt-0.5">
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <span className="w-2 h-2 rounded-full bg-accent-600 shrink-0" />
                        <span className="truncate">{t('stats.theory')}:</span>{' '}
                        <strong className="text-slate-800 dark:text-slate-200">{ltHours}</strong>
                    </span>
                    <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <span className="w-2 h-2 rounded-full bg-accent-300 dark:bg-accent-700 shrink-0" />
                        <span className="truncate">{t('stats.practice')}:</span>{' '}
                        <strong className="text-slate-800 dark:text-slate-200">{thHours}</strong>
                    </span>
                </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/80" />

            {/* 2. Shift Distribution Stacked Bar + 3-Column Summary */}
            <div className="space-y-2.5">
                <div className="flex justify-between items-baseline gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span className="truncate">{t('stats.structure.shiftLabel')}</span>
                    <span className="font-num text-xs text-slate-500 dark:text-slate-400 shrink-0">
                        {metrics.totalSessions} {t('common.sessions').toLowerCase()}
                    </span>
                </div>

                <div className="h-2.5 w-full flex rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 gap-0.5">
                    {shiftData.map((d, i) => {
                        const pct = parseFloat(shiftPercentages[i]);
                        if (pct <= 0) return null;
                        return (
                            <div
                                key={i}
                                className={`${SHIFT_COLORS[i]} transition-all duration-500`}
                                style={{ width: `${pct}%` }}
                                title={`${d.name}: ${d.value} (${shiftPercentages[i]}%)`}
                            />
                        );
                    })}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                    {shiftData.map((d, i) => (
                        <div key={i} className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: SHIFT_DOT_COLORS[i] }}
                                />
                                <span className="truncate font-medium">{d.name}</span>
                            </div>
                            <div className="font-num pl-3.5 mt-0.5 truncate">
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                    {shiftPercentages[i]}%
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold ml-1">
                                    ({d.value})
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default React.memo(TeachingStructureCard);
