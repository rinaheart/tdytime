/**
 * TopSubjectsCard — Top 5 subjects by period count with progress bars.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';

const TopSubjectsCard: React.FC = () => {
    const { t } = useTranslation();
    const metrics = useScheduleStore((s) => s.metrics);
    const abbreviations = useScheduleStore((s) => s.abbreviations);
    if (!metrics) return null;

    const subjects = metrics.subjectDistribution.map((s) => ({ name: s.name, value: s.periods }));

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
            <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Layers size={16} className="text-accent-600" /> {t('stats.topSubjects')}
            </h2>
            <div className="flex-1 flex flex-col justify-between gap-4">
                {subjects.slice(0, 5).map((s, i) => {
                    const maxVal = subjects[0]?.value || 1;
                    const percent = (s.value / maxVal) * 100;
                    const rankColor = i === 0 ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/50 dark:text-accent-300' : i === 1 ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' : i === 2 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-transparent text-slate-600 dark:text-slate-400 font-bold';
                    const barColor = i === 0 ? 'bg-accent-600' : i === 1 ? 'bg-accent-500' : i === 2 ? 'bg-accent-400' : 'bg-slate-300 dark:bg-slate-700';

                    return (
                        <div key={i} className="group w-full">
                            <div className="flex items-center justify-between mb-1.5 w-full">
                                <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                                    <span className={`text-[11px] font-black w-6 h-6 shrink-0 flex items-center justify-center rounded-full ${rankColor}`}>{i + 1}</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate" title={s.name}>{abbreviations[s.name] || s.name}</span>
                                </div>
                                <span className="text-sm font-black text-accent-700 dark:text-accent-400 shrink-0">{s.value}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${percent}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(TopSubjectsCard);
