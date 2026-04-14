/**
 * ExamView — Exam supervision dashboard
 * Layout mirrors TodayView: Header → Summary → Table View (Standard/Detailed)
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Play, CalendarCheck, Trash2, LayoutList, TableProperties, ChevronDown } from 'lucide-react';
import { useExamStore, useUIStore, useScheduleStore } from '@/core/stores';
import { getExamStatus } from '@/core/exam/exam.parser';
import { useCalculatedTime } from '@/core/hooks/useCalculatedTime';
import { EmptyState } from '@/ui';
import ConfirmModal from '@/ui/composites/ConfirmModal';

const STT_COL_CLASS = "w-7 h-7 shrink-0 flex items-center justify-center transition-all duration-500";
const TIME_COL_CLASS = "w-[60px] text-right shrink-0 font-bold font-mono tabular-nums text-[13px] leading-none";
const RIGHT_COL_CLASS = "w-[60px] shrink-0 flex flex-col items-end gap-0.5";

// --- Sub-components ---

const ExamRow = React.memo(({ 
    session, 
    viewMode, 
    isNext,
    globalIndex,
}: { 
    session: any, 
    viewMode: string, 
    isNext: boolean, 
    globalIndex: number,
}) => {
    const isOngoing = session.status === 'ongoing';
    
    return (
        <div className={`flex flex-col py-2.5 min-h-[52px] ${session.status === 'past' ? 'opacity-50' : ''}`} role="article">
            {/* Row 1: STT | Course Name | Time (Top Alignment) */}
            <div className="flex items-center gap-3">
                <div className={STT_COL_CLASS}>
                    {isNext ? (
                        <span className={`
                            relative w-7 h-7 rounded-full flex items-center justify-center font-black text-[12px] font-num
                            ${isOngoing 
                                ? 'bg-accent-500 text-white animate-pulse ring-2 ring-accent-500 ring-offset-2 dark:ring-offset-slate-900 shadow-lg shadow-accent-500/30' 
                                : 'bg-accent-100 dark:bg-accent-950/40 text-accent-700 dark:text-accent-400 ring-1 ring-accent-200 dark:ring-accent-800'
                            }
                        `}>
                            {String(globalIndex).padStart(2, '0')}
                            {isOngoing && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent-500 border-2 border-white dark:border-slate-900 z-10" />}
                        </span>
                    ) : (
                        <span className="text-[12px] font-black text-slate-400 dark:text-slate-600 font-num">
                            {String(globalIndex).padStart(2, '0')}.
                        </span>
                    )}
                </div>
                
                <p className={`
                    flex-1 min-w-0 text-sm ${viewMode === 'table-detailed' ? 'font-bold' : 'font-medium'} 
                    text-slate-800 dark:text-slate-100
                    ${viewMode === 'table-detailed' ? 'line-clamp-2 break-words leading-tight' : 'truncate'}
                `} title={session.courseName}>
                    {session.courseName}
                </p>

                <div className={TIME_COL_CLASS}>
                    <span className={`font-bold ${isOngoing ? 'text-accent-600 dark:text-accent-500' : 'text-slate-900 dark:text-white'}`}>
                        {session.timeStr}
                    </span>
                </div>
            </div>

            {/* Row 2: Info | Room (Subtle & Aligned) */}
            <div className="flex items-center gap-3 ml-10 -mt-0.5"> {/* -mt-0.5 to pull Row 2 closer */}
                <div className="flex-1 min-w-0 h-4 flex items-center"> {/* Fixed height for alignment consistency */}
                    {viewMode === 'table-detailed' && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
                            <span className="font-num font-semibold">{session.duration}'</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="normal-case lowercase">{session.role}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="normal-case lowercase truncate" title={session.format}>{session.format}</span>
                        </p>
                    )}
                </div>
                
                <div className="w-[60px] text-right shrink-0">
                    <span className="text-sm font-bold text-accent-600 dark:text-accent-400 leading-none">
                        {session.room}
                    </span>
                </div>
            </div>
        </div>
    );
});

const CompletedExamRow = React.memo(({ session }: { session: any }) => (
    <div className="flex items-center gap-3 py-2 text-sm opacity-60 hover:opacity-100 transition-opacity">
        <div className="w-7 text-center shrink-0 text-[11px] font-black text-slate-400 dark:text-slate-500 font-num">
            {String(session.globalIndex).padStart(2, '0')}
        </div>
        <div className="flex-1 min-w-0">
            <span className="font-semibold text-slate-600 dark:text-slate-400 truncate block">
                {session.courseName}
            </span>
        </div>
        <div className={RIGHT_COL_CLASS}>
            <span className={`${TIME_COL_CLASS} text-slate-500 dark:text-slate-400`}>
                {session.timeStr}
            </span>
            <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 leading-none">
                {session.room}
            </span>
        </div>
    </div>
));

const ExamView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: examData, clearExamData } = useExamStore();
    const [viewMode, setViewMode] = useState<'table' | 'table-detailed'>('table');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const now = useCalculatedTime(10000); // 10s tick for exam view
    const currentTimeTs = now.getTime();

    const isEmpty = !examData || examData.sessions.length === 0;
    const { sessions = [] } = examData || {};

    // Calculate statuses and global index
    const sessionsWithStatus = useMemo(() => {
        return [...sessions]
            .sort((a, b) => a.startTime - b.startTime)
            .map((s, idx) => ({
                ...s,
                status: getExamStatus(s.startTime, s.endTime, currentTimeTs),
                globalIndex: idx + 1
            }));
    }, [sessions, currentTimeTs]);

    const total = sessions.length;
    const completedCount = sessionsWithStatus.filter(s => s.status === 'past').length;
    const activeSessions = sessionsWithStatus.filter(s => s.status !== 'past');
    const completedSessions = sessionsWithStatus.filter(s => s.status === 'past');
    const nextExam = activeSessions[0];

    const isAllDone = completedCount === total && total > 0;
    const ongoingCount = sessionsWithStatus.filter(s => s.status === 'ongoing').length;

    // --- Table Grouping Logic (Active only) ---
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

    const tableGroups = activeSessions.reduce((acc, session) => {
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

    const completedGroups = completedSessions.reduce((acc, session) => {
        const group = acc.find(g => g.dateStr === session.dateStr);
        if (group) {
            group.sessions.push(session);
        } else {
            acc.push({
                dateStr: session.dateStr,
                dayName: getDayName(session.dateStr),
                sessions: [session]
            });
        }
        return acc;
    }, [] as {
        dateStr: string;
        dayName: string;
        sessions: typeof sessionsWithStatus;
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

                        {/* Table Layout (Active Groups) */}
                        {tableGroups.length > 0 && (
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
                                                            <ExamRow 
                                                                key={s.id}
                                                                session={s}
                                                                viewMode={viewMode}
                                                                isNext={s.id === nextExam?.id}
                                                                globalIndex={s.globalIndex}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Completed Section (Today style) */}
                        {completedSessions.length > 0 && (
                            <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 mt-6 mx-2">
                                <details className="group" open={completedSessions.length < 5}>
                                    <summary className="list-none flex items-center justify-between cursor-pointer [&::-webkit-details-marker]:hidden">
                                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            {t('common.completedItem')} ({completedSessions.length})
                                        </h3>
                                        <ChevronDown size={14} className="text-slate-400 group-open:rotate-180 transition-transform duration-300" />
                                    </summary>
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {completedGroups.map((group) => (
                                            <div key={group.dateStr} className="mt-4 first:mt-0">
                                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 mt-3 first:mt-0">
                                                    {group.dayName}, {group.dateStr}
                                                </h4>
                                                <div className="space-y-1">
                                                    {group.sessions.map((s) => (
                                                        <CompletedExamRow key={s.id} session={s} />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        )}

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
