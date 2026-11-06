/**
 * GroupProgressCard — Collapsible table & progress bar view for each teaching group/class.
 * Default state: collapsed to preserve existing dashboard layout and lazy-mount table rows.
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import { CourseType } from '@/core/schedule/schedule.types';

export interface GroupProgressItem {
    key: string;
    code: string;
    courseName: string;
    className: string;
    group: string;
    type: CourseType;
    done: number;
    total: number;
    percent: number;
}

interface GroupProgressCardProps {
    groups: GroupProgressItem[];
}

const GroupProgressCard: React.FC<GroupProgressCardProps> = ({ groups }) => {
    const { t } = useTranslation();
    const abbreviations = useScheduleStore((s) => s.abbreviations);
    // Default collapsed as requested so it doesn't affect existing UI layout
    const [isExpanded, setIsExpanded] = useState(false);

    const sortedGroups = useMemo(() => {
        return [...groups].sort((a, b) => {
            const nameA = abbreviations[a.courseName] || a.courseName;
            const nameB = abbreviations[b.courseName] || b.courseName;
            const cmpName = nameA.localeCompare(nameB, 'vi');
            if (cmpName !== 0) return cmpName;
            const cmpClass = a.className.localeCompare(b.className, 'vi');
            if (cmpClass !== 0) return cmpClass;
            return a.group.localeCompare(b.group, 'vi');
        });
    }, [groups, abbreviations]);

    const completedCount = useMemo(
        () => sortedGroups.filter((g) => g.total > 0 && g.done >= g.total).length,
        [sortedGroups]
    );

    if (sortedGroups.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
            {/* Header — Clickable to expand/collapse (min-h-[44px] touch target) */}
            <button
                id="group-progress-header"
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                aria-expanded={isExpanded}
                aria-controls={isExpanded ? 'group-progress-panel' : undefined}
                className="w-full min-h-[44px] px-4 md:px-5 py-3.5 md:py-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500"
            >
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <Layers size={16} className="text-accent-600 dark:text-accent-400 shrink-0" />
                        <h2 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">
                            {t('stats.groupProgress.title', 'Tiến độ theo Nhóm/Lớp')}
                        </h2>
                    </div>
                    <p className="text-xs font-normal text-accent-600 dark:text-accent-400 font-num mt-1 pl-6">
                        {t('stats.groupProgress.completedGroups', {
                            done: completedCount,
                            total: sortedGroups.length,
                            defaultValue: `${completedCount}/${sortedGroups.length} nhóm hoàn thành`,
                        })}
                    </p>
                </div>

                <div
                    className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center transition-transform duration-300 ${
                        isExpanded
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rotate-180'
                            : 'bg-accent-50 dark:bg-accent-900/40 text-accent-600 dark:text-accent-400'
                    }`}
                >
                    <ChevronDown size={16} />
                </div>
            </button>

            {/* Collapsible Body (Lazy-mounted only when expanded) */}
            {isExpanded && (
                <div
                    id="group-progress-panel"
                    role="region"
                    aria-labelledby="group-progress-header"
                    className="border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                        {sortedGroups.map((g, idx) => {
                            const displayName = abbreviations[g.courseName] || g.courseName;
                            const isDone = g.total > 0 && g.done >= g.total;
                            const classGroupLabel = [g.className, g.group].filter(Boolean).join(' • ') || g.code;
                            const clampedPercent = Math.min(100, Math.max(0, g.percent));

                            return (
                                <div key={g.key} className="p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-slate-400 font-num shrink-0">
                                                    {idx + 1}.
                                                </span>
                                                <span
                                                    className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate"
                                                    title={g.courseName}
                                                >
                                                    {displayName}
                                                </span>
                                                <span
                                                    className={`text-xs font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                                        g.type === CourseType.TH
                                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                            : 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300'
                                                    }`}
                                                >
                                                    {g.type}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                                {classGroupLabel}
                                                {g.code && classGroupLabel !== g.code && (
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-1.5 font-num">
                                                        ({g.code})
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0 font-num tabular-nums">
                                            <span
                                                className={`text-xs font-black ${
                                                    isDone
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-slate-800 dark:text-slate-100'
                                                }`}
                                            >
                                                {clampedPercent}%
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold ml-1">
                                                ({g.done}/{g.total})
                                            </span>
                                        </div>
                                    </div>

                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${
                                                isDone
                                                    ? 'bg-emerald-500'
                                                    : g.done > 0
                                                      ? 'bg-accent-500'
                                                      : 'bg-transparent'
                                            }`}
                                            style={{ width: `${clampedPercent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop View */}
                    <div
                        className="hidden md:block overflow-x-auto"
                        tabIndex={0}
                        role="region"
                        aria-label={t('stats.groupProgress.title', 'Tiến độ theo Nhóm/Lớp')}
                    >
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="pl-6 pr-2 py-3 font-bold text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider w-10 text-center">
                                        #
                                    </th>
                                    <th className="px-4 py-3 font-bold text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                        {t('stats.groupProgress.course', 'Học phần')}
                                    </th>
                                    <th className="px-4 py-3 font-bold text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                        {t('stats.groupProgress.classGroup', 'Lớp / Nhóm')}
                                    </th>
                                    <th className="px-4 py-3 font-bold text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider w-1/3">
                                        {t('stats.groupProgress.progress', 'Tiến độ')}
                                    </th>
                                    <th className="pl-4 pr-6 py-3 font-bold text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider text-right w-32">
                                        {t('stats.groupProgress.hours', 'Đã dạy / Tổng')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                                {sortedGroups.map((g, idx) => {
                                    const displayName = abbreviations[g.courseName] || g.courseName;
                                    const isDone = g.total > 0 && g.done >= g.total;
                                    const classGroupLabel = [g.className, g.group].filter(Boolean).join(' • ') || '—';
                                    const clampedPercent = Math.min(100, Math.max(0, g.percent));

                                    return (
                                        <tr
                                            key={g.key}
                                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                                        >
                                            <td className="pl-6 pr-2 py-3.5 text-center text-xs font-medium text-slate-400 font-num">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="font-bold text-slate-800 dark:text-slate-100"
                                                        title={g.courseName}
                                                    >
                                                        {displayName}
                                                    </span>
                                                    <span
                                                        className={`text-xs font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                                            g.type === CourseType.TH
                                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                                : 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300'
                                                        }`}
                                                    >
                                                        {g.type}
                                                    </span>
                                                </div>
                                                {g.code && (
                                                    <div className="text-xs text-slate-400 dark:text-slate-500 font-num mt-0.5">
                                                        {g.code}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                                {classGroupLabel}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ${
                                                                isDone
                                                                    ? 'bg-emerald-500'
                                                                    : g.done > 0
                                                                      ? 'bg-accent-500'
                                                                      : 'bg-transparent'
                                                            }`}
                                                            style={{ width: `${clampedPercent}%` }}
                                                        />
                                                    </div>
                                                    <span
                                                        className={`text-xs font-black w-11 text-right font-num tabular-nums shrink-0 ${
                                                            isDone
                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                : 'text-slate-700 dark:text-slate-200'
                                                        }`}
                                                    >
                                                        {clampedPercent}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="pl-4 pr-6 py-3.5 text-right font-num tabular-nums whitespace-nowrap">
                                                <div className="inline-flex items-center justify-end gap-1.5">
                                                    {isDone && (
                                                        <CheckCircle2
                                                            size={14}
                                                            className="text-emerald-500 shrink-0"
                                                        />
                                                    )}
                                                    <span className="font-black text-slate-800 dark:text-slate-100">
                                                        {g.done}
                                                    </span>
                                                    <span className="text-slate-400 dark:text-slate-500">/</span>
                                                    <span className="font-bold text-slate-500 dark:text-slate-400">
                                                        {g.total}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(GroupProgressCard);
