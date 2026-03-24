/**
 * TeachingStructureCard — LT/TH type bar + shift distribution pie chart.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import { CourseType } from '@/core/schedule/schedule.types';

const PIE_COLORS = ['var(--color-accent-600)', 'var(--color-accent-400)', 'var(--color-accent-800)'];

const TeachingStructureCard: React.FC = () => {
    const { t } = useTranslation();
    const metrics = useScheduleStore((s) => s.metrics);
    if (!metrics) return null;

    const shiftData = [
        { name: t('common.morning'), value: metrics.shiftStats.morning.sessions },
        { name: t('common.afternoon'), value: metrics.shiftStats.afternoon.sessions },
        { name: t('common.evening'), value: metrics.shiftStats.evening.sessions },
    ];
    const ltPercent = Math.round((metrics.typeDistribution[CourseType.LT] / metrics.totalHours) * 100);
    const thPercent = Math.round((metrics.typeDistribution[CourseType.TH] / metrics.totalHours) * 100);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <PieChartIcon size={16} className="text-accent-600" /> {t('stats.structure.title')}
            </h3>
            <div className="mb-6">
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-2">
                    <span>{t('stats.structure.typeLabel')}</span>
                    <span>{ltPercent}% / {thPercent}%</span>
                </div>
                <div className="h-2 w-full flex rounded-full overflow-hidden">
                    <div className="bg-accent-600" style={{ width: `${ltPercent}%` }} />
                    <div className="bg-accent-300" style={{ width: `${thPercent}%` }} />
                </div>
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">{t('stats.structure.shiftLabel')}</p>
                <div className="h-32 mb-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={shiftData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={5} dataKey="value">
                                {shiftData.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-3 text-[10px] font-medium text-slate-500">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-600" /> {t('common.morning')}</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-400" /> {t('common.afternoon')}</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-800" /> {t('common.evening')}</div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(TeachingStructureCard);
