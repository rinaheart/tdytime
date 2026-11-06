/**
 * CoTeachersTable — Co-teacher list (Grouped by Teacher)
 * Displays co-teachers with their detailed class information and total periods.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';

const CoTeachersTable: React.FC = () => {
    const { t } = useTranslation();
    const metrics = useScheduleStore((s) => s.metrics);
    const abbreviations = useScheduleStore((s) => s.abbreviations);

    const sortedCoTeachers = React.useMemo(() => {
        if (!metrics) return [];
        return metrics.coTeachers.map((ct) => ({
            ...ct,
            details: [...ct.details].sort((a, b) => {
                const sA = (abbreviations[a.subject] || a.subject).localeCompare(abbreviations[b.subject] || b.subject);
                if (sA !== 0) return sA;
                const cA = a.class.localeCompare(b.class);
                if (cA !== 0) return cA;
                return a.group.localeCompare(b.group);
            }),
        }));
    }, [metrics, abbreviations]);

    if (!metrics || sortedCoTeachers.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Users size={16} className="text-accent-500 shrink-0" /> {t('stats.coTeachers.title')}
                </h2>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {sortedCoTeachers.map((ct, i) => (
                    <div key={`${ct.name}-${i}`} className="p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center gap-2">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                {ct.name}
                            </span>
                            <span className="text-sm font-black font-num tabular-nums text-accent-600 dark:text-accent-400 shrink-0">
                                {ct.periods}
                            </span>
                        </div>
                        <div className="space-y-2 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
                            {ct.details.map((detail, idx) => {
                                const subjectName = abbreviations[detail.subject] || detail.subject;
                                return (
                                    <div key={idx} className="flex flex-col gap-0.5">
                                        <div className="flex justify-between items-center gap-2 text-xs">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 leading-snug truncate">
                                                {subjectName}
                                            </span>
                                            {ct.details.length > 1 && (
                                                <span className="text-xs font-bold font-num tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                                                    {detail.periods}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {detail.class}
                                            {detail.group && ` • ${detail.group}`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop View */}
            <div
                className="hidden md:block overflow-x-auto"
                tabIndex={0}
                role="region"
                aria-label={t('stats.coTeachers.title')}
            >
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="pl-6 pr-2 py-3 font-bold text-xs uppercase text-slate-600 dark:text-slate-400 tracking-wider w-10 text-center">
                                #
                            </th>
                            <th className="px-4 py-3 font-bold text-xs uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                                {t('stats.coTeachers.teacher')}
                            </th>
                            <th className="px-4 py-3 font-bold text-xs uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                                {t('stats.coTeachers.classDetail')}
                            </th>
                            <th className="pl-4 pr-6 py-3 font-bold text-xs uppercase text-slate-600 dark:text-slate-400 tracking-wider text-right w-20">
                                {t('stats.coTeachers.total')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sortedCoTeachers.map((ct, i) => (
                            <tr
                                key={`${ct.name}-${i}`}
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                            >
                                <td className="pl-6 pr-2 py-4 text-center text-xs font-medium text-slate-400 font-num align-top">
                                    {i + 1}
                                </td>
                                <td className="px-4 py-4 font-bold text-sm text-slate-700 dark:text-slate-200 align-top whitespace-nowrap">
                                    {ct.name}
                                </td>
                                <td className="px-4 py-4 align-top">
                                    <div className="space-y-1.5">
                                        {ct.details.map((detail, idx) => {
                                            const subjectName = abbreviations[detail.subject] || detail.subject;
                                            const classGroup = detail.group
                                                ? `${detail.class} - ${detail.group}`
                                                : detail.class;
                                            return (
                                                <div
                                                    key={idx}
                                                    className="flex items-baseline text-xs text-slate-600 dark:text-slate-400 leading-relaxed"
                                                >
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {subjectName}
                                                    </span>
                                                    <span className="mx-2 text-slate-300 dark:text-slate-600">–</span>
                                                    <span>{classGroup}</span>
                                                    {ct.details.length > 1 && (
                                                        <span className="ml-auto pl-4 text-xs font-bold text-slate-500 dark:text-slate-400 font-num tabular-nums">
                                                            {detail.periods}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </td>
                                <td className="pl-4 pr-6 py-4 text-right align-top">
                                    <span className="font-black text-accent-600 dark:text-accent-400 text-sm font-num tabular-nums">
                                        {ct.periods}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default React.memo(CoTeachersTable);
