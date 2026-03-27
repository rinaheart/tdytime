/**
 * TeachingStructureCard — LT/TH type bar + shift distribution pie chart.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import { CourseType } from '@/core/schedule/schedule.types';

const PIE_COLORS = ['var(--color-accent-400)', 'var(--color-accent-600)', 'var(--color-accent-800)'];

const TeachingStructureCard: React.FC = () => {
    const { t } = useTranslation();
    const metrics = useScheduleStore((s) => s.metrics);
    if (!metrics) return null;

    const shiftData = [
        { name: t('common.morning'), value: metrics.shiftStats.morning.sessions },
        { name: t('common.afternoon'), value: metrics.shiftStats.afternoon.sessions },
        { name: t('common.evening'), value: metrics.shiftStats.evening.sessions },
    ];
    const rawLt = (metrics.typeDistribution[CourseType.LT] / (metrics.totalHours || 1)) * 100;
    const ltPercentLabel = rawLt.toFixed(1);
    const thPercentLabel = (100 - parseFloat(ltPercentLabel)).toFixed(1);

    const totalSessions = shiftData.reduce((acc, d) => acc + d.value, 0) || 1;

    // Calculate percentages for shifts with 1 decimal place, ensuring sum is 100.0
    const shiftPercentages = (() => {
        const percs = shiftData.map(d => (d.value / totalSessions) * 100);
        const formatted = percs.map(p => parseFloat(p.toFixed(1)));
        // Adjust last non-zero item or just the last item to make sum 100.0
        const currentSum = formatted.reduce((a, b) => a + b, 0);
        const diff = 100 - currentSum;
        if (diff !== 0) {
            formatted[formatted.length - 1] = parseFloat((formatted[formatted.length - 1] + diff).toFixed(1));
        }
        return formatted.map(p => p.toFixed(1));
    })();

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-full">
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <PieChartIcon size={16} className="text-accent-600" /> {t('stats.structure.title')}
            </h3>
            <div className="mb-8">
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-2">
                    <span>{t('stats.structure.typeLabel')}</span>
                    <span className="text-accent-600 dark:text-accent-400">{ltPercentLabel}% / {thPercentLabel}%</span>
                </div>
                <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <div className="bg-accent-600" style={{ width: `${ltPercentLabel}%` }} />
                    <div className="bg-accent-300 dark:bg-accent-700" style={{ width: `${thPercentLabel}%` }} />
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-4 text-center">{t('stats.structure.shiftLabel')}</p>
                <div className="h-32 mb-6 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-28 h-28 transform -rotate-90">
                        {(() => {
                            let currentOffset = 0;
                            return shiftData.map((d, i) => {
                                const percentage = parseFloat(shiftPercentages[i]);
                                if (percentage === 0) return null;
                                const strokeDasharray = `${percentage} ${100 - percentage}`;
                                const strokeDashoffset = -currentOffset;
                                currentOffset += percentage;
                                return (
                                    <circle
                                        key={i}
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="transparent"
                                        stroke={PIE_COLORS[i]}
                                        strokeWidth="20"
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        pathLength="100"
                                        className="transition-all duration-500 hover:opacity-80 cursor-default"
                                    >
                                        <title>{`${d.name}: ${d.value} (${percentage}%)`}</title>
                                    </circle>
                                );
                            });
                        })()}
                        <circle cx="50" cy="50" r="25" className="fill-white dark:fill-slate-900" />
                    </svg>
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 w-full mx-auto">
                    {shiftData.map((d, i) => {
                        const percentage = shiftPercentages[i];
                        return (
                            <div key={i} className="flex items-center gap-1.5 text-[10px] font-medium">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                                <span className="text-slate-600 dark:text-slate-400 whitespace-nowrap">{d.name} <span className="font-black text-slate-700 dark:text-slate-300 ml-1">{percentage}%</span></span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default React.memo(TeachingStructureCard);
