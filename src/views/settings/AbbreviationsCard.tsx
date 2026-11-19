/**
 * AbbreviationsCard — Unified Course Customization Table
 * Combines Course Abbreviations (Short Name) and Course Type (LT / TH) into one cohesive table.
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Edit2,
    Wand2,
    RotateCcw,
    Save,
    ChevronUp,
    ChevronDown,
    BookOpen,
    FlaskConical,
    ListChecks,
} from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import { CourseType } from '@/core/schedule/schedule.types';

type SortField = 'code' | 'name' | 'classes' | 'groups' | 'type';

interface AbbreviationsCardProps {
    onSuccess: (msg: string) => void;
}

/** Generate smart acronym from Vietnamese/English course name */
const generateAbbreviation = (name: string): string => {
    if (!name) return '';
    return name
        .trim()
        .split(/\s+/)
        .map((word) => word.replace(/[^a-zA-Z0-9À-ỹ]/g, ''))
        .filter(Boolean)
        .map((word) => word[0].toUpperCase())
        .join('');
};

const AbbreviationsCard: React.FC<AbbreviationsCardProps> = ({ onSuccess }) => {
    const { t } = useTranslation();
    const data = useScheduleStore((s) => s.data);
    const abbreviations = useScheduleStore((s) => s.abbreviations);
    const setAbbreviations = useScheduleStore((s) => s.setAbbreviations);
    const overrides = useScheduleStore((s) => s.overrides);
    const setOverrides = useScheduleStore((s) => s.setOverrides);

    const allCourses = useMemo(() => data?.allCourses || [], [data?.allCourses]);

    const [tempAbbr, setTempAbbr] = useState<Record<string, string>>(abbreviations);
    const [prevAbbr, setPrevAbbr] = useState<Record<string, string>>(abbreviations);

    const [tempOverrides, setTempOverrides] = useState<Record<string, CourseType>>(overrides);
    const [prevOverrides, setPrevOverrides] = useState<Record<string, CourseType>>(overrides);

    const [sortField, setSortField] = useState<SortField>('code');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    if (abbreviations !== prevAbbr) {
        setPrevAbbr(abbreviations);
        setTempAbbr(abbreviations);
    }

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
        else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleAutoSuggest = () => {
        const next = { ...tempAbbr };
        allCourses.forEach((c) => {
            if (!next[c.name] || next[c.name].trim() === '') {
                next[c.name] = generateAbbreviation(c.name);
            }
        });
        setTempAbbr(next);
    };

    const handleSetAllTypes = (type: CourseType) => {
        const next = { ...tempOverrides };
        allCourses.forEach((c) => {
            next[c.code] = type;
        });
        setTempOverrides(next);
    };

    const handleResetAll = () => {
        setTempAbbr({});
        setTempOverrides({});
        onSuccess(t('settings.toast.thresholdsReset'));
    };

    const handleSave = () => {
        setAbbreviations(tempAbbr);
        setOverrides(tempOverrides);
        onSuccess(t('settings.toast.abbreviationsSaved', 'Đã lưu cài đặt học phần!'));
    };

    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) return <ChevronUp size={12} className="opacity-20" />;
        return sortOrder === 'asc' ? (
            <ChevronUp size={12} className="text-accent-500" />
        ) : (
            <ChevronDown size={12} className="text-accent-500" />
        );
    };

    if (allCourses.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm md:text-base">
                        <Edit2 size={19} className="text-accent-600" />
                        <span>
                            {t('settings.abbreviations.title')} & {t('settings.courseType.title')}
                        </span>
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {t('settings.abbreviations.description', t('settings.abbreviations.subtitle'))}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={handleAutoSuggest}
                        className="px-3 py-1.5 min-h-[36px] bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 text-xs font-bold rounded-xl border border-accent-200 dark:border-accent-800 hover:bg-accent-100 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <Wand2 size={14} /> {t('settings.abbreviations.autoSuggest')}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSetAllTypes(CourseType.LT)}
                        className="px-3 py-1.5 min-h-[36px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <ListChecks size={14} /> {t('settings.courseType.setAllLT')}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSetAllTypes(CourseType.TH)}
                        className="px-3 py-1.5 min-h-[36px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <ListChecks size={14} /> {t('settings.courseType.setAllTH')}
                    </button>
                    <button
                        type="button"
                        onClick={handleResetAll}
                        className="px-3 py-1.5 min-h-[36px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <RotateCcw size={14} /> {t('settings.courseType.reset')}
                    </button>
                </div>
            </div>

            <div
                className="overflow-x-auto custom-scrollbar max-h-[480px]"
                tabIndex={0}
                role="region"
                aria-label={t('settings.abbreviations.title')}
            >
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-700">
                        <tr>
                            <th className="px-3 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase w-10 text-center">
                                #
                            </th>
                            <th
                                onClick={() => handleSort('name')}
                                className="px-3 py-3 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <div className="flex items-center gap-1.5">
                                    {t('settings.abbreviations.originalName')} {renderSortIcon('name')}
                                </div>
                            </th>
                            <th className="px-3 py-3 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-2/5 sm:w-1/3">
                                {t('settings.abbreviations.shortName')}
                            </th>
                            <th
                                onClick={() => handleSort('type')}
                                className="px-3 py-3 font-bold text-slate-600 dark:text-slate-400 uppercase text-center w-28 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <div className="flex items-center justify-center gap-1">
                                    LT / TH {renderSortIcon('type')}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sortedCourses.map((c, idx) => {
                            const currentType = tempOverrides[c.code] || (c.types[0] || CourseType.LT);
                            const isLT = currentType === CourseType.LT;
                            const classesStr = c.classes.join(', ');
                            const groupsStr = c.groups.join(', ');

                            return (
                                <tr
                                    key={c.code}
                                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                    <td className="px-3 py-3 text-center text-slate-500 dark:text-slate-400 font-medium">
                                        {idx + 1}
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                                            {c.code && (
                                                <span className="font-num font-bold text-accent-600 dark:text-accent-400 mr-1.5">
                                                    [{c.code}]
                                                </span>
                                            )}
                                            {c.name}
                                        </div>
                                        {(classesStr || groupsStr) && (
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap gap-x-2">
                                                {classesStr && (
                                                    <span>
                                                        {t('settings.courseType.class')}:{' '}
                                                        <strong className="font-semibold text-slate-600 dark:text-slate-300">
                                                            {classesStr}
                                                        </strong>
                                                    </span>
                                                )}
                                                {groupsStr && (
                                                    <span>
                                                        {t('settings.courseType.group')}:{' '}
                                                        <strong className="font-semibold text-slate-600 dark:text-slate-300">
                                                            {groupsStr}
                                                        </strong>
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <input
                                            type="text"
                                            placeholder={t('settings.abbreviations.placeholder')}
                                            aria-label={`${t('settings.abbreviations.shortName')}: ${c.name}`}
                                            value={tempAbbr[c.name] || ''}
                                            onChange={(e) =>
                                                setTempAbbr({ ...tempAbbr, [c.name]: e.target.value })
                                            }
                                            className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none text-accent-600 dark:text-accent-400 transition-all"
                                        />
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                        <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700">
                                            <button
                                                type="button"
                                                aria-label={`Chọn Lý thuyết (LT) cho ${c.name}`}
                                                aria-pressed={isLT}
                                                onClick={() =>
                                                    setTempOverrides({ ...tempOverrides, [c.code]: CourseType.LT })
                                                }
                                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                                    isLT
                                                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                }`}
                                            >
                                                <BookOpen size={11} />
                                                LT
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={`Chọn Thực hành (TH) cho ${c.name}`}
                                                aria-pressed={!isLT}
                                                onClick={() =>
                                                    setTempOverrides({ ...tempOverrides, [c.code]: CourseType.TH })
                                                }
                                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                                    !isLT
                                                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                }`}
                                            >
                                                <FlaskConical size={11} />
                                                TH
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-xs flex justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                    type="button"
                    onClick={handleSave}
                    className="w-full sm:w-auto px-6 h-11 bg-accent-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-accent-700 active:scale-95 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 cursor-pointer"
                >
                    <Save size={18} /> {t('common.save')}
                </button>
            </div>
        </div>
    );
};

export default AbbreviationsCard;
