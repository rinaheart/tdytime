/**
 * HeatmapChart — GitHub-style heatmap for period distribution.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

interface HeatmapChartProps {
    data: number[][];
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({ data }) => {
    const { t } = useTranslation();
    const weekCount = data.length;
    const dayLabels = Array.from({ length: 7 }, (_, i) => t(`days.${i}`));

    const getColorClass = (count: number) => {
        if (count === 0) return 'bg-slate-100 dark:bg-slate-800/50';
        if (count <= 3) return 'bg-accent-200 dark:bg-accent-900/60';
        if (count <= 6) return 'bg-accent-400 dark:bg-accent-700';
        if (count <= 9) return 'bg-accent-600 dark:bg-accent-500';
        return 'bg-accent-800 dark:bg-accent-400';
    };

    return (
        <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="min-w-max">
                <div className="flex">
                    <div className="flex flex-col gap-1 mr-2 pt-6">
                        {dayLabels.map((label, i) => (
                            <div key={i} className="h-4 text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-end leading-none">{label}</div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex gap-1 h-5 mb-1">
                            {Array.from({ length: weekCount }).map((_, i) => (
                                <div key={i} className="w-4 text-[9px] text-slate-600 dark:text-slate-400 text-center flex-shrink-0">
                                    {(i + 1) % 5 === 0 || i === 0 ? i + 1 : ''}
                                </div>
                            ))}
                        </div>
                        {Array.from({ length: 7 }).map((_, dayIndex) => (
                            <div key={dayIndex} className="flex gap-1">
                                {data.map((weekData, weekIndex) => (
                                    <div
                                        key={`${weekIndex}-${dayIndex}`}
                                        className={`w-4 h-4 rounded-sm transition-colors cursor-default ${getColorClass(weekData[dayIndex])} ${dayIndex >= 5 && weekData[dayIndex] > 0 ? 'ring-1 ring-inset ring-black/10 dark:ring-white/10' : ''}`}
                                        title={`${t('common.week')} ${weekIndex + 1}, ${dayLabels[dayIndex]}: ${weekData[dayIndex]} ${t('common.periods').toLowerCase()}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 justify-center">
                    <span>{t('stats.heatmap.less')}</span>
                    <div className="flex gap-1">
                        {['bg-slate-100 dark:bg-slate-800/50', 'bg-accent-200 dark:bg-accent-900/60', 'bg-accent-400 dark:bg-accent-700', 'bg-accent-600 dark:bg-accent-500', 'bg-accent-800 dark:bg-accent-400'].map((c, i) => (
                            <div key={i} className={`w-3 h-3 ${c} rounded-sm`} />
                        ))}
                    </div>
                    <span>{t('stats.heatmap.more')}</span>
                </div>
            </div>
        </div>
    );
};

export default React.memo(HeatmapChart);
