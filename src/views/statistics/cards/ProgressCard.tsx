/**
 * ProgressCard — Today/Week/Month/Semester progress bars.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';

interface ProgressStat {
    percent: number;
    done: number;
    total: number;
}

interface ProgressCardProps {
    progress: { today: ProgressStat; week: ProgressStat; month: ProgressStat; semester: ProgressStat };
    currentDate: string;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ progress, currentDate }) => {
    const { t } = useTranslation();
    const stats = [
        { label: t('stats.today.progressDay'), val: progress.today, color: 'bg-accent-400' },
        { label: t('stats.today.progressWeek'), val: progress.week, color: 'bg-accent-500' },
        { label: t('stats.today.progressMonth'), val: progress.month, color: 'bg-accent-600' },
        { label: t('stats.today.progressSemester'), val: progress.semester, color: 'bg-accent-700' },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-accent-600 dark:border-accent-500 ring-1 ring-accent-500/10 shadow-lg shadow-accent-500/10 transition-all duration-200 space-y-5 flex flex-col justify-between h-full relative overflow-hidden">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-accent-600 dark:text-accent-400">
                    <TrendingUp size={14} className="shrink-0" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest">{t('stats.today.progress')}</h3>
                </div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-tighter">{currentDate}</span>
            </div>
            <div className="space-y-4 flex-1 flex flex-col justify-around">
                {stats.map((p, i) => {
                    const hasSchedule = p.val.total > 0;
                    return (
                        <div key={i} className="space-y-1.5">
                            <div className="flex justify-between items-end">
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${hasSchedule ? 'text-slate-500 dark:text-slate-400' : 'text-slate-300 dark:text-slate-600'}`}>{p.label}</span>
                                <span className={`text-xs font-black ${hasSchedule ? 'text-slate-800 dark:text-slate-100' : 'text-slate-300 dark:text-slate-600'}`}>
                                    {hasSchedule ? <>{p.val.percent}%<span className="text-[9px] opacity-40 ml-1.5">({p.val.done}/{p.val.total})</span></> : '—'}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                {hasSchedule && <div className={`h-full ${p.color} transition-all duration-1000 shadow-[0_0_8px_rgba(129,140,248,0.3)]`} style={{ width: `${p.val.percent}%` }} />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(ProgressCard);
