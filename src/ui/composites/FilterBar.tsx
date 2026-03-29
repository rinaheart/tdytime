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

const selectClass = 'h-10 px-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-accent-500 transition-all appearance-none cursor-pointer flex-1';

const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange, uniqueRooms, uniqueTeachers, uniqueClasses }) => {
    const { t } = useTranslation();
    const hasActive = filters.search || filters.className || filters.room || filters.teacher;
    const reset = () => onChange({ search: '', className: '', room: '', teacher: '', sessionTime: '' });

    return (
        <div className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Search Input */}
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-500 opacity-70" size={16} />
                <input
                    type="text"
                    placeholder={t('filter.searchPlaceholder')}
                    value={filters.search}
                    onChange={(e) => onChange({ ...filters, search: e.target.value })}
                    className="w-full pl-9 pr-4 h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs focus:ring-2 focus:ring-accent-500 outline-none transition-all"
                />
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:flex flex-1 gap-2 items-center">
                <select value={filters.className} onChange={(e) => onChange({ ...filters, className: e.target.value })} className={selectClass}>
                    <option value="">{t('filter.allClasses')}</option>
                    {uniqueClasses.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <select value={filters.room} onChange={(e) => onChange({ ...filters, room: e.target.value })} className={selectClass}>
                    <option value="">{t('filter.allRooms')}</option>
                    {uniqueRooms.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>

                <select value={filters.teacher} onChange={(e) => onChange({ ...filters, teacher: e.target.value })} className={`${selectClass} md:min-w-[150px]`}>
                    <option value="">{t('filter.allTeachers')}</option>
                    {uniqueTeachers.map((te) => <option key={te} value={te}>{te}</option>)}
                </select>

                {hasActive && (
                    <button
                        onClick={reset}
                        className="h-10 px-3 flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl transition-colors cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30"
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
