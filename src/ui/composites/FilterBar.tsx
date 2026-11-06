/**
 * FilterBar — Composite
 * Search + filter dropdown controls for schedule views.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import type { FilterState } from '@/core/schedule/schedule.utils';

interface FilterBarProps {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
    uniqueRooms: string[];
    uniqueTeachers: string[];
    uniqueClasses: string[];
}

const selectClass =
    'h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-accent-500 transition-all appearance-none cursor-pointer flex-1';

const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange, uniqueRooms, uniqueTeachers, uniqueClasses }) => {
    const { t } = useTranslation();
    const hasActive = filters.search || filters.className || filters.room || filters.teacher;
    const reset = () => onChange({ search: '', className: '', room: '', teacher: '', sessionTime: '' });

    return (
        <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Search Input */}
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-500 opacity-70" size={16} />
                <input
                    type="text"
                    aria-label={t('filter.searchPlaceholder', 'Tìm kiếm học phần, phòng, lớp...')}
                    placeholder={t('filter.searchPlaceholder')}
                    value={filters.search}
                    onChange={(e) => onChange({ ...filters, search: e.target.value })}
                    className="w-full pl-9 pr-4 h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-accent-500 outline-none transition-all"
                />
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:flex flex-1 gap-2 items-center">
                <select
                    aria-label={t('filter.allClasses', 'Lọc theo lớp học')}
                    value={filters.className}
                    onChange={(e) => onChange({ ...filters, className: e.target.value })}
                    className={selectClass}
                >
                    <option value="">{t('filter.allClasses')}</option>
                    {uniqueClasses.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                    aria-label={t('filter.allRooms', 'Lọc theo phòng học')}
                    value={filters.room}
                    onChange={(e) => onChange({ ...filters, room: e.target.value })}
                    className={selectClass}
                >
                    <option value="">{t('filter.allRooms')}</option>
                    {uniqueRooms.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>

                <select
                    aria-label={t('filter.allTeachers', 'Lọc theo giảng viên')}
                    value={filters.teacher}
                    onChange={(e) => onChange({ ...filters, teacher: e.target.value })}
                    className={`${selectClass} md:min-w-[150px]`}
                >
                    <option value="">{t('filter.allTeachers')}</option>
                    {uniqueTeachers.map((te) => <option key={te} value={te}>{te}</option>)}
                </select>

                {hasActive && (
                    <button
                        type="button"
                        onClick={reset}
                        aria-label={t('filter.clear', 'Xóa bộ lọc')}
                        className="h-10 min-w-[40px] px-3 flex items-center justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl transition-colors cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        title={t('filter.clear')}
                    >
                        <X size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default React.memo(FilterBar);
