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
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const height = 160;
    const width = 300;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const stepX = chartWidth / (data.length - 1 || 1);

    const points = data.map((d, i) => {
        const x = padding + i * stepX;
        const y = padding + chartHeight - (d.value / maxVal) * chartHeight;
        return { x, y, name: d.name, value: d.value };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-accent-600" /> {t('stats.trend.weekly')}
            </h4>
            <div className="h-40 relative group">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                        <line
                            key={i}
                            x1={padding}
                            y1={padding + chartHeight * (1 - p)}
                            x2={width - padding}
                            y2={padding + chartHeight * (1 - p)}
                            stroke="currentColor"
                            className="text-slate-100 dark:text-slate-800"
                            strokeDasharray="4 4"
                        />
                    ))}
                    {/* Trend Line */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-500 opacity-80"
                    />
                    {/* Dots & Tooltips */}
                    {points.map((p, i) => (
                        <g key={i} className="group/dot">
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r="4"
                                fill="white"
                                stroke={color}
                                strokeWidth="2"
                                className="transition-all duration-300 group-hover/dot:r-6"
                            />
                            <text
                                x={p.x}
                                y={height - 2}
                                textAnchor="middle"
                                className="text-[10px] fill-slate-400 font-bold"
                            >
                                {p.name}
                            </text>
                            <title>{`${p.name}: ${p.value}`}</title>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
};

export default React.memo(WeeklyTrendChart);
