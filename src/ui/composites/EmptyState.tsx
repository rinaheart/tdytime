/**
 * EmptyState — Contextual empty states used across Today and Weekly views.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Coffee, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type EmptyStateType = 'NO_DATA' | 'BEFORE_SEMESTER' | 'AFTER_SEMESTER' | 'NO_SESSIONS';

interface EmptyStateProps {
    type: EmptyStateType;
    daysUntilStart?: number | null;
    isWeekEmpty?: boolean;
    currentWeekRange?: string;
    variant?: 'today' | 'weekly';
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, daysUntilStart, isWeekEmpty, currentWeekRange, variant = 'today' }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const configs: Record<EmptyStateType, {
        icon: React.ReactNode;
        title: React.ReactNode;
        desc: React.ReactNode;
        action?: { label: string; path: string };
        gradient: string;
    }> = {
        BEFORE_SEMESTER: {
            icon: null,
            title: daysUntilStart != null && daysUntilStart <= 10
                ? t('stats.today.emptyStates.beforeSemesterSoon')
                : t('stats.today.emptyStates.beforeSemester'),
            desc: (
                <div className="flex flex-col items-center">
                    <span className="text-base text-slate-500 dark:text-slate-400 font-medium">
                        {t('stats.today.emptyStates.beforeSemesterPreDesc')}
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-5xl font-black text-accent-600 dark:text-accent-500">
                            {daysUntilStart != null ? String(daysUntilStart).padStart(2, '0') : '--'}
                        </span>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            {t('common.days')}
                        </span>
                    </div>
                </div>
            ),
            gradient: 'from-accent-50 to-slate-50',
        },
        AFTER_SEMESTER: {
            icon: <PartyPopper size={48} className="text-accent-600 dark:text-accent-400" />,
            title: t('stats.today.emptyStates.afterSemester'),
            desc: t('stats.today.emptyStates.afterSemesterHint'),
            action: { label: t('stats.today.afterSemester.action', { defaultValue: 'Xem thống kê' }), path: '/stats' },
            gradient: 'from-accent-50 to-slate-50',
        },
        NO_DATA: {
            icon: <Zap size={32} className="text-slate-300" />,
            title: t('stats.today.emptyStates.noDataTitle', { defaultValue: 'Chưa có dữ liệu' }),
            desc: t('stats.today.emptyStates.noDataHint'),
            action: { label: t('nav.loadData'), path: '/' },
            gradient: 'from-slate-50 to-gray-50',
        },
        NO_SESSIONS: {
            icon: <Coffee size={48} className="text-accent-600 dark:text-accent-400" />,
            title: isWeekEmpty
                ? t('stats.today.emptyStates.noSchedule', { range: currentWeekRange })
                : t('stats.today.emptyStates.dayOff'),
            desc: '',
            gradient: 'from-accent-50/50 to-slate-50/10',
        },
    };

    const config = configs[type];

    return (
        <div className={variant === 'today' ? "px-2" : ""}>
            <div className={`bg-gradient-to-br dark:bg-none dark:bg-slate-800/40 ${config.gradient} rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center min-h-[160px] transition-all`}>
                {config.icon && (
                    type === 'NO_SESSIONS' || type === 'AFTER_SEMESTER' ? (
                        <div className="mb-4 animate-bounce duration-[3000ms]">{config.icon}</div>
                    ) : (
                        <div className="w-10 h-10 mb-3 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm [&>svg]:w-5 [&>svg]:h-5">
                            {config.icon}
                        </div>
                    )
                )}

                <h3 className={`text-base font-bold mb-0.5 ${type === 'BEFORE_SEMESTER' && daysUntilStart != null && daysUntilStart <= 10
                    ? 'text-accent-600 dark:text-accent-400'
                    : 'text-slate-800 dark:text-slate-200'
                    }`}>
                    <span>{config.title}</span>
                </h3>

                {config.desc && (
                    <div className="mb-3 text-slate-500 dark:text-slate-400 mt-1">
                        {typeof config.desc === 'string' ? <span>{config.desc}</span> : config.desc}
                    </div>
                )}

                {config.action && (
                    <button
                        onClick={() => navigate(config.action!.path)}
                        className="text-xs font-bold text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors cursor-pointer bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-xl border border-transparent hover:border-accent-100 dark:hover:border-accent-900 mt-2"
                    >
                        {config.action.label}
                    </button>
                )}
            </div>
        </div>
    );
};

export default React.memo(EmptyState);
