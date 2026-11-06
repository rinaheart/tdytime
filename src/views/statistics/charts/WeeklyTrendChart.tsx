/**
 * WeeklyTrendChart — Line chart showing weekly period trends.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';

interface WeeklyTrendChartProps {
    data: { name: string; value: number }[];
    color: string;
}

const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({ data, color }) => {
    const { t } = useTranslation();
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const height = 168;
    const width = 320;
    const paddingX = 24;
    const paddingTop = 18;
    const paddingBottom = 26;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingTop - paddingBottom;
    const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;

    const points = data.map((d, i) => {
        const x = data.length === 1 ? width / 2 : paddingX + i * stepX;
        const y = paddingTop + chartHeight - (d.value / maxVal) * chartHeight;
        return { x, y, name: d.name, value: d.value };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const denseLabels = points.length > 10;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-accent-600 shrink-0" /> {t('stats.trend.weekly')}
            </h2>
            {points.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
                    {t('common.noData', 'Không có dữ liệu')}
                </p>
            ) : (
                <div className="h-44 relative group">
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        role="img"
                        aria-label={t('stats.trend.weekly')}
                        className="w-full h-full overflow-visible"
                    >
                        {/* Grid lines */}
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
                        {/* Trend Line */}
                        {points.length > 1 && (
                            <path
                                d={pathData}
                                fill="none"
                                stroke={color}
                                strokeWidth="2.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-all duration-500 opacity-85"
                            />
                        )}
                        {/* Dots & Tooltips */}
                        {points.map((p, i) => {
                            const showLabel =
                                !denseLabels || i === 0 || (i + 1) % 3 === 0 || i === points.length - 1;
                            return (
                                <g key={i} className="group/dot">
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r="4"
                                        fill="white"
                                        stroke={color}
                                        strokeWidth="2"
                                        className="transition-all duration-300"
                                    />
                                    {showLabel && (
                                        <text
                                            x={p.x}
                                            y={height - 4}
                                            textAnchor="middle"
                                            className="text-xs fill-slate-500 dark:fill-slate-400 font-bold font-num"
                                        >
                                            {p.name}
                                        </text>
                                    )}
                                    <title>{`${p.name}: ${p.value} ${t('common.periods').toLowerCase()}`}</title>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            )}
        </div>
    );
};

export default React.memo(WeeklyTrendChart);
