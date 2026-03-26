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
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const height = 160;
    const width = 300;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = chartWidth / data.length;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <BarChart3 size={16} className="text-accent-600" /> {t('stats.trend.daily')}
            </h4>
            <div className="h-40 relative group">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Y-Axis Grid Lines */}
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
                    {/* Bars */}
                    {data.map((d, i) => {
                        const barH = (d.value / maxVal) * chartHeight;
                        const x = padding + i * barWidth + barWidth * 0.1;
                        const w = barWidth * 0.8;
                        return (
                            <g key={i} className="group/bar">
                                <rect
                                    x={x}
                                    y={padding + chartHeight - barH}
                                    width={w}
                                    height={barH}
                                    fill={color}
                                    rx="4"
                                    className="transition-all duration-300 opacity-80 group-hover/bar:opacity-100"
                                />
                                <text
                                    x={padding + (i + 0.5) * barWidth}
                                    y={height - 2}
                                    textAnchor="middle"
                                    className="text-[10px] fill-slate-400 font-bold"
                                >
                                    {d.name}
                                </text>
                                {/* Simple Tooltip on hover */}
                                <title>{`${d.name}: ${d.value}`}</title>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default React.memo(DailyBarChart);
