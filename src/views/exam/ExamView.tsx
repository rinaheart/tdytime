/**
 * ExamView — Exam supervision dashboard
 * Layout mirrors TodayView: Header → Summary → Table View (Standard/Detailed)
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Play, CalendarCheck, Trash2, LayoutList, TableProperties } from 'lucide-react';
import { useExamStore, useUIStore, useScheduleStore } from '@/core/stores';
import { getExamStatus } from '@/core/exam/exam.parser';
import { EmptyState } from '@/ui';
import ConfirmModal from '@/ui/composites/ConfirmModal';

const ExamView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: examData, clearExamData } = useExamStore();
    const [viewMode, setViewMode] = useState<'table' | 'table-detailed'>('table');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [, setCurrentTime] = useState(Date.now());

    // Re-render every minute for status refresh
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const isEmpty = !examData || examData.sessions.length === 0;
    const { sessions = [] } = examData || {};

    // Calculate statuses and global index
    const sessionsWithStatus = useMemo(() => {
        return [...sessions]
            .sort((a, b) => a.startTime - b.startTime)
            .map((s, idx) => ({
                ...s,
                status: getExamStatus(s.startTime, s.endTime),
                globalIndex: idx + 1
            }));
    }, [sessions]);

    const total = sessions.length;
    const completedCount = sessionsWithStatus.filter(s => s.status === 'past').length;
    const activeSessions = sessionsWithStatus.filter(s => s.status !== 'past');
    const isAllDone = completedCount === total && total > 0;
    const ongoingCount = sessionsWithStatus.filter(s => s.status === 'ongoing').length;

    // --- Table Grouping Logic ---
    const getDayName = (dateStr: string) => {
        const [d, m, y] = dateStr.split('/').map(Number);
        const date = new Date(y, m - 1, d);
        const dayIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
        return t(`days.${dayIdx}`);
    };

    const getPeriod = (timeStr: string) => {
        const hour = parseInt(timeStr.split(':')[0], 10);
        if (hour < 12) return 'morning'; // Sáng
        if (hour < 17) return 'afternoon'; // Chiều
        return 'evening'; // Tối
    };

    const tableGroups = sessionsWithStatus.reduce((acc, session) => {
        const group = acc.find(g => g.dateStr === session.dateStr);
        const period = getPeriod(session.timeStr);
        if (group) {
            group[period].push(session);
        } else {
            acc.push({ 
                dateStr: session.dateStr, 
                dayName: getDayName(session.dateStr),
                morning: period === 'morning' ? [session] : [],
                afternoon: period === 'afternoon' ? [session] : [],
                evening: period === 'evening' ? [session] : [],
            });
        }
        return acc;
    }, [] as { 
        dateStr: string; 
        dayName: string; 
        morning: typeof sessionsWithStatus; 
        afternoon: typeof sessionsWithStatus; 
        evening: typeof sessionsWithStatus; 
    }[]);

    return (
        <div className="max-w-3xl mx-auto pb-6 animate-in fade-in duration-300">
            {/* Header — Binary Toggle between Table and Table-Detailed */}
            <ExamHeader 
                viewMode={viewMode}
                onToggleView={() => setViewMode(prev => prev === 'table' ? 'table-detailed' : 'table')}
                onClear={() => setIsModalOpen(true)} 
            />

            <main className="mt-0">
                {isEmpty ? (
                    <div className="mt-8">
                        <EmptyState type="NO_DATA" />
                    </div>
                ) : (
                    <>
                        {/* Section Summary */}
                        <div className="px-2 mb-4">
                            <div className="flex flex-wrap items-center justify-between gap-y-1">
                                <div className="flex items-center gap-2">
                                    <Play size={12} fill="currentColor" className={!isAllDone ? 'text-accent-600 dark:text-accent-500' : 'text-slate-400'} />
                                    <h2 className={`text-[12px] font-black uppercase tracking-wider ${!isAllDone ? 'text-accent-600 dark:text-accent-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {isAllDone
                                            ? t('exam.summaryDone', { defaultValue: `✓ ${total} buổi — Hoàn thành`, total })
                                            : t('exam.summaryActive', { defaultValue: `${total} buổi coi thi`, total, done: completedCount })
                                        }
                                    </h2>
                                </div>
                                {!isAllDone && activeSessions.length > 0 && (
                                    <div className="flex items-center gap-2 text-xs ml-auto">
                                        <span className="text-slate-400 font-medium whitespace-nowrap">
                                            {ongoingCount > 0
                                                ? t('exam.liveCount', { defaultValue: `${ongoingCount} đang diễn ra`, count: ongoingCount })
                                                : t('exam.pendingCount', { defaultValue: `${activeSessions.length} sắp tới`, count: activeSessions.length })
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Table Layout */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden shadow-sm mx-2">
                            {tableGroups.map((group, gIdx) => (
                                <div key={group.dateStr} className={gIdx > 0 ? 'border-t-2 border-slate-100 dark:border-slate-800' : ''}>
                                    {/* Date Header */}
                                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                                            {group.dayName}, {group.dateStr}
                                        </h3>
                                    </div>

                                    {/* Sessions (Sáng/Chiều/Tối) */}
                                    {(['morning', 'afternoon', 'evening'] as const).map(periodKey => {
                                        const sessionsInPeriod = group[periodKey];
                                        if (sessionsInPeriod.length === 0) return null;
                                        return (
                                            <div key={periodKey} className="px-4">
                                                {/* Shift Label */}
                                                <div className="flex items-center gap-3 pt-3 pb-1">
                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                                        {t(`shifts.${periodKey}`)}
                                                    </span>
                                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                                </div>

                                                {/* Rows */}
                                                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                                    {sessionsInPeriod.map(s => (
                                                        <div 
                                                            key={s.id}
                                                            className={`
                                                                flex justify-between items-start py-3 min-h-[44px] gap-4
                                                                ${s.status === 'past' ? 'opacity-50' : ''}
                                                            `}
                                                            role="article"
                                                            aria-label={`Coi thi ${s.courseName}, ${s.timeStr}, phòng ${s.room}`}
                                                        >
                                                            {/* Left: Course Name + STT + Meta */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start gap-2">
                                                                    <span className="text-[12px] font-black text-slate-400 dark:text-slate-600 mt-0.5 shrink-0 font-num">
                                                                        {String(s.globalIndex).padStart(2, '0')}.
                                                                    </span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-sm ${viewMode === 'table-detailed' ? 'font-bold' : 'font-medium'} text-slate-800 dark:text-slate-100 break-words leading-snug`}>
                                                                            {s.courseName}
                                                                        </p>
                                                                        {viewMode === 'table-detailed' && (
                                                                            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tight flex items-center gap-1">
                                                                                <span className="text-accent-600 dark:text-accent-400">
                                                                                    <span className="font-num">{s.duration}</span>'
                                                                                </span>
                                                                                <span className="mx-2 text-slate-300 dark:text-slate-700">•</span>
                                                                                <span>
                                                                                    {s.role.includes(' ') ? (
                                                                                        <>
                                                                                            {s.role.split(' ').slice(0, -1).join(' ')} <span className="font-num">{s.role.split(' ').pop()}</span>
                                                                                        </>
                                                                                    ) : (
                                                                                        <span className="font-num">{s.role}</span>
                                                                                    )}
                                                                                </span>
                                                                                <span className="mx-2 text-slate-300 dark:text-slate-700">•</span>
                                                                                <span>{s.format}</span>
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Right: Time + Room */}
                                                            <div className="text-right shrink-0">
                                                                <div className="flex items-center justify-end gap-1.5 mb-0.5">
                                                                    {s.status === 'ongoing' && (
                                                                        <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                                                                    )}
                                                                    <span className="text-sm font-black font-num text-slate-900 dark:text-white leading-none">
                                                                        {s.timeStr}
                                                                    </span>
                                                                </div>
                                                                <span className="text-sm font-bold text-accent-600 dark:text-accent-400 leading-none">
                                                                    {s.room}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* Celebration */}
                        {isAllDone && (
                            <div className="text-center py-12">
                                <div className="text-5xl mb-4">🎉</div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                                    {t('exam.celebrationTitle', 'Chúc mừng!')}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {t('exam.celebrationDesc', 'Bạn đã hoàn thành tất cả các buổi coi thi.')}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Confirmation Modal */}
            <ConfirmModal 
                isOpen={isModalOpen}
                title={t('exam.confirmClearTitle')}
                description={t('exam.confirmClearDesc')}
                confirmText={t('common.delete')}
                onConfirm={() => {
                    clearExamData();
                    const hasSchedule = !!useScheduleStore.getState().data;
                    useUIStore.getState().setToast(t('exam.toast.deleted'));
                    setIsModalOpen(false);
                    navigate(hasSchedule ? '/today' : '/', { replace: true });
                }}
                onCancel={() => setIsModalOpen(false)}
            />
        </div>
    );
};

/**
 * ExamHeader — Toggle between Standard and Detailed Table
 */
const ExamHeader: React.FC<{ 
    onClear: () => void; 
    viewMode: 'table' | 'table-detailed'; 
    onToggleView: () => void 
}> = ({ onClear, viewMode, onToggleView }) => {
    const { t } = useTranslation();
    const examData = useExamStore((s) => s.data);
    const teacherName = examData?.teacherName || '';
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (confirmDelete) {
            timer = setTimeout(() => setConfirmDelete(false), 3000);
        }
        return () => clearTimeout(timer);
    }, [confirmDelete]);

    return (
        <header className="px-2 pt-1 pb-6 flex justify-between items-start">
            <div className="flex flex-col gap-0.5 select-none">
                <h1 className="text-[22px] md:text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                    <CalendarCheck size={22} strokeWidth={1.5} className="text-accent-600 dark:text-accent-400" />
                    {t('exam.title', 'Lịch coi thi')}
                </h1>
                {teacherName && (
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-tight">
                        {teacherName}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2 mt-1">
                {/* View Toggle Button */}
                <button
                    onClick={onToggleView}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all active:scale-95
                        ${viewMode === 'table-detailed'
                            ? 'bg-accent-50 border-accent-200 text-accent-700 dark:bg-accent-950/30 dark:border-accent-800 dark:text-accent-300'
                            : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                        }
                    `}
                    title={viewMode === 'table' ? t('exam.detailedView', 'Chế độ chi tiết') : t('exam.compactView', 'Chế độ gọn')}
                >
                    {viewMode === 'table' ? <LayoutList size={16} strokeWidth={2} /> : <TableProperties size={16} strokeWidth={2} />}
                    <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">
                        {viewMode === 'table' ? t('exam.detail', 'Chi tiết') : t('exam.compact', 'Gọn')}
                    </span>
                </button>
                
                {/* Clear Button */}
                <button
                    onClick={() => {
                        if (confirmDelete) onClear();
                        else setConfirmDelete(true);
                    }}
                    className={`
                        p-2 rounded-md transition-all duration-300 relative overflow-hidden
                        ${confirmDelete 
                            ? 'text-white bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20' 
                            : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                        }
                    `}
                    title={t('exam.clearData', 'Xóa dữ liệu thi')}
                >
                    <Trash2 size={18} strokeWidth={1.5} />
                </button>
            </div>
        </header>
    );
};

export default ExamView;
