/**
 * PeriodStandardsCard — Settings sub-component
 * Displays the standardized period times for morning, afternoon, and evening grids.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';

const PeriodStandardsCard: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Clock size={16} className="text-accent-500" /> {t('about.periodStandards')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {([
                    {
                        key: 'morning',
                        headingClass: 'text-blue-700 dark:text-blue-400 border-blue-600 dark:border-blue-400',
                        periods: [[1, '07:00 - 07:45'], [2, '07:55 - 08:40'], [3, '08:50 - 09:35'], [4, '09:45 - 10:30']]
                    },
                    {
                        key: 'afternoon',
                        headingClass: 'text-sky-700 dark:text-sky-400 border-sky-600 dark:border-sky-400',
                        periods: [[6, '13:30 - 14:15'], [7, '14:25 - 15:10'], [8, '15:20 - 16:05'], [9, '16:15 - 17:00']]
                    },
                    {
                        key: 'evening',
                        headingClass: 'text-indigo-700 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400',
                        periods: [[11, '17:10 - 17:55'], [12, '18:00 - 18:45'], [13, '18:50 - 19:35']]
                    },
                ] as const).map(({ key, headingClass, periods }) => (
                    <div key={key} className="space-y-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h3 className={`text-xs font-black uppercase tracking-widest border-l-2 pl-2 ${headingClass}`}>
                            {t(`about.${key}`)}
                        </h3>
                        <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 font-semibold font-num">
                            {periods.map(([num, time]) => (
                                <li key={num} className="flex justify-between">
                                    <span>{t('weekly.period', { number: num })}:</span> <span>{time}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs italic text-slate-600 dark:text-slate-400">
                {t('about.note')}
            </div>
        </div>
    );
};

export default PeriodStandardsCard;
