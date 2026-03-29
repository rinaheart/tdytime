/**
 * WeekAccordion — Collapsible week section for SemesterView.
 * Uses Shared UI (WeekTableLayout, WeekCardLayout) to guarantee consistency.
 * Unified container for both Horizontal and Vertical modes.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import type { WeekSchedule, CourseType } from '@/core/schedule/schedule.types';
import { isCurrentWeek as checkIsCurrentWeek, isPastWeek as checkIsPastWeek } from '@/core/schedule/schedule.utils';
import WeekTableLayout from '../shared/WeekTableLayout';
import WeekCardLayout from '../shared/WeekCardLayout';

interface WeekAccordionProps {
    week: WeekSchedule;
    weekIdx: number;
    isExpanded: boolean;
    onToggle: () => void;
    showTeacher: boolean;
    viewMode: 'horizontal' | 'vertical';
    now: Date;
    overrides: Record<string, CourseType>;
    abbreviations: Record<string, string>;
}

const formatDateRange = (range: string) => {
    const dates = range.match(/\d{2}\/\d{2}\/\d{4}/g);
    if (dates && dates.length >= 2) return `${dates[0]} → ${dates[1]}`;
    return range;
};

const WeekAccordion: React.FC<WeekAccordionProps> = ({ 
    week, weekIdx, isExpanded, onToggle, showTeacher, viewMode, now, overrides, abbreviations 
}) => {
    const { t } = useTranslation();

    const isCurrent = checkIsCurrentWeek(week.dateRange, now);
    const isPast = checkIsPastWeek(week.dateRange, now);

    return (
        <div
            id={`week-card-${weekIdx}`}
            className={`relative z-10 bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 overflow-hidden ${isCurrent 
                ? 'border-accent-500 dark:border-accent-400 ring-2 ring-accent-500/20 shadow-lg shadow-accent-500/5' 
                : 'border-slate-200/60 dark:border-slate-800/60 shadow-sm'}`}
            style={{ contentVisibility: 'auto', containIntrinsicSize: viewMode === 'vertical' ? '100px 500px' : '1024px 500px' }}
        >
            {/* Timeline dot (Vertical only) */}
            {viewMode === 'vertical' && (
                <div className={`absolute left-4 md:left-[20px] top-6 w-2 h-2 rounded-full z-20 ${isCurrent ? 'bg-accent-500 ring-4 ring-accent-100 dark:ring-accent-900/40' : isPast ? 'bg-slate-300 dark:bg-slate-700' : 'bg-slate-200 dark:bg-slate-800'}`} />
            )}

            {/* Header (Unified for both modes) */}
            <button 
                onClick={onToggle} 
                className={`w-full flex items-center text-left transition-all ${isExpanded ? 'bg-slate-50/50 dark:bg-slate-800/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'} ${viewMode === 'vertical' ? 'p-3 md:p-4' : 'pr-3 md:pr-4'}`}
            >
                <div className={`flex items-center w-full ${viewMode === 'vertical' ? 'gap-4 pl-6 md:pl-8' : ''}`}>
                    {/* Grid-aligned Icon Container (Horizontal only) */}
                    {viewMode === 'horizontal' && (
                        <div className="w-12 flex-shrink-0 flex items-center justify-center">
                            <div className={`rounded-full flex items-center justify-center font-black transition-all shrink-0 w-8 h-8 text-sm ${isCurrent ? 'bg-accent-600 text-white shadow-md shadow-accent-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                {week.weekNumber}
                            </div>
                        </div>
                    )}

                    {/* Original Vertical Icon */}
                    {viewMode === 'vertical' && (
                        <div className={`rounded-full flex items-center justify-center font-black transition-all shrink-0 w-10 h-10 md:w-12 md:h-12 text-lg md:text-xl ${isCurrent ? 'bg-accent-600 text-white shadow-md shadow-accent-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            {week.weekNumber}
                        </div>
                    )}

                    <div className={viewMode === 'horizontal' ? 'pl-4 py-3 md:py-4' : ''}>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h4 className={`font-black uppercase tracking-tight leading-none ${viewMode === 'vertical' ? 'text-base md:text-lg' : 'text-sm'} ${isCurrent ? 'text-accent-600 dark:text-accent-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                {t('weekly.week', { number: week.weekNumber })}
                            </h4>
                            {isCurrent && <span className="px-1.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 text-[8px] font-black uppercase tracking-widest animate-pulse">{t('common.current')}</span>}
                        </div>
                        <p className={`text-slate-500 dark:text-slate-400 font-num font-bold tracking-tight ${viewMode === 'vertical' ? 'text-[10px] md:text-xs' : 'text-[10px]'}`}>{formatDateRange(week.dateRange)}</p>
                    </div>
                </div>
                <div className={`ml-auto transition-transform duration-300 pr-2 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={viewMode === 'vertical' ? 20 : 18} className="text-slate-300 dark:text-slate-600" />
                </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
                <div className="animate-in fade-in zoom-in-95 duration-300 border-t border-slate-100 dark:border-slate-800/60">
                    {viewMode === 'vertical' ? (
                        <div className="p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900/50">
                            <WeekCardLayout 
                                week={week} 
                                now={now} 
                                overrides={overrides} 
                                abbreviations={abbreviations} 
                                showTeacher={showTeacher} 
                                isCurrent={isCurrent}
                            />
                        </div>
                    ) : (
                        <WeekTableLayout 
                            week={week} 
                            now={now} 
                            overrides={overrides} 
                            abbreviations={abbreviations} 
                            showTeacher={showTeacher} 
                            isCurrent={isCurrent}
                            fullBleed={true}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(WeekAccordion);
