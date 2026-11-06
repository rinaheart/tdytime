/**
 * DailyBarChart — Bar chart showing daily period distribution.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';

interface DailyBarChartProps {
    data: { name: string; value: number }[];
    color: string;
}

const DailyBarChart: React.FC<DailyBarChartProps> = ({ data, color }) => {
    const { t } = useTranslation();
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const height = 168;
    const width = 320;
    const paddingX = 20;
    const paddingTop = 18;
    const paddingBottom = 26;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingTop - paddingBottom;
    const barWidth = data.length > 0 ? chartWidth / data.length : chartWidth;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-accent-600 shrink-0" /> {t('stats.trend.daily')}
            </h2>
            {data.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
                    {t('common.noData', 'Không có dữ liệu')}
                </p>
            ) : (
                <div className="h-44 relative group">
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        role="img"
                        aria-label={t('stats.trend.daily')}
                        className="w-full h-full overflow-visible"
                    >
                        {/* Y-Axis Grid Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                            <line
                                key={i}
                                x1={paddingX}
                                y1={paddingTop + chartHeight * (1 - p)}
                                x2={width - paddingX}
                                y2={paddingTop + chartHeight * (1 - p)}
                                stroke="currentColor"
                                className="text-slate-100 dark:text-slate-800"
                                strokeDasharray="4 4"
                            />
                        ))}
                        {/* Bars */}
                        {data.map((d, i) => {
                            const barH = Math.max(0, (d.value / maxVal) * chartHeight);
                            const x = paddingX + i * barWidth + barWidth * 0.14;
                            const w = barWidth * 0.72;
                            return (
                                <g key={i} className="group/bar">
                                    <rect
                                        x={x}
                                        y={paddingTop + chartHeight - barH}
                                        width={w}
                                        height={barH}
                                        fill={color}
                                        rx="3"
                                        className="transition-all duration-300 opacity-85 group-hover/bar:opacity-100"
                                    />
                                    <text
                                        x={paddingX + (i + 0.5) * barWidth}
                                        y={height - 4}
                                        textAnchor="middle"
                                        className="text-xs fill-slate-500 dark:fill-slate-400 font-bold"
                                    >
                                        {d.name}
                                    </text>
                                    <title>{`${d.name}: ${d.value} ${t('common.periods').toLowerCase()}`}</title>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            )}
        </div>
    );
};

export default React.memo(DailyBarChart);
