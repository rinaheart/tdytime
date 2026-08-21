/**
 * CourseTypeCard — Settings sub-component
 * Allows toggling LT/TH for each course group.
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ListChecks, ChevronUp, ChevronDown, Check, Save, RotateCcw } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import { CourseType } from '@/core/schedule/schedule.types';

type SortField = 'code' | 'name' | 'classes' | 'groups' | 'type';

interface CourseTypeCardProps {
    onSuccess: (msg: string) => void;
}

const CourseTypeCard: React.FC<CourseTypeCardProps> = ({ onSuccess }) => {
    const { t } = useTranslation();
    const data = useScheduleStore((s) => s.data);
    const overrides = useScheduleStore((s) => s.overrides);
    const setOverrides = useScheduleStore((s) => s.setOverrides);

    const allCourses = useMemo(() => data?.allCourses || [], [data?.allCourses]);
    const [tempOverrides, setTempOverrides] = useState<Record<string, CourseType>>(overrides);
    const [prevOverrides, setPrevOverrides] = useState<Record<string, CourseType>>(overrides);
    const [sortField, setSortField] = useState<SortField>('code');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    if (overrides !== prevOverrides) {
        setPrevOverrides(overrides);
        setTempOverrides(overrides);
    }

    const sortedCourses = useMemo(() => {
        return [...allCourses].sort((a, b) => {
            if (sortField === 'type') {
                const typeA = tempOverrides[a.code] || (a.types[0] || CourseType.LT);
                const typeB = tempOverrides[b.code] || (b.types[0] || CourseType.LT);
                const cmp = typeA.localeCompare(typeB);
                return sortOrder === 'asc' ? cmp : -cmp;
            }
            let valA = a[sortField as Exclude<SortField, 'type'>] as string | string[];
            let valB = b[sortField as Exclude<SortField, 'type'>] as string | string[];
            if (Array.isArray(valA)) valA = valA.join(', ');
            if (Array.isArray(valB)) valB = valB.join(', ');
            const cmp = String(valA).localeCompare(String(valB));
            return sortOrder === 'asc' ? cmp : -cmp;
        });
    }, [allCourses, sortField, sortOrder, tempOverrides]);

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortOrder('asc'); }
    };

    const handleSetAll = (type: CourseType) => {
        const next = { ...tempOverrides };
        allCourses.forEach((c) => { next[c.code] = type; });
        setTempOverrides(next);
    };

    const handleSave = () => {
        setOverrides(tempOverrides);
        onSuccess(t('settings.toast.courseTypeSaved'));
    };

    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) return <ChevronUp size={12} className="opacity-20" />;
        return sortOrder === 'asc' ? <ChevronUp size={12} className="text-accent-500" /> : <ChevronDown size={12} className="text-accent-500" />;
    };

    if (allCourses.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <ListChecks size={20} className="text-accent-600" /> {t('settings.courseType.title')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{t('settings.courseType.description')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setTempOverrides({}); onSuccess(t('settings.toast.thresholdsReset')); }} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-2">
                        <RotateCcw size={14} /> {t('settings.courseType.reset')}
                    </button>
                    <button onClick={() => handleSetAll(CourseType.LT)} className="px-3 py-1.5 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 text-[10px] font-bold rounded-xl border border-accent-200 dark:border-accent-800 hover:bg-accent-100 transition-colors cursor-pointer flex items-center gap-2">
                        <ListChecks size={14} /> {t('settings.courseType.setAllLT')}
                    </button>
                    <button onClick={() => handleSetAll(CourseType.TH)} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-400 text-[10px] font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-2">
                        <ListChecks size={14} /> {t('settings.courseType.setAllTH')}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar max-h-[400px]">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 font-bold text-slate-400 uppercase w-10 text-center">#</th>
                            {([
                                { id: 'code', label: t('settings.courseType.code') },
                                { id: 'name', label: t('settings.courseType.course') },
                                { id: 'classes', label: t('settings.courseType.class') },
                                { id: 'groups', label: t('settings.courseType.group') },
                            ] as const).map((col) => (
                                <th key={col.id} onClick={() => handleSort(col.id)} className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    <div className="flex items-center gap-2">{col.label} {renderSortIcon(col.id)}</div>
                                </th>
                            ))}
                            <th onClick={() => handleSort('type')} className="px-4 py-3 font-bold text-slate-400 uppercase text-center w-20 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <div className="flex items-center justify-center gap-1">LT {renderSortIcon('type')}</div>
                            </th>
                            <th onClick={() => handleSort('type')} className="px-4 py-3 font-bold text-slate-400 uppercase text-center w-20 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <div className="flex items-center justify-center gap-1">TH {renderSortIcon('type')}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sortedCourses.map((c, idx) => {
                            const currentType = tempOverrides[c.code] || (c.types[0] || CourseType.LT);
                            const isLT = currentType === CourseType.LT;
                            return (
                                <tr key={c.code} className={`transition-colors duration-150 ${isLT ? 'bg-accent-50/40 dark:bg-accent-900/10' : 'bg-slate-50/60 dark:bg-slate-800/20'}`}>
                                    <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                                    <td className="px-2 py-3 font-num font-bold text-accent-600 dark:text-accent-400 text-[10px]">{c.code}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{c.name}</td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{c.classes.join(', ')}</td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{c.groups.join(', ')}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => setTempOverrides({ ...tempOverrides, [c.code]: CourseType.LT })} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto ${isLT ? 'bg-accent-600 border-accent-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                            {isLT && <Check size={16} />}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => setTempOverrides({ ...tempOverrides, [c.code]: CourseType.TH })} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto ${!isLT ? 'bg-slate-600 border-slate-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                            {!isLT && <Check size={16} />}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end border-t border-slate-100 dark:border-slate-800">
                <button onClick={handleSave} className="px-6 h-11 bg-accent-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-accent-700 active:scale-95 transition-all flex items-center gap-2">
                    <Save size={18} /> {t('common.save')}
                </button>
            </div>
        </div>
    );
};

export default CourseTypeCard;
