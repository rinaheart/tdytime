/**
 * HeatmapChart — GitHub-style heatmap for period distribution.
 * Refined with >=12px day/week/legend labels, responsive cells, and accessible role="img" tooltips.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

interface HeatmapChartProps {
    data: number[][];
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({ data }) => {
    const { t } = useTranslation();
    const weekCount = data.length;
    const dayLabels = Array.from({ length: 7 }, (_, i) => t(`daysShort.${i}`));

    const getColorClass = (count: number) => {
        if (count === 0) return 'bg-slate-100 dark:bg-slate-800/60';
        if (count <= 3) return 'bg-accent-200 dark:bg-accent-900/60';
        if (count <= 6) return 'bg-accent-400 dark:bg-accent-700';
        if (count <= 9) return 'bg-accent-600 dark:bg-accent-500';
        return 'bg-accent-800 dark:bg-accent-400';
    };

    if (weekCount === 0) {
        return (
            <p className="text-xs text-slate-600 dark:text-slate-400 py-4 text-center">
                {t('common.noData', 'Không có dữ liệu')}
            </p>
        );
    }

    return (
        <div
            tabIndex={0}
            role="region"
            aria-label={t('stats.heatmapTitle', { defaultValue: 'Biểu đồ phân bố giờ giảng' })}
            className="w-full overflow-x-auto pb-3 custom-scrollbar scrollbar-mobile-visible touch-pan-x focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-lg flex justify-start sm:justify-center"
        >
            <div className="min-w-max px-2 py-1 flex flex-col items-center">
                <div className="flex">
                    {/* Day Labels Column */}
                    <div className="flex flex-col gap-[3px] mr-2.5 pt-6">
                        {dayLabels.map((label, i) => (
                            <div
                                key={i}
                                className="h-3.5 sm:h-4 text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-end leading-none"
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Weeks Grid */}
                    <div className="flex flex-col gap-[3px]">
                        {/* Week Labels Row */}
                        <div className="flex gap-[3px] h-5 mb-1">
                            {Array.from({ length: weekCount }).map((_, i) => {
                                const weekNum = i + 1;
                                const showLabel = weekNum === 1 || weekNum % 5 === 0;
                                return (
                                    <div
                                        key={i}
                                        className="w-3.5 sm:w-4 text-xs text-slate-600 dark:text-slate-400 font-bold font-num flex items-center justify-center shrink-0 overflow-visible whitespace-nowrap"
                                    >
                                        {showLabel ? weekNum : ''}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Squares Grid */}
                        {Array.from({ length: 7 }).map((_, dayIndex) => (
                            <div key={dayIndex} className="flex gap-[3px]">
                                {data.map((weekData, weekIndex) => {
                                    const count = weekData?.[dayIndex] ?? 0;
                                    const label = `${t('common.week')} ${weekIndex + 1}, ${dayLabels[dayIndex]}: ${count} ${t('common.periods').toLowerCase()}`;
                                    return (
                                        <div
                                            key={`${weekIndex}-${dayIndex}`}
                                            role="img"
                                            aria-label={label}
                                            title={label}
                                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[2px] transition-colors cursor-default ${getColorClass(count)} ${
                                                dayIndex >= 5 && count > 0
                                                    ? 'ring-1 ring-inset ring-black/15 dark:ring-white/15'
                                                    : ''
                                            }`}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 justify-center">
                    <span>{t('stats.heatmap.less')}</span>
                    <div className="flex gap-1" aria-hidden="true">
                        {[
                            'bg-slate-100 dark:bg-slate-800/60',
                            'bg-accent-200 dark:bg-accent-900/60',
                            'bg-accent-400 dark:bg-accent-700',
                            'bg-accent-600 dark:bg-accent-500',
                            'bg-accent-800 dark:bg-accent-400',
                        ].map((c, i) => (
                            <div key={i} className={`w-3 h-3 ${c} rounded-[2px]`} />
                        ))}
                    </div>
                    <span>{t('stats.heatmap.more')}</span>
                </div>
            </div>
        </div>
    );
};

export default React.memo(HeatmapChart);
